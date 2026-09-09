import { supabase } from './supabaseClient';

// Lightweight rows (from fetchMapFeed) carry only `summary` — the full `data`
// JSONB (background/element/photo base64) is fetched on demand via fetchMapById.
export const isSummaryItem = (item) => Boolean(item && item._summaryOnly);

export const mapRowToItem = (row) => ({
  ...(row.data || {}),
  id: row.id,
  ownerId: row.owner_id ?? row.data?.ownerId ?? null,
  updatedAt: row.updated_at || row.data?.updatedAt || null
});

// Build the small per-map summary persisted to the maps.summary column on save.
export const mapItemSummary = (item) => {
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
      rarity: details.rarity || null
    }
  };
};

const mapItemToRow = (item) => ({
  id: item.id,
  owner_id: item.ownerId ?? null,
  title: item.title ?? 'UNTITLED MAP',
  privacy: item.privacy ?? 'private',
  is_editor_map: Boolean(item.isEditorMap),
  summary: mapItemSummary(item),
  data: item
});

// A summary DB row mapped into a shape the cards expect (imageUrl, details,
// tags, rarity, author info...) WITHOUT the heavy `data` blob.
const summaryToItem = (row) => {
  const s = row.summary && typeof row.summary === 'object' ? row.summary : {};
  const d = s.details && typeof s.details === 'object' ? s.details : {};
  return {
    id: row.id,
    ownerId: row.owner_id ?? null,
    title: s.title || row.title || 'UNTITLED MAP',
    privacy: row.privacy || 'private',
    isEditorMap: Boolean(row.is_editor_map),
    updatedAt: row.updated_at || null,
    imageUrl: s.imageUrl || null,
    pinCount: s.pinCount ?? 0,
    lore: s.lore || '',
    region: s.region || '',
    category: s.category || 'landmarks',
    rarity: s.rarity || 'common',
    rarityColor: s.rarityColor || 'bg-gray-400 text-white',
    tags: Array.isArray(s.tags) ? s.tags : [],
    discoveredBy: s.discoveredBy || '',
    authorBadgeColor: s.authorBadgeColor || 'bg-[#cc0000]',
    authorRole: s.authorRole || 'Cartographer',
    previewBackground: s.previewBackground || null,
    details: d,
    _summaryOnly: true
  };
};

export const FEED_LIMIT = 200;

// Feed = tiny metadata rows (no data JSONB). Use for lists/feeds/counts.
export const fetchMapFeed = async () => {
  const { data, error } = await supabase
    .from('maps')
    .select('id, owner_id, title, privacy, is_editor_map, created_at, updated_at, summary')
    .order('updated_at', { ascending: false })
    .limit(FEED_LIMIT);

  if (error) throw error;
  return (data || []).map(summaryToItem);
};

// Full single-map fetch (includes the complete data JSONB). On-demand only.
export const fetchMapById = async (mapId) => {
  if (!mapId) return null;
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('id', mapId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToItem(data) : null;
};

export const upsertMap = async (item) => {
  const row = mapItemToRow(item);
  const { data, error } = await supabase
    .from('maps')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
  return data;
};

export const deleteMapRow = async (mapId) => {
  const { error } = await supabase
    .from('maps')
    .delete()
    .eq('id', mapId);

  if (error) throw error;
};