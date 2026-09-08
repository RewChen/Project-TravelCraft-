import { supabase } from './supabaseClient';
import { MEDIA_BUCKET } from './supabaseUploads';

// Per-user saved editor Elements & Backgrounds.
// Storage path: media/users/<uid>/elements|<backgrounds>/<file>
// Row source of truth: public.user_assets

const sanitizeLabel = (label) =>
  (label || 'asset')
    .replace(/[^a-z0-9\-_]+/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'asset';

const fileExtension = (file) =>
  (file?.name || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';

const toPublicUrl = (path) => {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
};

export const userAssetStoragePath = (uid, type, file) =>
  `users/${encodeURIComponent(uid)}/${type === 'background' ? 'backgrounds' : 'elements'}/${Date.now()}-${sanitizeLabel(file.name, fileExtension(file))}`;

// Upload a single file to storage and return its public URL.
export const uploadUserAssetFile = async (uid, type, file) => {
  if (!uid || !file) return '';
  const path = userAssetStoragePath(uid, type, file);
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
  if (error) throw error;
  return toPublicUrl(path);
};

// Convert a base64 data URL into a File (used when migrating guest assets).
export const dataUrlToFile = (dataUrl, filename = 'asset') => {
  try {
    const [head, body] = String(dataUrl).split(',');
    const mime = (head?.match(/data:([^;]+);/) || [])[1] || 'image/png';
    const bin = window.atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const ext = mime === 'image/svg+xml' ? 'svg' : (mime.split('/')[1] || 'png').replace(/[^a-z0-9]/g, '') || 'png';
    return new File([bytes], `${filename}.${ext}`, { type: mime });
  } catch {
    return null;
  }
};

// Fetch all saved assets for a user.
export const fetchUserAssets = async (uid) => {
  if (!uid) return [];
  const { data, error } = await supabase
    .from('user_assets')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Persist a resolved asset row (url + label + type) for a user.
export const insertUserAsset = async (uid, { type, label, url }) => {
  if (!uid || !url) return null;
  const { data, error } = await supabase
    .from('user_assets')
    .insert({ user_id: uid, asset_type: type, label, url })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Remove a saved asset row (library only; the storage file is left in place so
// already-published maps that embed the URL keep rendering).
export const deleteUserAsset = async (id) => {
  if (!id) return;
  const { error } = await supabase.from('user_assets').delete().eq('id', id);
  if (error) throw error;
};