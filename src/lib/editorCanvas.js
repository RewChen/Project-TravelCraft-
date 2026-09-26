import { cleanAssetName } from './imageUtils';

export const DEFAULT_CANVAS_WIDTH = 4000;
export const DEFAULT_CANVAS_HEIGHT = 4000;

export const GRID_STEP = 50;
export const MIN_ELEMENT_SIZE = 200;
export const MAX_ZOOM = 8;
export const MIN_ZOOM = 0.05;
export const DEFAULT_ZOOM_FACTOR = 1.15;

const LEGACY_WIDTH = 800;
const LEGACY_HEIGHT = 600;
const WORLD_SCALE = 5;

export const isLegacySpace = (positions) => {
  const values = Object.values(positions || {});
  if (!values.length) return false;
  const maxLeft = Math.max(...values.map((p) => (p.left || 0) + (p.width || 0)));
  const maxTop = Math.max(...values.map((p) => (p.top || 0) + (p.height || 0)));
  return maxLeft <= LEGACY_WIDTH + 10 && maxTop <= LEGACY_HEIGHT + 10;
};

export const scaleElementPositions = (positions) => {
  if (!positions || !isLegacySpace(positions)) return positions;
  const scaled = {};
  Object.entries(positions).forEach(([key, value]) => {
    scaled[key] = {
      left: value.left * WORLD_SCALE,
      top: value.top * WORLD_SCALE,
      width: value.width * WORLD_SCALE,
      height: value.height * WORLD_SCALE
    };
  });
  return scaled;
};

export const scaleElementFontSizes = (elements, positions) => {
  if (!Array.isArray(elements)) return elements;
  if (!isLegacySpace(positions)) return elements;
  return elements.map((element) => (
    typeof element.fontSize === 'number' ? { ...element, fontSize: element.fontSize * WORLD_SCALE } : element
  ));
};

export const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

// Push overlapping pins slightly apart so markers don't stack on top of each
// other. Positions are kept as close as possible to the original placement.
export const resolvePinOverlaps = (pins, gap = 8) => {
  if (!Array.isArray(pins) || pins.length < 2) return pins;
  const parse = (value) => parseFloat(String(value).replace('%', '')) || 0;
  const positions = pins.map((pin) => ({ x: parse(pin.left), y: parse(pin.top) }));
  const gapSq = gap * gap;
  const move = positions.map(() => ({ x: 0, y: 0 }));

  for (let iter = 0; iter < 40; iter += 1) {
    move.forEach((m) => { m.x = 0; m.y = 0; });
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= gapSq) continue;
        let pushX;
        let pushY;
        if (distSq === 0) {
          pushX = gap / 2;
          pushY = 0;
        } else {
          const dist = Math.sqrt(distSq);
          const overlap = (gap - dist) / 2;
          pushX = (dx / dist) * overlap;
          pushY = (dy / dist) * overlap;
        }
        move[i].x -= pushX; move[i].y -= pushY;
        move[j].x += pushX; move[j].y += pushY;
      }
    }

    let movedCount = 0;
    positions.forEach((p, idx) => {
      if (Math.abs(move[idx].x) < 0.01 && Math.abs(move[idx].y) < 0.01) return;
      p.x = Math.min(98, Math.max(2, p.x + move[idx].x));
      p.y = Math.min(98, Math.max(2, p.y + move[idx].y));
      movedCount += 1;
    });
    if (movedCount === 0) break;
  }

  return pins.map((pin, idx) => ({
    ...pin,
    left: `${positions[idx].x.toFixed(2)}%`,
    top: `${positions[idx].y.toFixed(2)}%`
  }));
};

// Convert any YouTube URL (watch/shorts/embed/youtu.be) into an embeddable URL.
export const toYouTubeEmbedUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace('www.', '').toLowerCase();
    let videoId = '';
    if (hostname === 'youtu.be') {
      videoId = url.pathname.slice(1);
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
      if (url.pathname.startsWith('/shorts/')) videoId = url.pathname.split('/')[2] || '';
      if (url.pathname.startsWith('/embed/')) videoId = url.pathname.split('/')[2] || '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
};

// Center of an element in canvas pixels (used by the navigation/route tool).
export const getElementCenter = (elementPositions, elementId) => {
  const position = (elementPositions || {})[elementId];
  if (!position) return null;
  return {
    x: (position.left || 0) + (position.width || 0) / 2,
    y: (position.top || 0) + (position.height || 0) / 2
  };
};

// Build pixel-space polylines for saved routes. Each route is
// { id, name, color, pointIds: [elementId...], visible }.
// Routes auto-follow elements when they are moved — no stored coordinates.
export const buildRoutePaths = (routes, elementPositions) => {
  if (!Array.isArray(routes)) return [];
  return routes.map((route) => {
    let points = [];
    if (Array.isArray(route.pointIds) && route.pointIds.length > 0) {
      points = route.pointIds
        .map((id) => getElementCenter(elementPositions, id))
        .filter(Boolean);
    } else {
      points = route.points || [];
    }
    return { ...route, points, controlPoints: route.controlPoints || [] };
  }).filter((route) => route.points.length >= 2);
};

