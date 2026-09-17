import { supabase } from './supabaseClient';
import { MEDIA_BUCKET } from './supabaseUploads';
import { compressForUpload } from './imageUtils';

// Profile avatars live in Supabase Storage under:
//   media/users/<uid>/avatar.<ext>
// instead of a bloated base64 blob inside the users.avatar TEXT column.
// Emoji sprites stay as emoji strings; only real images are uploaded.

const safeExtension = (file) => {
  const ext = String(file?.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return ext || 'webp';
};

export const avatarStoragePath = (uid, file, version) =>
  `users/${encodeURIComponent(uid)}/avatar${version ? `-${version}` : ''}.${safeExtension(file)}`;

// Compress (max 256px so headers/profiles load instantly), upload to the
// public media bucket, and return the public CDN URL. The storage path is
// versioned per upload so the URL changes every time — otherwise the browser
// (and Supabase CDN cache) would keep serving the previously cached avatar.
export const uploadAvatar = async (uid, file) => {
  if (!uid || !file) return '';
  const compressed = await compressForUpload(
    file,
    { maxWidth: 256, quality: 0.8 },
    'webp'
  );
  if (!compressed) return '';
  const path = avatarStoragePath(uid, compressed, Date.now());
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, compressed, {
      upsert: true,
      cacheControl: '3600',
      contentType: compressed.type || 'image/webp'
    });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
};