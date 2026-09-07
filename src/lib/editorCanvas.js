export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 4000;

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