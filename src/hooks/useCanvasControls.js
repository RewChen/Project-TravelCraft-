import { useEffect, useRef, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM_FACTOR, clampValue } from '../lib/editorCanvas';

const clampCamera = (x, y, scale, viewportWidth, viewportHeight) => {
  if (!viewportWidth || !viewportHeight) return { x, y, scale };

  const worldScreenW = CANVAS_WIDTH * scale;
  const worldScreenH = CANVAS_HEIGHT * scale;

  const minX = Math.min(0, viewportWidth - worldScreenW);
  const maxX = Math.max(0, viewportWidth - worldScreenW);
  const minY = Math.min(0, viewportHeight - worldScreenH);
  const maxY = Math.max(0, viewportHeight - worldScreenH);

  return { x: clampValue(x, minX, maxX), y: clampValue(y, minY, maxY), scale };
};

export default function useCanvasControls() {
  const viewportRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
const cameraRef = useRef(camera);
const panStartRef = useRef(null);

useEffect(() => {
  cameraRef.current = camera;
}, [camera]);

  const setCameraClamped = useCallback((next) => {
    setCamera((current) => {
      const merged = { ...current, ...next };
      return clampCamera(merged.x, merged.y, merged.scale, viewportSize.width, viewportSize.height);
    });
  }, [viewportSize]);

  const zoomAt = useCallback((pointerX, pointerY, factor) => {
    const { x, y, scale } = cameraRef.current;
    const nextScale = clampValue(scale * factor, MIN_ZOOM, MAX_ZOOM);
    if (nextScale === scale) return;
    const worldX = (pointerX - x) / scale;
    const worldY = (pointerY - y) / scale;
    setCameraClamped({
      scale: nextScale,
      x: pointerX - worldX * nextScale,
      y: pointerY - worldY * nextScale
    });
  }, [setCameraClamped]);

  const zoomIn = useCallback(() => {
    const { width, height } = viewportSize;
    zoomAt(width / 2, height / 2, DEFAULT_ZOOM_FACTOR);
  }, [viewportSize, zoomAt]);

  const zoomOut = useCallback(() => {
    const { width, height } = viewportSize;
    zoomAt(width / 2, height / 2, 1 / DEFAULT_ZOOM_FACTOR);
  }, [viewportSize, zoomAt]);

  const fitView = useCallback(() => {
    const { width, height } = viewportSize;
    if (!width || !height) return;
    const scale = clampValue(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT), MIN_ZOOM, MAX_ZOOM);
    setCameraClamped({
      scale,
      x: (width - CANVAS_WIDTH * scale) / 2,
      y: (height - CANVAS_HEIGHT * scale) / 2
    });
  }, [viewportSize, setCameraClamped]);

  const endPan = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const startPan = useCallback((clientX, clientY) => {
    const { x, y } = cameraRef.current;
    panStartRef.current = { startX: clientX, startY: clientY, cameraX: x, cameraY: y };
    setIsPanning(true);
  }, []);

  // Native, non-passive wheel listener so page scroll is prevented while zooming.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY > 0 ? 1 / DEFAULT_ZOOM_FACTOR : DEFAULT_ZOOM_FACTOR);
    };

    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [zoomAt]);

  // Window-level pan tracking while dragging.
  useEffect(() => {
    if (!isPanning) return undefined;

    const handleMove = (event) => {
      if (!panStartRef.current) return;
      const { startX, startY, cameraX, cameraY } = panStartRef.current;
      setCameraClamped({ x: cameraX + (event.clientX - startX), y: cameraY + (event.clientY - startY) });
    };

    const handleUp = () => endPan();
    const handleBlur = () => endPan();

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPanning, endPan, setCameraClamped]);

  // Measure the viewport container so the Stage matches it exactly.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return {
    viewportRef,
    viewportSize,
    camera,
    setCamera: setCameraClamped,
    zoomAt,
    zoomIn,
    zoomOut,
    fitView,
    startPan,
    endPan,
    isPanning
  };
}