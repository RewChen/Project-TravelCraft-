import { supabase } from './supabaseClient';

export const MEDIA_BUCKET = 'media';
export const MEDIA_MAPS_PREFIX = 'maps';

const fileExtension = (file) => {
  const name = (file?.name || '').split('.').pop() || 'jpg';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const toPublicUrl = (path) => {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
};

export const mapAssetPath = (mapId, type, file) =>
  `${MEDIA_MAPS_PREFIX}/${encodeURIComponent(mapId)}/${type}.${fileExtension(file)}`;

// Generic upload of any map media (cover, video, selfie, element image, ...) into
// the maps/<mapId>/ storage folder. Returns the public URL to persist inside the
// map's `data` JSONB instead of a multi-MB base64 data URL — that keeps the row
// small so previewing a map (fetchMapById → data) stays fast.
export const uploadMapMedia = async (mapId, kind, file) => {
  if (!mapId || !file) return '';
  const ext = fileExtension(file);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${MEDIA_MAPS_PREFIX}/${encodeURIComponent(mapId)}/${kind}-${stamp}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
  if (error) throw error;
  return toPublicUrl(path);
};

export const uploadMapCover = async (mapId, file) => {
  if (!mapId || !file) return '';
  const path = mapAssetPath(mapId, 'cover', file);
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
  if (error) throw error;
  return toPublicUrl(path);
};

export const deleteMapAssets = async (mapId) => {
  if (!mapId) return;
  const prefix = `${MEDIA_MAPS_PREFIX}/${encodeURIComponent(mapId)}/`;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(prefix, { limit: 200 });
  if (error) {
    console.warn('Supabase storage list skipped:', error);
    return;
  }
  if (!data?.length) return;
  const paths = data.filter((item) => item.name !== '' && item.id).map((item) => `${prefix}${item.name}`);
  if (!paths.length) return;
  const { error: removeError } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  if (removeError) console.warn('Supabase storage remove skipped:', removeError);
};
