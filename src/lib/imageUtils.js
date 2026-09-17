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

// Turn a File into a base64 data URL (used to seed small avatars into auth
// metadata when a storage upload is not possible yet, e.g. pre-confirmation).
export const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

// True when an avatar value is a rendered image (data URL or http(s) URL)
// rather than an emoji sprite.
export const isAvatarImage = (avatar) =>
  typeof avatar === 'string' &&
  (avatar.startsWith('data:image') || /^https?:\/\//.test(avatar));

// Render a fitted (optionally zoomed/rotated/offset) image into a square
// canvas clipped to a centered circle. Used by the profile avatar cropper.
// The preview simply mirrors this transform with the same parameters, so the
// visible circle area is exactly what lands in the output PNG.
//   img          - decoded HTMLImageElement
//   dx, dy       - drag offset (px) from the display center
//   scale        - total display scale (base fit scale * zoom)
//   rotation     - rotation in degrees (clockwise, screen coordinates)
//   displaySize  - side length (px) of the square preview container
//   outputSize   - side length (px) of the returned square canvas
export const circularCropToCanvas = ({ img, dx, dy, scale, rotation, displaySize, outputSize = 512 }) => {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  const k = outputSize / displaySize;

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.translate(outputSize / 2 + dx * k, outputSize / 2 + dy * k);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale * k, scale * k);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
  ctx.restore();
  return canvas;
};