// Convert saved routes into percent-space paths for published maps / viewers.
export const deriveRoutePathsFromElements = (routes, elementPositions, canvasWidth = DEFAULT_CANVAS_WIDTH, canvasHeight = DEFAULT_CANVAS_HEIGHT) => {
  return buildRoutePaths(routes, scaleElementPositions(elementPositions) || {}).map((route) => ({
    id: route.id,
    name: route.name || '',
    color: route.color || '#cc0000',
    thickness: route.thickness || 4,
    visible: route.visible !== false,
    points: route.points.map((p) => ({
      left: `${((p.x / canvasWidth) * 100).toFixed(2)}%`,
      top: `${((p.y / canvasHeight) * 100).toFixed(2)}%`
    }))
  }));
};

// Convert editor canvas elements + positions into world-map pins (percent coords).
// Only elements marked `isLocation` become pins (that separates pins from plain
// decorations). When nothing is marked yet, keep legacy behavior and turn every
// element into a pin so older maps still render.
// getLabel(element) resolves the display title (translation-aware at call site).
export const derivePinsFromElements = (elements, elementPositions, getLabel = null, canvasWidth = DEFAULT_CANVAS_WIDTH, canvasHeight = DEFAULT_CANVAS_HEIGHT) => {
  const elementsArr = Array.isArray(elements) ? elements : [];
  const positions = scaleElementPositions(elementPositions) || {};
  const scaledElements = scaleElementFontSizes(elementsArr, elementPositions);
  const hasMarkedLocations = scaledElements.some((element) => element.isLocation === true);
  const candidates = hasMarkedLocations
    ? scaledElements.filter((element) => element.isLocation === true && !element.isHiddenWaypoint)
    : scaledElements.filter((element) => !element.isHiddenWaypoint);
  return candidates
    .map((element) => {
      const position = positions[element.id];
      if (!position) return null;
      const details = element.locationDetails || {};
      const rawLabel = getLabel
        ? getLabel(element)
        : (element.content || element.label || element.type || 'Spot');
      let fallbackLabel = rawLabel || null;
      if (!fallbackLabel) {
        if (element.type === 'text' || element.type === 'emoji') {
          fallbackLabel = element.content;
        } else if (element.label) {
          fallbackLabel = element.label
            .replace(/\.[a-zA-Z0-9]+$/, '')
            .replace(/-removebg-preview/gi, '')
            .replace(/_/g, ' ')
            .trim();
        } else {
          fallbackLabel = element.type === 'image' ? 'Photo Spot' : (element.type || 'Spot');
        }
      }
      fallbackLabel = cleanAssetName(fallbackLabel) || 'Location';
      const isImageSrc = element.type === 'image'
        && typeof element.content === 'string'
        && (element.content.indexOf('data:image/') === 0 || /^https?:\/\//i.test(element.content));
      const locationSelfies = Array.isArray(details.selfies) ? details.selfies : [];
      // สื่อจากฟอร์มแก้ไขหมุดส่งขึ้นเฉพาะ popup ของ element (imageUrls/videoUrls)
      // — หน้า Details ไม่แสดง (popupMediaOnly)
      const imageUrls = [...new Set(
        [details.image || (isImageSrc ? element.content : null), ...locationSelfies].filter(Boolean)
      )];
      const rawVideos = [
        ...(Array.isArray(details.videos) ? details.videos : []),
        ...(details.video ? [details.video] : []),
        ...(details.youtubeUrl ? [details.youtubeUrl] : [])
      ].filter(Boolean);
      const videoUrls = [...new Set(rawVideos)]
        .map((url) => {
          const embedded = toYouTubeEmbedUrl(url);
          if (embedded) return embedded;
          // Not a YouTube link: keep uploaded file URLs as-is, drop broken
          // YouTube links that failed to convert into an embed.
          return /youtu\.?be|youtube\.com/i.test(url) ? null : url;
        })
        .filter(Boolean);
      const pinHours = details.hours
        || (details.openTime && details.closeTime ? `${details.openTime} - ${details.closeTime}` : null);
      
      const explicitLore = details.description || element.lore;
      const finalLore = explicitLore || (element.type === 'text' ? element.content : null);

      return {
        id: `editor-${element.id}`,
        title: details.name || fallbackLabel,
        top: `${Math.round(((position.top + position.height / 2) / canvasHeight) * 100)}%`,
        left: `${Math.round(((position.left + position.width / 2) / canvasWidth) * 100)}%`,
        // Rendered size as % of the canvas — lets the detail popup clear the element.
        widthPct: ((position.width || 0) / canvasWidth) * 100,
        heightPct: ((position.height || 0) / canvasHeight) * 100,
        icon: element.type === 'image' ? '🖼️' : element.type === 'text' ? '📝' : (element.content || '📍'),
        category: 'landmarks',
        tag: 'Landmark',
        type: 'Custom Location',
        lore: finalLore,
        // The created element itself becomes the pin marker:
        elementType: element.type,
        shape: element.shape,
        shapeColor: element.color,
        previewUrl: isImageSrc ? element.content : details.image || null,
        imageUrl: details.image || (isImageSrc ? element.content : null),
        imageUrls: imageUrls.length ? imageUrls : null,
        youtubeUrl: details.youtubeUrl || null,
        videoUrl: videoUrls[0] || null,
        videoUrls: videoUrls.length ? videoUrls : null,
        popupMediaOnly: true,
        openTime: details.openTime || null,
        closeTime: details.closeTime || null,
        hours: pinHours,
        fee: details.fee || null,
        bestTime: details.bestTime || null,
        travel: details.travel || null,
        selfieUrl: locationSelfies[0] || null,
        selfieUrls: locationSelfies.length ? [...locationSelfies] : null
      };
    })
    .filter(Boolean);
};