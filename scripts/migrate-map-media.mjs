#!/usr/bin/env node
// ============================================================
// TravelCraft — migrate-map-media.mjs
// ------------------------------------------------------------
// Moves legacy base64 media (data:image/*, data:video/*, ...) out of the
// maps.data / maps.summary JSONB blobs and into Supabase Storage, replacing
// each blob with its public URL. This shrinks map rows from multi-MB to a few
// KB so "Preview Map" / fetchMapById stops downloading megabytes per open.
//
// It deep-scans the whole `data` document (covers, backgrounds, element
// images, location selfies, videos, pins...) — anything matching a
// `data:<mime>;base64,<payload>` substring — uploads each unique blob under
// media/maps/<id>/migrated-*.<ext>, rewrites the URLs in place, rebuilds the
// summary column and saves the row. Idempotent: already-URL media is skipped.
//
// Requires:
//   SUPABASE_URL            project URL  (https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY  service role key (bypasses RLS for storage)
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-map-media.mjs
//   (add --dry-run to only report what would change)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MEDIA_BUCKET = 'media';
const DATAURL_RE = /data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

const safeExt = (mime) => {
  const fallback = { video: 'mp4', image: 'jpg', audio: 'mp3' }[mime.split('/')[0]] || 'bin';
  const name = (mime.split('/')[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;
  return name || fallback;
};

// Walk a JSON value, collecting unique data-URL matches (whole match -> ref).
const collectDataUrls = (value, map) => {
  if (typeof value === 'string') {
    for (const match of value.matchAll(DATAURL_RE)) {
      map.set(match[0], { mime: match[1], payload: match[2] });
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectDataUrls(entry, map);
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) collectDataUrls(value[key], map);
  }
};

// Walk a JSON value replacing every known data URL with its storage URL.
const replaceDataUrls = (value, urlMap) => {
  if (typeof value === 'string') {
    return value.replace(DATAURL_RE, (match) => urlMap.get(match) || match);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => replaceDataUrls(entry, urlMap));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = replaceDataUrls(entry, urlMap);
    }
    return out;
  }
  return value;
};

// Mirror of src/lib/supabaseMaps.js#mapItemSummary so the summary stays in
// sync with the (migrated) data blob (imageUrl / bgThemeUrl / previewBackground).
const mapItemSummary = (item) => {
  const details = item.details && typeof item.details === 'object' ? item.details : {};
  const elementCount = Array.isArray(item.editorState?.elements) ? item.editorState.elements.length : 0;
  const pinCount = Array.isArray(item.pins) ? item.pins.length : elementCount;
  return {
    title: item.title || details.title || null,
    imageUrl: item.imageUrl || item.editorState?.publishCoverImage || details.imageUrl || null,
    pinCount: pinCount || 0,
    lore: details.lore || item.description || null,
    region: details.region || null,
    category: item.category || null,
    rarity: item.rarity || details.rarity || 'common',
    rarityColor: item.rarityColor || null,
    tags: Array.isArray(item.tags) ? item.tags : (Array.isArray(details.tags) ? details.tags : []),
    discoveredBy: item.discoveredBy || null,
    authorBadgeColor: item.authorBadgeColor || null,
    authorRole: item.authorRole || null,
    previewBackground: item.previewBackground || null,
    bgThemeUrl: item.bgThemeUrl || item.editorState?.backgroundImage || null,
    details: {
      title: details.title || item.title || null,
      region: details.region || null,
      type: details.type || 'Community Map',
      tag: details.tag || 'Custom',
      lore: details.lore || null,
      hours: details.hours || null,
      fee: details.fee || null,
      bestTime: details.bestTime || null,
      travel: details.travel || null,
      popularity: details.popularity ?? null,
      visitors: details.visitors || null,
      rarity: details.rarity || null,
    },
  };
};

// Upload one data-URL blob to storage; returns the public URL.
const uploadBlob = async (mapId, index, dataUrl, isDryRun) => {
  const match = DATAURL_RE.exec(dataUrl);
  DATAURL_RE.lastIndex = 0;
  if (!match) return '';
  const mime = match[1];
  const payload = match[2];
  const ext = safeExt(mime);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `maps/${encodeURIComponent(mapId)}/migrated-${index}-${stamp}.${ext}`;
  if (isDryRun) {
    return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
  }
  const buffer = Buffer.from(payload, 'base64');
  const blob = new Blob([buffer], { type: mime });
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    contentType: mime,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
};

const processTable = async (table) => {
  const { data: rows, error } = await supabase
    .from(table)
    .select('id, data, summary')
    .order('updated_at', { ascending: false });
  if (error) throw error;

  let totalBlobs = 0;
  let totalBytes = 0;
  let migratedRows = 0;

  for (const row of rows || []) {
    const item = row.data && typeof row.data === 'object' ? row.data : {};
    const blobs = new Map();
    collectDataUrls(item, blobs);
    if (!blobs.size) continue;

    const urlMap = new Map();
    let index = 0;
    for (const [match, meta] of blobs) {
      index += 1;
      const url = await uploadBlob(row.id, index, match, DRY_RUN);
      if (url) urlMap.set(match, url);
      totalBytes += meta.payload.length;
    }
    if (!urlMap.size) continue;

    const nextData = replaceDataUrls(item, urlMap);
    const nextSummary = mapItemSummary(nextData);
    migratedRows += 1;
    totalBlobs += urlMap.size;

    if (!DRY_RUN) {
      const { error: upsertError } = await supabase
        .from(table)
        .upsert({ id: row.id, data: nextData, summary: nextSummary, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (upsertError) {
        console.warn(`  ! ${table}/${row.id}: save failed — ${upsertError.message}`);
        continue;
      }
    }

    console.log(`${DRY_RUN ? '[DRY] ' : ''}${table}/${row.id}: ${urlMap.size} blob(s) → storage`);
  }

  return { totalBlobs, totalBytes, migratedRows };
};

for (const table of ['maps', 'base_maps']) {
  const result = await processTable(table);
  console.log(
    `\n== ${table} == ${DRY_RUN ? 'DRY RUN, nothing written' : 'done'}: ` +
    `${result.migratedRows} rows touched, ${result.totalBlobs} blobs, ~${(result.totalBytes / 1024 / 1024).toFixed(2)} MB of base64 removed from JSONB`
  );
}

if (DRY_RUN) {
  console.log('\nDry-run complete. Remove --dry-run to apply.');
}