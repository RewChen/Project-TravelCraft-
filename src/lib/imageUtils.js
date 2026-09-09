// Client-side image compression used before any storage/DB upload so map rows
// and storage objects stay small. Returns a Blob; falls back to the original
// file when the browser can't downscale (SVG, decode errors...).
export const compressImage = (file, { maxWidth = 1280, quality = 0.78, mime = 'image/webp' } = {}) =>
  new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (/\.svg$/i.test(file.name || '') || !file.type?.startsWith('image/')) {
      resolve(file);
      return;
    }
    if (typeof document === 'undefined' || !document.createElement('canvas')) {
      resolve(file);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        mime,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });

// Convenience wrapper that compresses and returns a proper File (so the
// uploader can derive the extension + content type). Falls back to the
// original file when no compression happened.
export const compressForUpload = async (file, options = {}, extension = 'webp') => {
  if (!file) return null;
  const blob = await compressImage(file, options);
  if (blob === file) return file;
  const baseName = (file.name || 'asset').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${extension}`, { type: blob.type || 'image/webp' });
};