import { supabase } from './supabaseClient';
import { isSchemaMissing, markSchemaMissing, clearSchemaMissing, isMissingSchemaError } from './schemaGuard';

export const VIEW_TIERS = [
  { tier: 'common', threshold: 0, color: 'bg-gray-400 text-white' },
  { tier: 'uncommon', threshold: 250, color: 'bg-emerald-500 text-white' },
  { tier: 'rare', threshold: 1000, color: 'bg-sky-500 text-white' },
  { tier: 'epic', threshold: 5000, color: 'bg-indigo-500 text-white' },
  { tier: 'legendary', threshold: 10000, color: 'bg-[#cc0000] text-white' }
];

export const RARITY_TIER_ORDER = VIEW_TIERS.map((item) => item.tier);

export const VIEW_COOLDOWN_MS = 60 * 1000;

const MAP_VIEWS_KEY = 'map_views';
const LOCAL_VIEWS_KEY = 'project_travelcraft_mapViews';
const COOLDOWN_PREFIX = 'project_travelcraft_view_cd_';

export const normalizeRarityTier = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'custom photo' || raw === 'custom') return 'common';
  return RARITY_TIER_ORDER.includes(raw) ? raw : 'common';
};

export const rarityRank = (tier) => Math.max(0, RARITY_TIER_ORDER.indexOf(normalizeRarityTier(tier)));

export const tierFromViews = (views) => {
  const count = Number(views) || 0;
  let current = VIEW_TIERS[0];
  for (const item of VIEW_TIERS) {
    if (count >= item.threshold) current = item;
  }
  return current.tier;
};

export const viewTierInfo = (views, tier) => {
  const count = Number(views) || 0;
  const resolved = normalizeRarityTier(tier || tierFromViews(count));
  const currentIndex = Math.max(0, RARITY_TIER_ORDER.indexOf(resolved));
  const current = VIEW_TIERS[currentIndex];
  const next = VIEW_TIERS[currentIndex + 1] || null;
  const span = next ? next.threshold - current.threshold : 0;
  const progress = next
    ? Math.min(1, Math.max(0, (count - current.threshold) / span))
    : 1;
  return {
    tier: current.tier,
    color: current.color,
    views: count,
    progress,
    currentThreshold: current.threshold,
    nextTier: next ? next.tier : null,
    nextThreshold: next ? next.threshold : null,
    remaining: next ? Math.max(0, next.threshold - count) : 0
  };
};

export const effectiveRarity = (editorTier, views) => {
  const floor = rarityRank(editorTier);
  const fromViews = RARITY_TIER_ORDER.indexOf(tierFromViews(views));
  return RARITY_TIER_ORDER[Math.max(floor, fromViews)];
};

export const rarityColorForTier = (tier) => {
  const found = VIEW_TIERS.find((item) => item.tier === normalizeRarityTier(tier));
  return found ? found.color : VIEW_TIERS[0].color;
};

export const rarityLabelKey = (tier) => {
  const normalized = normalizeRarityTier(tier);
  return `details.rarity${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const readLocalViewCounts = () => {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_VIEWS_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      const count = Number(value);
      if (Number.isFinite(count) && count > 0) out[key] = count;
    }
    return out;
  } catch {
    return {};
  }
};

export const writeLocalViewCounts = (counts) => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_VIEWS_KEY, JSON.stringify(counts || {}));
  } catch {
    // ignore storage failures (private mode / quota)
  }
};

const cooldownKey = (mapId) => `${COOLDOWN_PREFIX}${mapId}`;

export const isViewOnCooldown = (mapId) => {
  const storage = safeStorage();
  if (!storage || !mapId) return false;
  try {
    const last = Number(storage.getItem(cooldownKey(mapId)));
    return Number.isFinite(last) && Date.now() - last < VIEW_COOLDOWN_MS;
  } catch {
    return false;
  }
};

const markViewCooldown = (mapId) => {
  const storage = safeStorage();
  if (!storage || !mapId) return;
  try {
    storage.setItem(cooldownKey(mapId), String(Date.now()));
  } catch {
    // ignore
  }
};

const isMissingRpcError = (error) => {
  if (!error) return false;
  if (error.code === 'PGRST202' || error.code === '42883') return true;
  return /could not find the function|function .* does not exist/i.test(String(error.message || ''));
};

export const fetchViewCounts = async () => {
  if (isSchemaMissing(MAP_VIEWS_KEY)) return {};
  const { data, error } = await supabase.rpc('map_view_counts');
  if (error) {
    if (isMissingSchemaError(error) || isMissingRpcError(error)) markSchemaMissing(MAP_VIEWS_KEY);
    else console.warn('map_view_counts RPC failed:', error.message);
    return {};
  }
  clearSchemaMissing(MAP_VIEWS_KEY);
  const out = {};
  for (const row of data || []) {
    const count = Number(row?.views);
    if (row?.map_id && Number.isFinite(count)) out[row.map_id] = count;
  }
  return out;
};

export const loadViewCounts = async () => {
  const local = readLocalViewCounts();
  const remote = await fetchViewCounts();
  const merged = { ...local };
  for (const [mapId, count] of Object.entries(remote)) {
    merged[mapId] = Math.max(merged[mapId] || 0, count);
  }
  writeLocalViewCounts(merged);
  return merged;
};

export const recordMapView = async (mapId, viewerId) => {
  if (!mapId) return { counted: false, count: 0 };
  if (isViewOnCooldown(mapId)) return { counted: false, count: 0 };
  markViewCooldown(mapId);

  if (viewerId && !isSchemaMissing(MAP_VIEWS_KEY)) {
    const { error } = await supabase.from('map_views').insert({ map_id: mapId, viewer_id: viewerId });
    if (error) {
      if (isMissingSchemaError(error) || isMissingRpcError(error)) markSchemaMissing(MAP_VIEWS_KEY);
      else console.warn('map view insert failed:', error.message);
    } else {
      clearSchemaMissing(MAP_VIEWS_KEY);
    }
  }

  const counts = readLocalViewCounts();
  counts[mapId] = (counts[mapId] || 0) + 1;
  writeLocalViewCounts(counts);
  return { counted: true, count: counts[mapId] };
};
