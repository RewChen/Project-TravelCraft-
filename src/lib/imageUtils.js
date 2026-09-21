const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg|bmp|avif|heic)$/i;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const REMOVEBG_RE = /-?remove-?bg(-preview)?/i;

// Turn an uploaded file name into a clean display label. Tools like remove.bg
// prepend a UUID and append "-removebg-preview" (e.g.
// "b3035bc9-...-removebg-preview.png"), which is never a good user-facing name.
// Strings that don't look like file names (plain text / emoji labels) are
// returned unchanged so element text is never mangled.
export const cleanAssetName = (name) => {
  const raw = String(name ?? '').trim();
  if (!raw) return '';
  const looksLikeFile = IMAGE_EXT_RE.test(raw) || UUID_RE.test(raw) || REMOVEBG_RE.test(raw);
  if (!looksLikeFile) return raw;
  return raw
    .replace(IMAGE_EXT_RE, '')
    .replace(UUID_RE, '')
    .replace(REMOVEBG_RE, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

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

// True when a value is a real image src (filters out CSS gradients / 'none' / blanks)
export const isImageSrc = (value) =>
  typeof value === 'string' &&
  value.trim() !== '' &&
  value !== 'none' &&
  !value.includes('gradient');

// Cover placeholder a publisher "gets" when no real cover was uploaded. Treat
// it like "no cover" so cards fall back to the actual map background (the
// background chosen in the editor) instead of an unrelated default photo.
export const DEFAULT_MAP_COVER = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80';

export const isDefaultCover = (value) =>
  typeof value === 'string' && value.replace(/[?&]w=\d+&q=\d+$/, '') === DEFAULT_MAP_COVER.replace(/[?&]w=\d+&q=\d+$/, '');

// รูปสำรองตามชื่อสถานที่ (ใช้ตรงกับปก hero)
export const coverFallbackFor = (title) => {
  const name = String(title || '').toLowerCase();
  if (name.includes('kyoto')) return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=85';
  if (name.includes('grand canyon')) return 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1400&q=85';
  return 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=85';
};

// สไตล์พื้นหลังการ์ดแผนที่: ใช้ previewBackground ถ้ามีลาย (gradient/รูป)
// ถ้าเป็นสีพื้นล้วนแต่มีรูปพื้นหลังจริง (bgThemeUrl/editor background)
// ให้ใช้รูปแทน — ช่วยแมพที่ publish ก่อน canvas จะฝัง url รูป template
export const resolveCardBackground = (mapItem) => {
  const preview = mapItem?.previewBackground;
  if (preview?.backgroundImage && preview.backgroundImage !== 'none') {
    // Force real image backgrounds to fill the square canvas exactly like the
    // editor (objects stretch to 4000x4000), so the card and the world map
    // always agree even for maps published before the fill change.
    if (!preview.backgroundImage.includes('gradient')) {
      return { ...preview, backgroundSize: '100% 100%' };
    }
    return preview;
  }
  const bgSrc = mapItem?.bgThemeUrl || mapItem?.editorState?.backgroundImage;
  if (isImageSrc(bgSrc)) {
    return {
      backgroundColor: preview?.backgroundColor || '#e2f0d9',
      backgroundImage: `url("${bgSrc}")`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return preview || undefined;
};

// รูปปกที่ hero แสดงจริง: imageUrl ก่อน แล้วรูป template (bgThemeUrl / editor background)
// imageUrl ที่เป็น placeholder ฟิกซ์ถือว่าไม่มี cover ให้ข้ามไปหาพื้นหลังจริงแทน
// คืนรูปจริงเท่านั้น — ถ้าหรือไม่ได้ใส่รูป cover จริงเลย จะไม่ fallback เป็นรูปสต็อก
export const resolveRealCoverImage = (location) => {
  const candidates = [
    location?.imageUrl && !isDefaultCover(location.imageUrl) ? location.imageUrl : null,
    location?.bgThemeUrl,
    location?.editorState?.backgroundImage,
  ];
  return candidates.find(isImageSrc) || null;
};

// Backward-compatible wrapper: ยังให้ fallback ตามชื่อสำหรับที่เรียกใช้เดิม
export const resolveCoverImage = (location) =>
  resolveRealCoverImage(location) || coverFallbackFor(location?.title);

// แปลงลิงก์วิดีโอทั่วไปให้เป็น embed URL (YouTube watch/shorts/live/youtu.be → embed)
// ไฟล์อัปโหลด (data:video/) และ mp4 ตรง ๆ คืนค่าเดิม
export const toEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  try {
    if (trimmed.startsWith('data:video/')) return trimmed;
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const short = parsed.pathname.match(/^\/(shorts|live)\/([\w-]+)/);
      if (short) return `https://www.youtube.com/embed/${short[2]}`;
      return trimmed;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').split(/[?#]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : trimmed;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

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
// Compute the visible cover window (cover-fit + drag offset + zoom) in source
// image coordinates. Returns the source rect to bake into a canvas plus the
// ready-to-use absolute positioning for the preview <img> (which is oversized
// and shifted so only the chosen region is visible).
//   img          - decoded HTMLImageElement
//   viewportW/H  - measured box size of the preview/crop viewport (css px)
//   offsetX/Y    - user drag offset around center (css px, 0 = centered)
//   zoom         - extra zoom factor (1 = image exactly covers the viewport)
export const coverCropRect = ({ img, viewportW, viewportH, offsetX = 0, offsetY = 0, zoom = 1 }) => {
  const iw = img?.naturalWidth || 0;
  const ih = img?.naturalHeight || 0;
  const safe = Math.max(viewportW, 1) / Math.max(viewportH, 1) || 1;
  const place = (v, lo) => Math.max(0, Math.min(lo, v));
  if (!iw || !ih) {
    return { sx: 0, sy: 0, sw: safe, sh: 1, displayLeft: 0, displayTop: 0, displayW: viewportW, displayH: viewportH };
  }
  const scale = Math.max(viewportW / iw, viewportH / ih) * zoom;
  const dispW = iw * scale;
  const dispH = ih * scale;
  const overflowX = Math.max(0, dispW - viewportW);
  const overflowY = Math.max(0, dispH - viewportH);
  const left = place(overflowX / 2 + offsetX, overflowX);
  const top = place(overflowY / 2 + offsetY, overflowY);
  return {
    sx: left / scale,
    sy: top / scale,
    sw: viewportW / scale,
    sh: viewportH / scale,
    displayLeft: -left,
    displayTop: -top,
    displayW: dispW,
    displayH: dispH,
  };
};

// Render the visible cover crop (cover-fit + drag + zoom) into a rectangular
// canvas. Perfect mirror of the preview transform, so the baked output is
// exactly what the user sees in the crop viewport. Returns a canvas.
export const rectCropToCanvas = ({ img, viewportW, viewportH, offsetX = 0, offsetY = 0, zoom = 1, outputW = 1280, outputH = 720, mime = 'image/webp', quality = 0.85 }) => {
  const { sx, sy, sw, sh } = coverCropRect({ img, viewportW, viewportH, offsetX, offsetY, zoom });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(outputW));
  canvas.height = Math.max(1, Math.round(outputH));
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? { blob, canvas } : { canvas }), mime, quality);
  });
};

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