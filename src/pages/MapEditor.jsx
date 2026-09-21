import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage } from 'react-konva';
import { useApp } from '../context/AppContext';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check,
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Grid3X3,
  Share2, MessageCircle, Smartphone, Copy, X, Lock, Unlock, RotateCw, Maximize, MapPin,
  Crown, PenTool, Folder, LayoutDashboard, ImagePlus,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,   Play, ChevronLeft, ChevronRight, Wand2,
  Clock3, CircleDollarSign, Sun, Train, Camera, Video, Image as ImageIcon, Eye, Route as RouteIcon, Plus, ArrowUp, ArrowDown, ArrowLeftRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import useCanvasControls from '../hooks/useCanvasControls';
import { compressForUpload } from '../lib/imageUtils';
import { uploadMapMedia } from '../lib/supabaseUploads';
import BackgroundLayer from '../components/editor/BackgroundLayer';
import PublishMapModal from '../components/map/PublishMapModal';
import EditableCover from '../components/map/EditableCover';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, MIN_ELEMENT_SIZE, MIN_ZOOM, MAX_ZOOM, clampValue, scaleElementPositions, scaleElementFontSizes, derivePinsFromElements, buildRoutePaths, deriveRoutePathsFromElements } from '../lib/editorCanvas';
import { getShapeStyle, getImageFilterStyle, getElementFrameStyle, getFramePlaceholderStyle } from '../lib/editorElements';
import { mapTemplates } from '../data/templates';

const editorTabs = [
  { id: 'TEMPLATES', icon: LayoutGrid, labelKey: 'editor.templates', defaultLabel: 'เทมเพลต' },
  { id: 'ELEMENTS', icon: Shapes, labelKey: 'editor.elements', defaultLabel: 'องค์ประกอบ' },
  { id: 'TEXT', icon: Type, labelKey: 'editor.text', defaultLabel: 'ข้อความ' },
  { id: 'UPLOADS', icon: Upload, labelKey: 'editor.uploads', defaultLabel: 'อัพโหลด' },
  { id: 'TOOLS', icon: PenTool, labelKey: 'editor.tools', defaultLabel: 'เครื่องมือ' },
  { id: 'PROJECTS', icon: Folder, labelKey: 'editor.projects', defaultLabel: 'โปรเจ็คต์' },
  { id: 'APPS', icon: LayoutDashboard, labelKey: 'editor.apps', defaultLabel: 'แอพ' },
  { id: 'DIVIDER', isDivider: true },
  { id: 'BACKGROUND', icon: ImagePlus, labelKey: 'editor.background', defaultLabel: 'แบ็คกราวน์' }
];

const tabLabelKeys = {
  TEMPLATES: 'editor.templates',
  ELEMENTS: 'editor.elements',
  TEXT: 'editor.text',
  UPLOADS: 'editor.uploads',
  TOOLS: 'editor.tools',
  PROJECTS: 'editor.projects',
  APPS: 'editor.apps',
  BACKGROUND: 'editor.background'
};

const locationHoursOptions = [
  '24/7',
  'Open 24 hours',
  '6:00 AM - 10:00 PM',
  '7:00 AM - 9:00 PM',
  '8:00 AM - 6:00 PM',
  '9:00 AM - 5:00 PM',
  '10:00 AM - 8:00 PM',
  '10:00 AM - 10:00 PM',
  'Sunrise - Sunset',
  'Weekdays only',
  'Closed Mondays'
];

const locationBestTimeOptions = [
  'Anytime',
  'Every season',
  'Morning',
  'Afternoon',
  'Sunset',
  'Night'
];

const locationTravelOptions = [
  '🚶 Walking', '🚲 Bicycle', '🛵 Scooter', '🚗 Car', '🚕 Taxi', '🚌 Bus', '🚆 Train',
  '🚇 Metro', '🚢 Ferry', '✈️ Flight', '🚁 Helicopter', '🐘 Elephant', '⛵ Boat', '🌍 Community Gateway'
];

const elementOptions = [
  { content: '🌲', labelKey: 'editor.elemTree' },
  { content: '🏔️', labelKey: 'editor.elemMountain' },
  { content: '🏠', labelKey: 'editor.elemHouse' },
  { content: '🚪', labelKey: 'editor.elemDoor' },
  { content: '📍', labelKey: 'editor.elemPin' },
  { content: '☀️', labelKey: 'editor.elemSun' },
  { content: '🌊', labelKey: 'editor.elemWater' },
  { content: '🔥', labelKey: 'editor.elemCampfire' },
  { content: '⭐', labelKey: 'editor.elemStar' }
];

const textPresets = [
  { labelKey: 'editor.textHeading', contentKey: 'editor.textHeadingContent', fontSize: 280, fontWeight: 900 },
  { labelKey: 'editor.textSubheading', contentKey: 'editor.textSubheadingContent', fontSize: 180, fontWeight: 700 },
  { labelKey: 'editor.textBody', contentKey: 'editor.textBodyContent', fontSize: 130, fontWeight: 400 }
];

const MAX_TEXT_FONT_SIZE = 320;
const normalizeElementFont = (element) => {
  if (element.type !== 'text' || typeof element.fontSize !== 'number') return element;
  if (element.fontSize > MAX_TEXT_FONT_SIZE) {
    return { ...element, fontSize: MAX_TEXT_FONT_SIZE };
  }
  return element;
};

const textGradientPresets = [
  { id: 'sunset', labelKey: 'editor.gradientSunset', css: 'linear-gradient(135deg,#f97316 0%,#ec4899 55%,#8b5cf6 100%)' },
  { id: 'ocean', labelKey: 'editor.gradientOcean', css: 'linear-gradient(135deg,#22d3ee 0%,#3b82f6 60%,#0ea5e9 100%)' },
  { id: 'neon', labelKey: 'editor.gradientNeon', css: 'linear-gradient(135deg,#22c55e 0%,#eab308 50%,#ef4444 100%)' }
];

const textAnimations = [
  { id: 'none', labelKey: 'editor.textAnimNone' },
  { id: 'bounce', labelKey: 'editor.textAnimBounce' },
  { id: 'pulse', labelKey: 'editor.textAnimPulse' },
  { id: 'wave', labelKey: 'editor.textAnimWave' },
  { id: 'shake', labelKey: 'editor.textAnimShake' },
  { id: 'float', labelKey: 'editor.textAnimFloat' },
  { id: 'spin', labelKey: 'editor.textAnimSpin' }
];

const textAnimationClass = (animation) => {
  if (animation === 'bounce') return 'animate-bounce';
  if (animation === 'pulse') return 'animate-pulse';
  if (animation === 'spin') return 'animate-spin';
  if (animation === 'wave') return 'editor-anim-wave';
  if (animation === 'shake') return 'editor-anim-shake';
  if (animation === 'float') return 'editor-anim-float';
  return '';
};

const photoFilters = [
  { id: 'none', labelKey: 'editor.filterNone' },
  { id: 'sepia', labelKey: 'editor.filterSepia' },
  { id: 'vintage', labelKey: 'editor.filterVintage' },
  { id: 'bw', labelKey: 'editor.filterBw' },
  { id: 'polaroid', labelKey: 'editor.filterPolaroid' },
  { id: 'sticker', labelKey: 'editor.filterSticker' }
];

const badgeMeta = {
  Cartographer: { icon: '🗺️', labelKey: 'editor.badgeCartographer', descKey: 'editor.badgeCartographerDesc' },
  'Master Builder': { icon: '🧱', labelKey: 'editor.badgeMasterBuilder', descKey: 'editor.badgeMasterBuilderDesc' },
  Storyteller: { icon: '📖', labelKey: 'editor.badgeStoryteller', descKey: 'editor.badgeStorytellerDesc' }
};

const drawingTools = [
  ['select', MousePointer2, 'editor.toolSelect'],
  ['draw-route', PenTool, 'editor.toolDrawRoute'],
  ['pen', Pencil, 'editor.toolLine'],
  ['highlight', Minus, 'editor.toolHighlight'],
  ['rectangle', Square, 'editor.toolRect'],
  ['circle', Circle, 'editor.toolCircle'],
  ['grid', Grid3X3, 'editor.toolGrid'],
  ['eraser', Eraser, 'editor.toolDelete']
];

export default function MapEditor({ onBack }) {
const { t, publishMapToCommunity, editorSetup, userProfile, communityMaps, baseMaps, updateUserBadges, saveEditorMapState, registerEditorDraft, navigateTo, userAssets, addUserAsset, removeUserAsset, globalSettings, showAdminToast } = useApp();
  const generateDraftId = () => {
    // Unique per draft so two users/editors never collide on the same map id.
    const rand = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    return `comm-user-draft-${rand}`;
  };

  const [mapId] = useState(() => editorSetup?.id || generateDraftId());
  const [savedEditorState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('project_travelcraft_editorSaves')) || {};
      return editorSetup?.editorState || saved[mapId] || null;
    } catch {
      return editorSetup?.editorState || null;
    }
  });
  
  const [canvasWidth, setCanvasWidth] = useState(() => savedEditorState?.canvasWidth || DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(() => savedEditorState?.canvasHeight || DEFAULT_CANVAS_HEIGHT);

  const [activeTab, setActiveTab] = useState('TEMPLATES');
  const [panelOpen, setPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [showTextStyleMenu, setShowTextStyleMenu] = useState(false);
  const [recentlyWonBadges, setRecentlyWonBadges] = useState([]);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null); 
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(() => savedEditorState?.selectedTemplate || 'blank');
  const [previewTemplateId, setPreviewTemplateId] = useState(null);
  const [showTextAnimMenu, setShowTextAnimMenu] = useState(false);
  const [showTextPositionMenu, setShowTextPositionMenu] = useState(false);
  const [liveDrawing, setLiveDrawing] = useState(null);
  const [pendingDeleteSelection, setPendingDeleteSelection] = useState(null);
  const liveDrawingRef = useRef(null);
  const lastClickRef = useRef(0);
  const {
    viewportRef,
    viewportSize,
    camera,
    setCamera,
    zoomIn,
    zoomOut,
    fitView,
    startPan,
    endPan,
    isPanning
  } = useCanvasControls({ canvasWidth, canvasHeight });
  const tourCameraRef = useRef(camera);
  const [backgroundImage, setBackgroundImage] = useState(() => (typeof savedEditorState?.backgroundImage === 'string' && savedEditorState.backgroundImage) || '');
  const [ready, setReady] = useState(false);
  const [elements, setElements] = useState(() => (Array.isArray(savedEditorState?.elements)
    ? scaleElementFontSizes(savedEditorState.elements, savedEditorState?.elementPositions).map((element) => normalizeElementFont(element))
    : []));
  const [elementPositions, setElementPositions] = useState(() => scaleElementPositions(savedEditorState?.elementPositions) || {});
  // --- Navigation routes: ordered lists of location element ids ---
  // Each route: { id, name, color, pointIds: [elementId], visible }
  const [routes, setRoutes] = useState(() => (
    Array.isArray(savedEditorState?.routes)
      ? savedEditorState.routes.filter((r) => r && Array.isArray(r.pointIds)).map((r) => ({ visible: true, color: '#cc0000', name: '', ...r }))
      : []
  ));
  const [activeRouteId, setActiveRouteId] = useState(null);
  const nextRouteId = useRef(0);
  // --- Quick A → B navigation: explicit start pin and destination pin ---
  const [navStartId, setNavStartId] = useState(() => savedEditorState?.navStartId || null);
  const [navEndId, setNavEndId] = useState(() => savedEditorState?.navEndId || null);
  const tourStops = useMemo(
    () => elements
      .map((element) => ({ element }))
      .filter(({ element }) => elementPositions[element.id]),
    [elements, elementPositions]
  );
  const [dragging, setDragging] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
const [activeTool, setActiveTool] = useState('select');
const [drawingColor, setDrawingColor] = useState('#111111');
const [routeThickness, setRouteThickness] = useState(4);
const [liveRouteDrawing, setLiveRouteDrawing] = useState(null);
  const [zoomEditing, setZoomEditing] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState('');
const [mapTitle, setMapTitle] = useState(() => savedEditorState?.mapTitle || editorSetup?.title || t('editor.untitledMap'));
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishDescription, setPublishDescription] = useState(() => {
    if (typeof savedEditorState?.publishDescription === 'string') return savedEditorState.publishDescription;
    return editorSetup?.description || '';
  });
  const [publishTags, setPublishTags] = useState(() => savedEditorState?.publishTags || editorSetup?.tags?.join(', ') || '');
  const [publishPrivacy, setPublishPrivacy] = useState(() => savedEditorState?.publishPrivacy || editorSetup?.privacy || 'public');
  const [publishVideoUrl, setPublishVideoUrl] = useState(() => savedEditorState?.publishVideoUrl || editorSetup?.videoUrl || '');
  const [publishSelfieUrls, setPublishSelfieUrls] = useState(() => {
    if (Array.isArray(savedEditorState?.publishSelfieUrls)) return savedEditorState.publishSelfieUrls;
    if (typeof savedEditorState?.publishSelfieUrl === 'string' && savedEditorState.publishSelfieUrl) return [savedEditorState.publishSelfieUrl];
    return [];
  });
  const [publishCoverImage, setPublishCoverImage] = useState(() => {
    if (typeof savedEditorState?.publishCoverImage === 'string' && savedEditorState.publishCoverImage) return savedEditorState.publishCoverImage;
    return editorSetup?.imageUrl || '';
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [contextMenuElementId, setContextMenuElementId] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedUploads, setSelectedUploads] = useState([]);
  const [elementUploadError, setElementUploadError] = useState('');
  const fileInputRef = useRef(null);
  const elementImageInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const locationVideoInputRef = useRef(null);
  const locationSelfieInputRef = useRef(null);
  const nextElementId = useRef(0);

  const getElementLabel = (element) => (element.labelKey ? t(element.labelKey) : element.label);

  const pushHistory = () => {
    setHistory((previous) => [...previous, { elements, elementPositions, routes, navStartId, navEndId }]);
    setFuture([]);
  };

  // Drop A/B references to an element that no longer exists as a location.
  const pruneNavForElement = useCallback((elementId) => {
    if (navStartId === elementId) setNavStartId(null);
    if (navEndId === elementId) setNavEndId(null);
  }, [navStartId, navEndId]);

  const editorDraftState = {
    elements,
    elementPositions,
    routes,
    navStartId,
    navEndId,
    selectedTemplate,
    backgroundImage,
    canvasWidth,
    canvasHeight,
    mapTitle,
    publishDescription,
    publishTags,
    publishPrivacy,
    publishVideoUrl,
    publishSelfieUrls,
    publishCoverImage,
    // keep legacy single for backwards compat
    publishSelfieUrl: publishSelfieUrls[0] || ''
  };

  const persistEditorStateToStore = useCallback((id, state) => {
    if (!id) return;
    const snapshot = { ...state, updatedAt: Date.now() };
    try {
      const key = 'project_travelcraft_editorSaves';
      let saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(key)) || {};
      } catch {
        saved = {};
      }
      saved[id] = snapshot;
      localStorage.setItem(key, JSON.stringify(saved));
    } catch (err) {
      console.warn('Editor autosave error:', err);
    }
    saveEditorMapState(id, state);
  }, [saveEditorMapState]);

  const persistEditorStateRef = useRef(persistEditorStateToStore);
  useEffect(() => {
    persistEditorStateRef.current = persistEditorStateToStore;
  }, [persistEditorStateToStore]);

  useEffect(() => {
    if (!dragging) return undefined;

    const handlePointerMove = (event) => {
      if (dragging.mode === 'rotate') {
        const viewportRect = viewportRef.current.getBoundingClientRect();
        // The element's center in client coordinates
        const elementCenterClientX = viewportRect.left + (dragging.startLeft + dragging.startWidth / 2 + camera.x) * camera.scale;
        const elementCenterClientY = viewportRect.top + (dragging.startTop + dragging.startHeight / 2 + camera.y) * camera.scale;
        
        const dx = event.clientX - elementCenterClientX;
        const dy = event.clientY - elementCenterClientY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Add -90 because the handle is at the bottom (+90 deg in screen coords)
        const newRotation = (angle - 90 + 360) % 360;

        setElements((previous) => previous.map((el) => el.id === dragging.id ? { ...el, rotation: newRotation } : el));
        return;
      }

      const scale = camera.scale;
      const deltaX = (event.clientX - dragging.startX) / scale;
      const deltaY = (event.clientY - dragging.startY) / scale;

      setElementPositions((previous) => {
        const element = previous[dragging.id];
        
        if (dragging.mode.startsWith('resize')) {
          let nextWidth = dragging.startWidth;
          let nextHeight = dragging.startHeight;
          let nextLeft = dragging.startLeft;
          let nextTop = dragging.startTop;

          if (dragging.mode.includes('r')) {
            nextWidth = Math.max(MIN_ELEMENT_SIZE, dragging.startWidth + deltaX);
          } else if (dragging.mode.includes('l')) {
            nextWidth = Math.max(MIN_ELEMENT_SIZE, dragging.startWidth - deltaX);
            nextLeft = dragging.startLeft + (dragging.startWidth - nextWidth);
          }

          if (dragging.mode.includes('b')) {
            nextHeight = Math.max(MIN_ELEMENT_SIZE, dragging.startHeight + deltaY);
          } else if (dragging.mode.includes('t')) {
            nextHeight = Math.max(MIN_ELEMENT_SIZE, dragging.startHeight - deltaY);
            nextTop = dragging.startTop + (dragging.startHeight - nextHeight);
          }

          return { ...previous, [dragging.id]: { ...element, width: nextWidth, height: nextHeight, left: nextLeft, top: nextTop } };
        }

        return {
          ...previous,
          [dragging.id]: {
            ...element,
            left: dragging.startLeft + deltaX,
            top: dragging.startTop + deltaY
          }
        };
      });
    };

    const handlePointerUp = () => setDragging(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, camera.scale]);

  const updateSelectedLocationData = (key, value) => {
    pushHistory();
    setElements((previous) => previous.map((element) => {
      if (element.id === selectedElement) {
        return {
          ...element,
          locationDetails: {
            ...(element.locationDetails || {}),
            [key]: value
          }
        };
      }
      return element;
    }));
  };

  const patchLocationDetails = (patch) => {
    pushHistory();
    setElements((previous) => previous.map((element) => {
      if (element.id === selectedElement) {
        return {
          ...element,
          locationDetails: {
            ...(element.locationDetails || {}),
            ...patch
          }
        };
      }
      return element;
    }));
  };

  const removeLocationMedia = (key) => {
    pushHistory();
    setElements((previous) => previous.map((element) => {
      if (element.id !== selectedElement) return element;
      const details = { ...(element.locationDetails || {}) };
      delete details[key];
      return { ...element, locationDetails: details };
    }));
  };

  const handleLocationVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('video/')) return;
    if (file.size > 25 * 1024 * 1024) return;
    try {
      const url = await uploadMapMedia(mapId, 'loc-video', file);
      if (url) patchLocationDetails({ video: url });
    } catch (err) {
      console.warn('Location video upload skipped:', err);
    }
  };

  const addLocationSelfie = (url) => {
    pushHistory();
    setElements((previous) => previous.map((element) => {
      if (element.id !== selectedElement) return element;
      const existing = Array.isArray(element.locationDetails?.selfies) ? element.locationDetails.selfies : [];
      return {
        ...element,
        locationDetails: {
          ...(element.locationDetails || {}),
          selfies: [...existing, url].slice(0, 9)
        }
      };
    }));
  };

  const handleLocationSelfieUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = '';
    const currentCount = Array.isArray(selectedData?.locationDetails?.selfies) ? selectedData.locationDetails.selfies.length : 0;
    const toProcess = files.slice(0, Math.max(0, 9 - currentCount));
    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 8 * 1024 * 1024) continue;
      try {
        const url = await uploadMapMedia(mapId, 'loc-selfie', file);
        if (url) addLocationSelfie(url);
      } catch (err) {
        console.warn('Location selfie upload skipped:', err);
      }
    }
  };

  const removeLocationSelfie = (idx) => {
    pushHistory();
    setElements((previous) => previous.map((element) => {
      if (element.id !== selectedElement) return element;
      const existing = Array.isArray(element.locationDetails?.selfies) ? element.locationDetails.selfies : [];
      return {
        ...element,
        locationDetails: {
          ...(element.locationDetails || {}),
          selfies: existing.filter((_, i) => i !== idx)
        }
      };
    }));
  };

  const commitLiveDrawing = (draw) => {
    if (!draw || (draw.tool === 'pen' || draw.tool === 'highlight') && draw.points.length < 2) return;
    pushHistory();
    
    if (draw.tool === 'eraser') {
      // Add a small 5px padding so single clicks have a hitbox
      const minX = Math.min(draw.minX, draw.maxX) - 5;
      const maxX = Math.max(draw.minX, draw.maxX) + 5;
      const minY = Math.min(draw.minY, draw.maxY) - 5;
      const maxY = Math.max(draw.minY, draw.maxY) + 5;
      
      // Helper to check if a line segment intersects a box
      const lineIntersectsBox = (p1, p2, boxMinX, boxMaxX, boxMinY, boxMaxY) => {
        // If either point is inside, it intersects
        if ((p1.x >= boxMinX && p1.x <= boxMaxX && p1.y >= boxMinY && p1.y <= boxMaxY) ||
            (p2.x >= boxMinX && p2.x <= boxMaxX && p2.y >= boxMinY && p2.y <= boxMaxY)) {
          return true;
        }
        // Check intersection with the 4 box edges (using simple AABB vs line segment check)
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        // Quick rejection
        if (maxX < boxMinX || minX > boxMaxX || maxY < boxMinY || minY > boxMaxY) return false;
        
        // Detailed check using line equation A*x + B*y + C = 0
        const crossProduct = (a, b, c) => (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
        const segmentsIntersect = (a, b, c, d) => {
          return ((crossProduct(a, b, c) * crossProduct(a, b, d) < 0) &&
                  (crossProduct(c, d, a) * crossProduct(c, d, b) < 0));
        };
        const tl = {x: boxMinX, y: boxMinY}, tr = {x: boxMaxX, y: boxMinY};
        const bl = {x: boxMinX, y: boxMaxY}, br = {x: boxMaxX, y: boxMaxY};
        
        return segmentsIntersect(p1, p2, tl, tr) || segmentsIntersect(p1, p2, tr, br) ||
               segmentsIntersect(p1, p2, br, bl) || segmentsIntersect(p1, p2, bl, tl);
      };

      // Find all elements that intersect with the eraser box
      const toDeleteElements = elements.filter(element => {
        const pos = elementPositions[element.id];
        if (!pos) return false;
        // Quick AABB check first
        if (!(pos.left < maxX && pos.left + pos.width > minX && pos.top < maxY && pos.top + pos.height > minY)) {
          return false;
        }
        
        // For drawn lines, do precise intersection so we don't accidentally erase empty space in its bounding box
        if (element.type === 'drawing' && Array.isArray(element.points)) {
          // The line points are local to pos.left, pos.top
          for (let i = 0; i < element.points.length; i++) {
            const worldX = element.points[i].x + pos.left;
            const worldY = element.points[i].y + pos.top;
            if (worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY) return true;
          }
          for (let i = 0; i < element.points.length - 1; i++) {
            const p1 = { x: element.points[i].x + pos.left, y: element.points[i].y + pos.top };
            const p2 = { x: element.points[i+1].x + pos.left, y: element.points[i+1].y + pos.top };
            if (lineIntersectsBox(p1, p2, minX, maxX, minY, maxY)) return true;
          }
          return false;
        }
        
        return true;
      });
      
      // Find freehand routes that intersect with the eraser box
      const toDeleteRoutes = routes.filter(route => {
        if (!route.points || route.points.length === 0) return false;
        
        // Check points first
        if (route.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) return true;
        
        // Check line segments
        for (let i = 0; i < route.points.length - 1; i++) {
          if (lineIntersectsBox(route.points[i], route.points[i+1], minX, maxX, minY, maxY)) return true;
        }
        return false;
      });

      if (toDeleteElements.length > 0 || toDeleteRoutes.length > 0) {
        setPendingDeleteSelection({
          elementIds: toDeleteElements.map(e => e.id),
          routeIds: toDeleteRoutes.map(r => r.id),
          box: { minX, maxX, minY, maxY }
        });
      }
      return;
    }

    nextElementId.current += 1;
    const isShapeTool = ['rectangle', 'circle', 'grid'].includes(draw.tool);
    if (isShapeTool) {
      const id = `shape-${nextElementId.current}`;
      const box = {
        left: Math.min(draw.minX, draw.maxX),
        top: Math.min(draw.minY, draw.maxY),
        width: Math.max(MIN_ELEMENT_SIZE, Math.abs(draw.maxX - draw.minX)),
        height: Math.max(MIN_ELEMENT_SIZE, Math.abs(draw.maxY - draw.minY))
      };
      setElements((prev) => [...prev, { id, type: 'shape', shape: draw.tool, labelKey: `editor.${draw.tool}`, content: '', color: drawingColor, rotation: 0 }]);
      setElementPositions((prev) => ({ ...prev, [id]: box }));
      setSelectedElement(id);
    } else {
      const points = draw.points;
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const id = `draw-${nextElementId.current}`;
      const box = {
        left: minX - 20,
        top: minY - 20,
        width: Math.max(MIN_ELEMENT_SIZE, maxX - minX + 40),
        height: Math.max(MIN_ELEMENT_SIZE, maxY - minY + 40)
      };
      setElements((prev) => [...prev, {
        id, type: 'drawing', shape: draw.tool === 'highlight' ? 'highlight' : 'line',
        labelKey: draw.tool === 'highlight' ? 'editor.highlight' : 'editor.drawLine',
        points: points.map(p => ({ x: p.x - box.left, y: p.y - box.top })),
        color: drawingColor, thickness: draw.tool === 'highlight' ? 60 : 8, rotation: 0
      }]);
      setElementPositions((prev) => ({ ...prev, [id]: box }));
      setSelectedElement(id);
    }
  };

  const confirmPendingDelete = useCallback(() => {
    if (!pendingDeleteSelection) return;
    pushHistory();
    const { elementIds, routeIds } = pendingDeleteSelection;
    
    if (elementIds.length > 0) {
      const deleteIds = new Set(elementIds);
      setElements(prev => prev.filter(e => !deleteIds.has(e.id)));
      setElementPositions(prev => {
        const next = { ...prev };
        deleteIds.forEach(id => delete next[id]);
        return next;
      });
      setRoutes(prev => prev.map(route => ({
        ...route,
        pointIds: route.pointIds ? route.pointIds.filter(id => !deleteIds.has(id)) : []
      })));
      deleteIds.forEach(id => pruneNavForElement(id));
      if (selectedElement && deleteIds.has(selectedElement)) setSelectedElement(null);
    }
    
    if (routeIds.length > 0) {
      const deleteRouteIds = new Set(routeIds);
      setRoutes(prev => prev.filter(r => !deleteRouteIds.has(r.id)));
      if (activeRouteId && deleteRouteIds.has(activeRouteId)) setActiveRouteId(null);
    }
    
    setPendingDeleteSelection(null);
  }, [pendingDeleteSelection, elements, elementPositions, routes, selectedElement, activeRouteId, pruneNavForElement, pushHistory]);

   useEffect(() => {
     liveDrawingRef.current = liveDrawing;
   }, [liveDrawing]);

   const liveRouteRef = useRef(null);
   useEffect(() => {
     liveRouteRef.current = liveRouteDrawing;
   }, [liveRouteDrawing]);

   useEffect(() => {
     if (!liveRouteDrawing) return undefined;
     const handlePointerMove = (event) => {
       const rect = viewportRef.current.getBoundingClientRect();
       const x = (event.clientX - rect.left - camera.x) / camera.scale;
       const y = (event.clientY - rect.top - camera.y) / camera.scale;
       setLiveRouteDrawing((prev) => prev ? { ...prev, mousePos: { x, y } } : prev);
     };
     // Committing is now handled by double click or Escape key, not pointerUp
     window.addEventListener('pointermove', handlePointerMove);
     return () => {
       window.removeEventListener('pointermove', handlePointerMove);
     };
   }, [liveRouteDrawing, camera.scale]);

   useEffect(() => {
     if (!liveDrawing) return undefined;
    const handlePointerMove = (event) => {
      const rect = viewportRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - camera.x) / camera.scale;
      const y = (event.clientY - rect.top - camera.y) / camera.scale;
      setLiveDrawing((prev) => prev ? {
        ...prev,
        points: [...prev.points, { x, y }],
        minX: Math.min(prev.minX, x), maxX: Math.max(prev.maxX, x),
        minY: Math.min(prev.minY, y), maxY: Math.max(prev.maxY, y)
      } : prev);
    };

    const handlePointerUp = () => {
      commitLiveDrawing(liveDrawingRef.current);
      setLiveDrawing(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [liveDrawing, camera.scale]);

  useEffect(() => {
    const handleDeleteKey = (event) => {
      if (!selectedElement || (event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement)) return;
      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        setHistory((previous) => [...previous, { elements, elementPositions, routes }]);
        setFuture([]);
        const turningOff = elements.find((element) => element.id === selectedElement)?.isLocation === true;
        setElements((previous) => previous.map((element) =>
          element.id === selectedElement ? { ...element, isLocation: !element.isLocation } : element
        ));
        if (turningOff) {
          setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) })));
          pruneNavForElement(selectedElement);
        }
        return;
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      event.preventDefault();
      setHistory((previous) => [...previous, { elements, elementPositions, routes, navStartId, navEndId }]);
      setFuture([]);
      setElements((previous) => previous.filter((element) => element.id !== selectedElement));
      setElementPositions((previous) => {
        const next = { ...previous };
        delete next[selectedElement];
        return next;
      });
      setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) })));
      pruneNavForElement(selectedElement);
      setSelectedElement(null);
    };

     window.addEventListener('keydown', handleDeleteKey);
     return () => window.removeEventListener('keydown', handleDeleteKey);
   }, [selectedElement, elements, elementPositions, routes, navStartId, navEndId, pruneNavForElement]);

   const commitLiveRouteDrawing = useCallback(() => {
     const draw = liveRouteRef.current;
     if (draw && draw.points.length >= 2) {
       pushHistory();
       nextRouteId.current += 1;
       const id = `route-${Date.now()}-${nextRouteId.current}`;
       setRoutes((prev) => [...prev, {
         id,
         name: `${t('editor.routeDefaultName')} ${prev.length + 1}`,
         color: draw.color || drawingColor,
         points: [...draw.points],
         pointIds: [],
         thickness: draw.thickness || routeThickness,
         visible: true
       }]);
     }
     setLiveRouteDrawing(null);
   }, [drawingColor, routeThickness, t]);

   // Finish polyline drawing on Enter, cancel on Escape
   useEffect(() => {
     const handleKeyDown = (event) => {
       if (event.key === 'Enter' && liveRouteRef.current) {
         commitLiveRouteDrawing();
       } else if (event.key === 'Escape' && liveRouteRef.current) {
         setLiveRouteDrawing(null);
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [commitLiveRouteDrawing]);

  // Register a fresh map as an openable draft (runs once on open).
  useEffect(() => {
    if (editorSetup?.isExistingMap) return;
    registerEditorDraft({
      id: mapId,
      title: savedEditorState?.mapTitle || editorSetup?.title || 'Untitled Map',
      description: savedEditorState?.publishDescription || editorSetup?.description || '',
      tags: (savedEditorState?.publishTags || editorSetup?.tags?.join(', ') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      privacy: savedEditorState?.publishPrivacy || editorSetup?.privacy || 'public',
      hours: editorSetup?.hours,
      fee: editorSetup?.fee,
      bestTime: editorSetup?.bestTime,
      travel: editorSetup?.travel,
      logs: editorSetup?.logs || [],
      imageUrl: editorSetup?.imageUrl || '',
      rarity: editorSetup?.rarity || 'common',
      locationCity: editorSetup?.locationCity || editorSetup?.region || '',
      editorState: savedEditorState || null
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit the world into view once the viewport has been measured.
  useEffect(() => {
    if (ready || !viewportSize.width || !viewportSize.height) return undefined;
    const timer = setTimeout(() => {
      fitView();
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, viewportSize.width, viewportSize.height, fitView]);

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    event.target.value = '';
    
    // Create an image element to read the original dimensions
    const img = new Image();
    img.onload = async () => {
      // Scale dimensions so the max dimension is DEFAULT_CANVAS_WIDTH (e.g. 4000)
      const maxDim = Math.max(img.width, img.height);
      const scale = DEFAULT_CANVAS_WIDTH / maxDim;
      const newWidth = Math.round(img.width * scale);
      const newHeight = Math.round(img.height * scale);
      
      const small = await compressForUpload(file, { maxWidth: 1280, quality: 0.8 });
      addUserAsset({ type: 'background', label: file.name, file: small || file }).then((asset) => {
        if (asset?.url) {
          setBackgroundImage(asset.url);
          setCanvasWidth(newWidth);
          setCanvasHeight(newHeight);
        }
      });
    };
    img.src = URL.createObjectURL(file);
  };

  const clearBackground = () => {
    setBackgroundImage('');
    setCanvasWidth(DEFAULT_CANVAS_WIDTH);
    setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
  };

    const handleWorldPointerDown = (event) => {
      setTourActive(false);
      setContextMenuElementId(null);
      setPendingDeleteSelection(null);
      const isDrawTool = ['pen', 'highlight', 'rectangle', 'circle', 'grid', 'eraser'].includes(activeTool);
      const isRouteDraw = activeTool === 'draw-route';
      
      if (isDrawTool || isRouteDraw) {
        if (event.button === 2) {
          // Right click commits live drawing
          if (isRouteDraw) {
            commitLiveRouteDrawing();
          } else {
            if (liveDrawingRef.current) commitLiveDrawing(liveDrawingRef.current);
            setLiveDrawing(null);
          }
          return;
        }
        
        // Only trigger if clicking on canvas OR if we let it bubble from an element (because we want to draw over it)
        // Note: we can just check event.button === 0 (left click)
        if (event.button === 0) {
          event.stopPropagation();
          const rect = viewportRef.current.getBoundingClientRect();
          const x = (event.clientX - rect.left - camera.x) / camera.scale;
          const y = (event.clientY - rect.top - camera.y) / camera.scale;
          if (isRouteDraw) {
            setLiveRouteDrawing((prev) => {
              if (prev) {
                return { ...prev, points: [...prev.points, { x, y }], mousePos: { x, y } };
              }
              return { tool: 'route', points: [{ x, y }], mousePos: { x, y }, color: drawingColor, thickness: routeThickness };
            });
            return;
          }
          setLiveDrawing({ tool: activeTool, points: [{ x, y }], minX: x, maxX: x, minY: y, maxY: y });
          return;
        }
      }
     // Only pan on middle-mouse OR clicking directly on the canvas background (not on an element)
     if (event.button === 1 || (event.target === event.currentTarget && !dragging)) {
       startPan(event.clientX, event.clientY);
     }
   };

  // Auto-save on edit or open (debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      persistEditorStateRef.current(mapId, {
        elements,
        elementPositions,
        routes,
        navStartId,
        navEndId,
        selectedTemplate,
        backgroundImage,
        canvasWidth,
        canvasHeight,
        mapTitle,
        publishDescription,
        publishTags,
        publishPrivacy,
        publishVideoUrl,
        publishSelfieUrls,
        publishCoverImage,
        publishSelfieUrl: publishSelfieUrls[0] || ''
      });
      setAutosaveStatus('Saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [elements, elementPositions, routes, navStartId, navEndId, selectedTemplate, backgroundImage, canvasWidth, canvasHeight, mapTitle, publishDescription, publishTags, publishPrivacy, publishVideoUrl, publishSelfieUrls, publishCoverImage, mapId]);

  useEffect(() => {
    tourCameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    if (!tourActive) return undefined;
    const stop = tourStops[tourIndex];
    const pos = stop?.element ? elementPositions[stop.element.id] : null;
    if (!stop || !pos) {
      const stopTimer = setTimeout(() => setTourActive(false), 0);
      return () => clearTimeout(stopTimer);
    }

    const targetScale = clampValue(Math.min(
      (viewportSize.width * 0.6) / pos.width,
      (viewportSize.height * 0.6) / pos.height
    ), MIN_ZOOM, MAX_ZOOM);
    const targetX = ((viewportSize.width - pos.width * targetScale) / 2) - pos.left * targetScale;
    const targetY = ((viewportSize.height - pos.height * targetScale) / 2) - pos.top * targetScale;

    let frameId;
    let holdTimer;
    let startTime = null;
    const duration = 700;

    const frame = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = tourCameraRef.current;
      setCamera({
        x: current.x + (targetX - current.x) * ease,
        y: current.y + (targetY - current.y) * ease,
        scale: current.scale + (targetScale - current.scale) * ease
      });
      if (progress < 1) {
        frameId = requestAnimationFrame(frame);
      } else {
        holdTimer = setTimeout(() => {
          if (tourIndex < tourStops.length - 1) setTourIndex(tourIndex + 1);
          else setTourActive(false);
        }, 1800);
      }
    };
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(holdTimer);
    };
  }, [tourActive, tourIndex, viewportSize, tourStops, elementPositions, setCamera]);

  const startDragging = (elementId, event, mode = 'move') => {
    event.stopPropagation();
    setTourActive(false);
    endPan(); // stop any active pan so dragging takes over
    const position = elementPositions[elementId];
    pushHistory();
    setSelectedElement(elementId);
    setContextMenuElementId(null);
    setDragging({
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: position.left,
      startTop: position.top,
      startWidth: position.width,
      startHeight: position.height,
      mode
    });
  };

  const startDraggingControlPoint = (e, routeId, cpIndex) => {
    e.stopPropagation();
    e.preventDefault();
    pushHistory();
    
    const onMove = (moveEvent) => {
      const rect = viewportRef.current.getBoundingClientRect();
      const worldX = (moveEvent.clientX - rect.left - camera.x) / camera.scale;
      const worldY = (moveEvent.clientY - rect.top - camera.y) / camera.scale;

      setRoutes((prev) => prev.map((route) => {
        if (route.id !== routeId) return route;
        const newCp = [...(route.controlPoints || [])];
        newCp[cpIndex] = { x: worldX, y: worldY };
        return { ...route, controlPoints: newCp };
      }));
    };
    
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((current) => [...current, { elements, elementPositions, routes, navStartId, navEndId }]);
    setElements(previous.elements);
    setElementPositions(previous.elementPositions);
    if (Array.isArray(previous.routes)) setRoutes(previous.routes);
    if ('navStartId' in previous) setNavStartId(previous.navStartId);
    if ('navEndId' in previous) setNavEndId(previous.navEndId);
    setHistory((current) => current.slice(0, -1));
    setSelectedElement(null);
  };

  const redo = () => {
    const next = future[future.length - 1];
    if (!next) return;
    setHistory((current) => [...current, { elements, elementPositions, routes, navStartId, navEndId }]);
    setElements(next.elements);
    setElementPositions(next.elementPositions);
    if (Array.isArray(next.routes)) setRoutes(next.routes);
    if ('navStartId' in next) setNavStartId(next.navStartId);
    if ('navEndId' in next) setNavEndId(next.navEndId);
    setFuture((current) => current.slice(0, -1));
    setSelectedElement(null);
  };

  const updateSelectedPosition = (property, value) => {
    if (!selectedElement) return;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;
    pushHistory();
    setElementPositions((previous) => {
      const current = previous[selectedElement];
      const maxValue = property === 'width' ? canvasWidth - current.left
        : property === 'height' ? canvasHeight - current.top
          : property === 'left' ? canvasWidth - current.width
            : canvasHeight - current.height;
      return {
        ...previous,
        [selectedElement]: {
          ...current,
          [property]: Math.max(property === 'width' || property === 'height' ? MIN_ELEMENT_SIZE : 0, Math.min(maxValue, numericValue))
        }
      };
    });
  };

  const moveLayer = (direction) => {
    if (!selectedElement) return;
    pushHistory();
    setElements((previous) => {
      const index = previous.findIndex((element) => element.id === selectedElement);
      if (index < 0) return previous;
      const nextIndex = direction === 'front' ? previous.length - 1 : 0;
      const reordered = [...previous];
      const [item] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, item);
      return reordered;
    });
  };

  const changeSelectedShape = (shape) => {
    if (!selectedElement || selectedData?.type !== 'shape') return;
    pushHistory();
    setElements((previous) => previous.map((element) => (
      element.id === selectedElement ? { ...element, shape } : element
    )));
  };

  const changeSelectedFrameShape = (frameShape) => {
    if (!selectedElement || selectedData?.type === 'shape' || selectedData?.type === 'drawing') return;
    pushHistory();
    setElements((previous) => previous.map((element) => (
      element.id === selectedElement ? { ...element, frameShape: frameShape || undefined } : element
    )));
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const source = elements.find((element) => element.id === selectedElement);
    if (!source) return;

    const duplicateId = `${source.type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const position = elementPositions[selectedElement] ?? { left: 0, top: 0, width: 100, height: 100 };

    setElements((previous) => [...previous, { ...source, id: duplicateId, label: `${getElementLabel(source)} ${t('editor.copySuffix')}`, labelKey: undefined }]);
    setElementPositions((previous) => ({
      ...previous,
      [duplicateId]: {
        left: Math.min(position.left + 24, canvasWidth - position.width),
        top: Math.min(position.top + 24, canvasHeight - position.height),
        width: position.width,
        height: position.height
      }
    }));
    setSelectedElement(duplicateId);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    pushHistory();
    setElements((previous) => previous.filter((element) => element.id !== selectedElement));
    setElementPositions((previous) => {
      const next = { ...previous };
      delete next[selectedElement];
      return next;
    });
    setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) })));
    pruneNavForElement(selectedElement);
    setSelectedElement(null);
  };

  const toggleLockSelectedElement = () => {
    if (!selectedElement) return;
    setElements((previous) => previous.map((element) =>
      element.id === selectedElement ? { ...element, locked: !element.locked } : element
    ));
  };

  const togglePinSelectedElement = () => {
    if (!selectedElement) return;
    const turningOff = selectedData?.isLocation === true;
    pushHistory();
    setElements((previous) => previous.map((element) =>
      element.id === selectedElement ? { ...element, isLocation: !element.isLocation } : element
    ));
    if (turningOff) {
      setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) })));
      pruneNavForElement(selectedElement);
    }
  };

  const handlePinToolbarClick = () => {
    if (!selectedElement) return;
    const isAlreadyLocation = selectedData?.isLocation;
    togglePinSelectedElement();
    setLocationModalOpen(!isAlreadyLocation);
  };

  const saveDraft = () => {
    persistEditorStateToStore(mapId, editorDraftState);
    setSaveStatus(t('editor.statusDraftSaved'));
  };

  const publishMap = async (updates) => {
    // Build traveler logs with all attached selfies (multi)
    let finalLogs = Array.isArray(editorSetup?.logs) ? [...editorSetup.logs] : [];
    if (Array.isArray(updates.selfieUrls) && updates.selfieUrls.length) {
      // eslint-disable-next-line react-hooks/purity -- unique id for publish-time log entries (event handler, not render)
      const baseTime = Date.now();
      const selfieLogs = updates.selfieUrls.map((img, idx) => ({
        id: `selfie-${baseTime}-${idx}`,
        type: 'selfie',
        image: img,
        caption: updates.title.trim() || t('editor.untitledMap'),
        author: userProfile?.name || 'Traveler',
        date: new Date().toLocaleDateString(),
      }));
      finalLogs = [...finalLogs, ...selfieLogs];
    }

    const publishedPins = derivePinsFromElements(elements, elementPositions, (el) => (el.labelKey ? t(el.labelKey) : el.label));

    // ฝังรูปพื้นหลังจริง (รูป template / base map / อัปโหลดเอง) ลง previewBackground
    // เดิมใช้ activeTemplate.canvas ตรง ๆ ซึ่งของ template รูปภาพเป็น 'none'
    // ทำให้การ์ดหน้า Home/Community เห็นแค่สีพื้น ไม่เห็นรูป
    const canvasBase = activeTemplate.canvas || {};
    const previewBackground = (typeof backgroundImage === 'string' && backgroundImage)
      ? {
          ...canvasBase,
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : canvasBase;

    const mapData = {
id: mapId,
      title: updates.title.trim() || t('editor.untitledMap'),
      region: editorSetup?.locationCity || editorSetup?.region || '',
      description: updates.description.trim() || t('editor.generatingDesc', {
        user: userProfile?.name || 'a TravelCraft traveler',
        name: t(activeTemplate.labelKey)
      }),
      imageUrl: updates.imageUrl || editorSetup?.imageUrl || null,
      videoUrl: updates.videoUrl,
      previewBackground,
      bgThemeUrl: typeof backgroundImage === 'string' && backgroundImage ? backgroundImage : null,
      isEditorMap: true,
      hours: editorSetup?.hours || '24/7',
      fee: editorSetup?.fee || t('editor.freeExploration'),
      bestTime: editorSetup?.bestTime || t('editor.anytime'),
      travel: editorSetup?.travel || t('editor.communityGateway'),
      logs: finalLogs,
      selfieUrl: updates.selfieUrl || null,
      selfieUrls: Array.isArray(updates.selfieUrls) && updates.selfieUrls.length ? [...updates.selfieUrls] : null,
      rarity: editorSetup?.rarity || 'common',
      tags: Array.isArray(updates.tags) ? updates.tags : [],
      privacy: updates.privacy,
      pins: publishedPins,
      routes: deriveRoutePathsFromElements(routes, elementPositions),
      navAB: navABPoints ? {
        startId: navStartId,
        endId: navEndId,
        thickness: routeThickness,
        points: navABPoints.map((p) => ({
          left: `${((p.x / canvasWidth) * 100).toFixed(2)}%`,
          top: `${((p.y / canvasHeight) * 100).toFixed(2)}%`
        }))
      } : null,
      editorState: editorDraftState
    };

if (updates.privacy === 'private') {
      localStorage.setItem('project_travelcraft_editor_draft', JSON.stringify({ elements, elementPositions, routes, navStartId, navEndId, selectedTemplate, ...mapData }));
      setSaveStatus(t('editor.statusPrivateSaved'));
      setShowPublishModal(false);
      return;
    }

    publishMapToCommunity(mapData);

    if (updates.privacy === 'unlisted') {
      setShareUrl(`${window.location.origin}${window.location.pathname}#/map/${mapId}`);
      setShowPublishModal(false);
      setShowShareModal(true);
      return;
    }

    const wonBadges = awardPublishBadges();
    setRecentlyWonBadges(wonBadges);
    setShowBadgeCelebration(wonBadges.length > 0);
    setSaveStatus(t('editor.statusPublished'));
    setShowPublishModal(false);
    triggerConfetti();
  };

  const [shareUrl, setShareUrl] = useState(window.location.href);
  const shareTitle = t('editor.shareTitle');
  const openShareLink = (url) => {
    const shareWindow = window.open(url, '_blank');
    if (!shareWindow) setSaveStatus(t('editor.sharePopupRequired'));
  };
  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      return true;
    } catch {
      return false;
    }
  };
  const copyShareLink = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      setSaveStatus(t('editor.linkCopied'));
      setTimeout(() => setCopied(false), 1800);
    } else {
      setSaveStatus(t('editor.linkCopyFailed'));
    }
  };
  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: t('editor.nativeShareText'), url: shareUrl });
      } else {
        await copyShareLink();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        await copyShareLink();
      }
    }
  };

  const addElement = (element) => {
    setActiveTool('select');
    const limit = globalSettings?.maxPinsPerMap;
    if (limit && elements.length >= limit) {
      showAdminToast?.(`Map reached the max limit of ${limit} elements.`, 'error');
      return;
    }
    pushHistory();
    nextElementId.current += 1;
    const id = `${element.type}-${nextElementId.current}`;
    const colorValue = element.color ?? drawingColor ?? '#111111';
    const textStyles = element.type === 'text'
      ? {
          fontSize: element.fontSize ?? 160,
          fontWeight: element.fontWeight ?? 900,
          color: colorValue
        }
      : { color: colorValue };
    setElements((previous) => [...previous, { ...element, ...textStyles, id, color: colorValue }]);
    const width = element.type === 'text' ? 400 : 500;
    const height = element.type === 'text' ? Math.max(140, (element.fontSize ?? 160) * 1.5) : 500;
    const fallbackLeft = canvasWidth / 2 - width / 2;
    const fallbackTop = canvasHeight / 2 - height / 2;
    const viewportX = viewportSize.width / 2;
    const viewportY = viewportSize.height / 2;
    const placeLeft = viewportSize.width
      ? Math.max(0, Math.min(canvasWidth - width, Math.round((viewportX - camera.x) / camera.scale - width / 2)))
      : fallbackLeft;
    const placeTop = viewportSize.height
      ? Math.max(0, Math.min(canvasHeight - height, Math.round((viewportY - camera.y) / camera.scale - height / 2)))
      : fallbackTop;
    setElementPositions((previous) => ({
      ...previous,
      [id]: { left: placeLeft, top: placeTop, width, height }
    }));
    setSelectedElement(id);
  };

  const startPaletteDrag = (event, element) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-travelcraft-element', JSON.stringify(element));
  };

  const placeElementIntoShape = (source, shapeElement) => {
    if (!elementPositions[shapeElement.id] || !source?.type) return;
    pushHistory();
    setElements((previous) => previous.map((element) => (
      element.id === shapeElement.id
        ? { ...element, isFrame: true, frameImage: { type: source.type, content: source.content, label: source.label } }
        : element
    )));
    setSelectedElement(shapeElement.id);
  };

  const addElementIntoShape = (event, shapeElement) => {
    event.preventDefault();
    event.stopPropagation();
    const raw = event.dataTransfer.getData('application/x-travelcraft-element');
    if (!raw) return;
    let source;
    try {
      source = JSON.parse(raw);
    } catch {
      return;
    }
    placeElementIntoShape(source, shapeElement);
  };

  const addPaletteElement = (source) => {
    setActiveTool('select');
    const selectedShape = selectedData?.type === 'shape' ? selectedData : null;
    if (selectedShape) placeElementIntoShape(source, selectedShape);
    else addElement(source);
  };

  const updateSelectedTextStyle = (updates) => {
    if (!selectedElement) return;
    setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, ...updates } : element));
  };

  const applyTextStyle = (updates) => {
    pushHistory();
    updateSelectedTextStyle(updates);
  };

  const startTour = () => {
    if (!tourStops.length) return;
    setShowShareModal(false);
    setShowPublishModal(false);
    setEditingTextId(null);
    setSelectedElement(null);
    setContextMenuElementId(null);
    setTourIndex(0);
    setTourActive(true);
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.55 } }), 250);
      setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { y: 0.65 }, scalar: 0.8 }), 500);
    } catch {
      // confetti optional, ignore failures
    }
  };

  const awardPublishBadges = () => {
    if (!userProfile) return [];
    const current = Array.isArray(userProfile.badges) ? userProfile.badges : [];
    const won = [];
    const add = (name) => { if (!current.includes(name)) won.push(name); };
    const myPublishedCount = (communityMaps || []).filter((m) => (userProfile?.id ? m.ownerId === userProfile.id : m.discoveredBy === userProfile?.name)).length;
    if (myPublishedCount === 0) add('Cartographer');
    if (elements.length >= 10) add('Master Builder');
    if (publishSelfieUrls.length > 0) add('Storyteller');
    if (won.length) {
      updateUserBadges([...current, ...won]);
    }
    return won;
  };

  // ---------- Navigation routes (connect location pins in order) ----------
  const locationElements = useMemo(() => elements.filter((el) => el.isLocation), [elements]);
  const routePaths = useMemo(() => buildRoutePaths(routes, elementPositions), [routes, elementPositions]);
  const activeRoute = routes.find((r) => r.id === activeRouteId) || null;

  const createRoute = () => {
    pushHistory();
    nextRouteId.current += 1;
    // eslint-disable-next-line react-hooks/purity -- unique id for event-handler created route (not render)
    const id = `route-${Date.now()}-${nextRouteId.current}`;
    const route = {
      id,
      name: `${t('editor.routeDefaultName')} ${routes.length + 1}`,
      color: '#cc0000',
      pointIds: [],
      visible: true
    };
    setRoutes((prev) => [...prev, route]);
    setActiveRouteId(id);
    setActiveTool('route');
  };

  const connectAllLocationsInOrder = () => {
    if (locationElements.length < 2) return;
    pushHistory();
    nextRouteId.current += 1;
    const id = `route-${Date.now()}-${nextRouteId.current}`;
    setRoutes((prev) => [...prev, {
      id,
      name: `${t('editor.routeDefaultName')} ${prev.length + 1}`,
      color: '#cc0000',
      pointIds: locationElements.map((el) => el.id),
      visible: true
    }]);
    setActiveRouteId(id);
  };

  const handleRoutePointClick = (elementId) => {
    const element = elements.find((el) => el.id === elementId);
    if (!element?.isLocation) {
      setSaveStatus(t('editor.routeNeedLocation'));
      return;
    }
    let targetId = activeRouteId;
    if (!targetId || !routes.some((r) => r.id === targetId)) {
      // auto-create a route on first click so the tool works in one step
      nextRouteId.current += 1;
      // eslint-disable-next-line react-hooks/purity -- unique id for event-handler created route (not render)
      targetId = `route-${Date.now()}-${nextRouteId.current}`;
      pushHistory();
      setRoutes((prev) => [...prev, {
        id: targetId,
        name: `${t('editor.routeDefaultName')} ${prev.length + 1}`,
        color: '#cc0000',
        pointIds: [elementId],
        visible: true
      }]);
      setActiveRouteId(targetId);
      setSelectedElement(elementId);
      return;
    }
    pushHistory();
    setRoutes((prev) => prev.map((route) => {
      if (route.id !== targetId) return route;
      // clicking the last point again removes it (easy undo of a misclick)
      if (route.pointIds[route.pointIds.length - 1] === elementId) {
        return { ...route, pointIds: route.pointIds.slice(0, -1) };
      }
      if (route.pointIds.includes(elementId)) return route;
      return { ...route, pointIds: [...route.pointIds, elementId] };
    }));
    setSelectedElement(elementId);
  };

  const moveRoutePoint = (routeId, index, direction) => {
    pushHistory();
    setRoutes((prev) => prev.map((route) => {
      if (route.id !== routeId) return route;
      const next = [...route.pointIds];
      const target = index + direction;
      if (target < 0 || target >= next.length) return route;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...route, pointIds: next };
    }));
  };

  const removeRoutePoint = (routeId, index) => {
    pushHistory();
    setRoutes((prev) => prev.map((route) => (
      route.id === routeId ? { ...route, pointIds: route.pointIds.filter((_, i) => i !== index) } : route
    )));
  };

  const deleteRoute = (routeId) => {
    pushHistory();
    setRoutes((prev) => prev.filter((route) => route.id !== routeId));
    if (activeRouteId === routeId) setActiveRouteId(null);
  };

  const addWaypointToRoute = (routeId) => {
    pushHistory();
    nextElementId.current += 1;
    const waypointId = `waypoint-${nextElementId.current}`;
    
    // Center of screen
    const x = -camera.x / camera.scale + (viewportSize.width / camera.scale) / 2;
    const y = -camera.y / camera.scale + (viewportSize.height / camera.scale) / 2;
    
    // Add a simple pin element
    setElements((prev) => [...prev, {
      id: waypointId,
      type: 'emoji',
      content: '📍',
      labelKey: 'editor.markAsLocation',
      color: '#111111',
      isLocation: true,
      isHiddenWaypoint: true,
      locationDetails: { name: `${t('editor.routePoints')} ${Math.floor(Math.random() * 1000)}` }
    }]);
    
    setElementPositions((prev) => ({
      ...prev,
      [waypointId]: { left: x - 40, top: y - 40, width: 80, height: 80 }
    }));
    
    // Add to route
    setRoutes((prev) => prev.map((route) => {
      if (route.id !== routeId) return route;
      return { ...route, pointIds: [...(route.pointIds || []), waypointId] };
    }));
    
    setActiveTool('select');
    setSelectedElement(waypointId);
  };

  const insertWaypointAtClick = (e, routeId, routePoints) => {
    e.stopPropagation();
    const rect = viewportRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - camera.x) / camera.scale;
    const worldY = (e.clientY - rect.top - camera.y) / camera.scale;

    // Find the closest segment
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const p1 = routePoints[i];
      const p2 = routePoints[i + 1];
      // distance from point to line segment
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      let t_param = 0;
      if (l2 !== 0) {
        t_param = Math.max(0, Math.min(1, ((worldX - p1.x) * (p2.x - p1.x) + (worldY - p1.y) * (p2.y - p1.y)) / l2));
      }
      const projX = p1.x + t_param * (p2.x - p1.x);
      const projY = p1.y + t_param * (p2.y - p1.y);
      const dist = Math.sqrt((worldX - projX) ** 2 + (worldY - projY) ** 2);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i + 1; // Insert AT this index
      }
    }

    pushHistory();
    nextElementId.current += 1;
    const waypointId = `waypoint-${nextElementId.current}`;
    
    setElements((prev) => [...prev, {
      id: waypointId,
      type: 'emoji',
      content: '📍',
      labelKey: 'editor.markAsLocation',
      color: '#111111',
      isLocation: true,
      isHiddenWaypoint: true,
      locationDetails: { name: `${t('editor.routePoints')} ${Math.floor(Math.random() * 1000)}` }
    }]);
    
    setElementPositions((prev) => ({
      ...prev,
      [waypointId]: { left: worldX - 40, top: worldY - 40, width: 80, height: 80 }
    }));
    
    setRoutes((prev) => prev.map((route) => {
      if (route.id !== routeId) return route;
      const nextPointIds = [...(route.pointIds || [])];
      nextPointIds.splice(closestIndex, 0, waypointId);
      // also adjust controlPoints array
      const nextCp = [...(route.controlPoints || [])];
      nextCp.splice(closestIndex - 1, 0, null); 
      return { ...route, pointIds: nextPointIds, controlPoints: nextCp };
    }));
    
    setActiveRouteId(routeId);
    setActiveTool('select');
    setSelectedElement(waypointId);
    
    // Allow immediate dragging in the same pointer down event
    startDragging(waypointId, e);
  };


  // ---------- Quick A → B navigation ----------
  // Plain render-time lookup (two object reads) — no memo needed.
  const navABStart = (navStartId && navStartId !== navEndId) ? elementPositions[navStartId] : null;
  const navABEnd = (navEndId && navStartId !== navEndId) ? elementPositions[navEndId] : null;
  const navABPoints = (navABStart && navABEnd) ? [
    { x: (navABStart.left || 0) + (navABStart.width || 0) / 2, y: (navABStart.top || 0) + (navABStart.height || 0) / 2 },
    { x: (navABEnd.left || 0) + (navABEnd.width || 0) / 2, y: (navABEnd.top || 0) + (navABEnd.height || 0) / 2 }
  ] : null;

  const setNavPoint = (role, elementId) => {
    if (!elementId) {
      pushHistory();
      if (role === 'start') setNavStartId(null);
      else setNavEndId(null);
      return;
    }
    const element = elements.find((el) => el.id === elementId);
    if (!element?.isLocation) {
      setSaveStatus(t('editor.routeNeedLocation'));
      return;
    }
    pushHistory();
    if (role === 'start') {
      // picking the current destination as start swaps the two ends
      if (elementId === navEndId) setNavEndId(navStartId);
      setNavStartId(elementId);
    } else {
      if (elementId === navStartId) setNavStartId(navEndId);
      setNavEndId(elementId);
    }
  };

  const swapNavAB = () => {
    if (!navStartId && !navEndId) return;
    pushHistory();
    setNavStartId(navEndId);
    setNavEndId(navStartId);
  };

  const clearNavAB = () => {
    if (!navStartId && !navEndId) return;
    pushHistory();
    setNavStartId(null);
    setNavEndId(null);
  };

  const handleToolAction = (tool) => {
    if (tool === 'eraser') {
      setActiveTool('eraser');
      if (!selectedElement) return;
      pushHistory();
      setElements((previous) => previous.filter((element) => element.id !== selectedElement));
      setElementPositions((previous) => {
        const next = { ...previous };
        delete next[selectedElement];
        return next;
      });
      // keep routes valid when an element is erased
      setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) })));
      pruneNavForElement(selectedElement);
      setSelectedElement(null);
      return;
    }
    if (tool === 'select') {
      setActiveTool('select');
      return;
    }
    if (tool === 'route') {
      setActiveTool('route');
      if (!routes.length) createRoute();
      else if (!activeRouteId) setActiveRouteId(routes[0].id);
      return;
    }
    if (tool === 'draw-route') {
      setActiveTool('draw-route');
      return;
    }
    setActiveTool(tool);
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        // Keep element images off the map's data JSONB (and small): compress and
        // store in Supabase Storage, persist only the public URL.
        const small = await compressForUpload(file, { maxWidth: 1024, quality: 0.85, mime: 'image/png' }, 'png');
        const url = await uploadMapMedia(mapId, 'element', small || file);
        if (!url) continue;
        nextElementId.current += 1;
        const id = `upload-${nextElementId.current}`;
        setUploadedFiles((previous) => [...previous, { id, label: file.name, content: url }]);
      } catch (err) {
        console.warn('Element image upload skipped:', err);
      }
    }
  };

  const handleElementUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    let hasInvalid = false;
    for (const file of files) {
      if (file.type !== 'image/png') {
        hasInvalid = true;
        continue;
      }
      const small = await compressForUpload(file, { maxWidth: 512, quality: 0.92, mime: 'image/png' }, 'png');
      addUserAsset({ type: 'element', label: file.name, file: small || file });
    }
    if (hasInvalid) setElementUploadError(t('editor.pngOnly'));
  };

  const myElements = (userAssets || []).filter((asset) => asset.asset_type === 'element' && (asset.url || asset.content));
  const myBackgrounds = (userAssets || []).filter((asset) => asset.asset_type === 'background' && (asset.url || asset.content));

  const toggleUploadSelection = (id) => {
    setSelectedUploads((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));
  };

  const addSelectedUploads = () => {
    uploadedFiles
      .filter((file) => selectedUploads.includes(file.id))
      .forEach((file) => addElement({ type: 'image', label: file.label, content: file.content }));
    setSelectedUploads([]);
  };

  const removeUpload = (id) => {
    setUploadedFiles((previous) => previous.filter((file) => file.id !== id));
    setSelectedUploads((previous) => previous.filter((item) => item !== id));
  };

  const applyBackgroundColor = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 40;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    setBackgroundImage(canvas.toDataURL('image/png'));
    setCanvasWidth(DEFAULT_CANVAS_WIDTH);
    setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
  };

  const getSavedProjects = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('project_travelcraft_editorSaves')) || {};
      return Object.entries(saved)
        .filter(([, state]) => state && typeof state === 'object')
        .map(([id, state]) => ({ id, ...state }))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch {
      return [];
    }
  };

  const loadProject = (state) => {
    pushHistory();
    setElements(Array.isArray(state.elements) ? scaleElementFontSizes(state.elements, state.elementPositions).map((element) => normalizeElementFont(element)) : []);
    setElementPositions(scaleElementPositions(state.elementPositions) || {});
    if (Array.isArray(state.routes)) {
      setRoutes(state.routes.filter((r) => r && Array.isArray(r.pointIds)).map((r) => ({ visible: true, color: '#cc0000', name: '', ...r })));
      setActiveRouteId(null);
    }
    setNavStartId(typeof state.navStartId === 'string' ? state.navStartId : null);
    setNavEndId(typeof state.navEndId === 'string' ? state.navEndId : null);
    if (typeof state.selectedTemplate === 'string') setSelectedTemplate(state.selectedTemplate);
    if (typeof state.backgroundImage === 'string') setBackgroundImage(state.backgroundImage);
    if (typeof state.mapTitle === 'string') setMapTitle(state.mapTitle);
    if (typeof state.publishDescription === 'string') setPublishDescription(state.publishDescription);
    if (typeof state.publishTags === 'string') setPublishTags(state.publishTags);
    if (typeof state.publishPrivacy === 'string') setPublishPrivacy(state.publishPrivacy);
    if (typeof state.publishVideoUrl === 'string') setPublishVideoUrl(state.publishVideoUrl);
    if (Array.isArray(state.publishSelfieUrls)) setPublishSelfieUrls(state.publishSelfieUrls);
    setSelectedElement(null);
    setContextMenuElementId(null);
    setSaveStatus(t('editor.statusDraftSaved'));
  };

  const selectedData = elements.find((element) => element.id === selectedElement);
  const selectedPosition = selectedElement ? elementPositions[selectedElement] : null;
  const contextMenuElement = contextMenuElementId ? elements.find((element) => element.id === contextMenuElementId) : null;
  const selectionToolbarStyle = selectedPosition ? {
    top: Math.max(12, selectedPosition.top - 12),
    left: Math.max(10, Math.min(selectedPosition.left + selectedPosition.width / 2, canvasWidth - 20)),
    transform: `translate(-50%, -100%) scale(${1 / camera.scale})`,
    transformOrigin: 'bottom center'
  } : {};
  const contextMenuPosition = contextMenuElementId ? elementPositions[contextMenuElementId] : null;
  const quickActionMenuStyle = contextMenuElement && contextMenuPosition ? {
    top: Math.max(20, contextMenuPosition.top + contextMenuPosition.height + 10),
    left: Math.max(20, Math.min(contextMenuPosition.left, canvasWidth - 240)),
    transform: `scale(${1 / camera.scale})`,
    transformOrigin: 'top left'
  } : {};
  const activeTemplate = mapTemplates.find((template) => template.id === selectedTemplate) || mapTemplates[0];
  const selectTemplate = (templateId) => {
    const template = mapTemplates.find((item) => item.id === templateId);
    setSelectedTemplate(templateId);
    setBackgroundImage(template?.image || '');
    setCanvasWidth(DEFAULT_CANVAS_WIDTH);
    setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
  };

  const selectBaseMapBackground = (baseMap) => {
    setSelectedTemplate('blank');
    setBackgroundImage(baseMap.image || baseMap.imageUrl || '');
    setCanvasWidth(DEFAULT_CANVAS_WIDTH);
    setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
  };

  const baseMapImageSelected = (baseMap) =>
    backgroundImage && backgroundImage === (baseMap.image || baseMap.imageUrl);

  const savedProjects = getSavedProjects();

  const startZoomEdit = () => {
    setZoomInputValue(String(Math.round(camera.scale * 100)));
    setZoomEditing(true);
  };

  const applyZoomValue = () => {
    const parsed = parseFloat(zoomInputValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      const scale = clampValue(parsed / 100, MIN_ZOOM, MAX_ZOOM);
      setCamera({ scale });
    }
    setZoomEditing(false);
  };

  const generateRoutePathData = useCallback((points, controlPoints = []) => {
    if (!points || points.length < 2) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cp = controlPoints[i];
      if (cp) {
        d += ` Q ${cp.x},${cp.y} ${p2.x},${p2.y}`;
      } else {
        d += ` L ${p2.x},${p2.y}`;
      }
    }
    return d;
  }, []);

  return (
    <div className="h-screen w-full bg-[#f0f0f0] flex flex-col font-mono text-black overflow-hidden selection:bg-red-200">
      <style>{`
        .editor-anim-wave { animation: editorWave 1.2s ease-in-out infinite; transform-origin: 50% 50%; }
        @keyframes editorWave { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg) translateY(-8px); } }
        .editor-anim-shake { animation: editorShake .5s ease-in-out infinite; }
        @keyframes editorShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .editor-anim-float { animation: editorFloat 2.4s ease-in-out infinite; }
        @keyframes editorFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes drawRoute { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
      `}</style>
      
      {/* TOP NAVBAR */}
      <header className="h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)] z-20 relative">
        <div className="flex items-center gap-4 h-full">
          <button onClick={onBack} className="hover:bg-gray-200 p-1 rounded transition-colors" title={t('editor.backToMyMaps')}>
            <ArrowLeft className="w-5 h-5 font-black" />
          </button>
          <div className="flex items-center gap-2 text-[#cc0000] font-black uppercase tracking-wider">
            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="TravelCraft Logo" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 max-w-none object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
            </div>
            <span className="hidden sm:inline ml-1">TravelCraft</span>
          </div>
          <div className="h-6 w-1 bg-black rounded-full mx-2 hidden sm:block"></div>
          <input 
            type="text" 
            value={mapTitle}
            onChange={(event) => setMapTitle(event.target.value)}
            className="font-bold text-sm bg-transparent border-none focus:outline-none focus:bg-gray-100 px-2 py-1 rounded w-32 sm:w-auto"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 h-full">
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={undo} disabled={!history.length} title={t('editor.undo')} className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!future.length} title={t('editor.redo')} className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-1 bg-black rounded-full mx-1 hidden sm:block"></div>
          {autosaveStatus && <span className="hidden sm:block text-[10px] font-black text-gray-500 uppercase min-w-16 text-right">{autosaveStatus}</span>}
          <button onClick={saveDraft} className="bg-[#4895ef] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase">
            {t('editor.saveDraft')}
          </button>
          <button onClick={() => setShowPublishModal(true)} className="bg-[#cc0000] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Compass className="w-3 h-3 hidden sm:block" /> {t('editor.publish')}
          </button>
          <button onClick={() => setShowShareModal(true)} title={t('editor.shareTooltip')} className="bg-amber-400 text-black font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Share2 className="w-3 h-3" /> {t('editor.share')}
          </button>
          <button onClick={startTour} disabled={!tourStops.length} title={t('editor.tourStart')} className="bg-emerald-400 text-black font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <Play className="w-3 h-3 fill-black" /> {t('editor.tour')}
          </button>
        </div>
      </header>

      {/* SECONDARY TOOLBAR (TEXT FORMATTING) */}
      {selectedElement && selectedData?.type === 'text' && (
        <div className="relative shrink-0 z-20">
        <div className="h-12 bg-white border-b-4 border-black flex items-center px-4 gap-2 z-10 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)] overflow-x-auto hide-scrollbar">

          {/* Font Family */}
          <div className="relative shrink-0 min-w-[120px]">
            <select
              value={selectedData.fontFamily || 'sans-serif'}
              onChange={(event) => updateSelectedTextStyle({ fontFamily: event.target.value })}
              className="appearance-none w-full border-2 border-black rounded-lg px-3 py-1 bg-white hover:bg-gray-100 font-bold text-sm cursor-pointer pr-8"
            >
              <option value="sans-serif">Sans-serif</option>
              <option value="Garuda">Garuda</option>
              <option value="Tahoma">Tahoma</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Font Size */}
          <div className="flex items-center border-2 border-black rounded-lg overflow-hidden h-8 bg-white shrink-0">
            <button onClick={() => updateSelectedTextStyle({ fontSize: Math.max(20, (selectedData.fontSize || 160) - 4) })} className="px-2 h-full hover:bg-gray-200 font-bold">-</button>
            <input
              type="number"
              value={selectedData.fontSize || 160}
              onChange={(event) => updateSelectedTextStyle({ fontSize: Math.max(20, Math.min(MAX_TEXT_FONT_SIZE, Number(event.target.value))) })}
              className="w-14 text-center font-bold text-sm outline-none border-x-2 border-black h-full"
            />
            <button onClick={() => updateSelectedTextStyle({ fontSize: Math.min(MAX_TEXT_FONT_SIZE, (selectedData.fontSize || 160) + 4) })} className="px-2 h-full hover:bg-gray-200 font-bold">+</button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1 shrink-0"></div>

          {/* Text Color (A rainbow) */}
          <label className="flex items-center justify-center w-8 h-8 rounded border-2 border-transparent hover:border-black cursor-pointer relative group shrink-0" title={t('editor.textColor')}>
            <span className="font-serif font-bold text-lg leading-none" style={{ color: selectedData.color || '#000000' }}>A</span>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 to-blue-500"></div>
            <input type="color" value={selectedData.color || '#000000'} onChange={(event) => updateSelectedTextStyle({ color: event.target.value })} className="absolute opacity-0 w-0 h-0" />
          </label>

          {/* Bold */}
          <button
            onClick={() => updateSelectedTextStyle({ fontWeight: (selectedData.fontWeight || 400) >= 700 ? 400 : 700 })}
            title={t('editor.bold')}
            className={`w-8 h-8 flex items-center justify-center rounded border-2 shrink-0 ${selectedData.fontWeight >= 700 ? 'bg-gray-200 border-black' : 'border-transparent hover:border-black'}`}
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            onClick={() => updateSelectedTextStyle({ fontStyle: selectedData.fontStyle === 'italic' ? 'normal' : 'italic' })}
            title="Italic"
            className={`w-8 h-8 flex items-center justify-center rounded border-2 shrink-0 ${selectedData.fontStyle === 'italic' ? 'bg-gray-200 border-black' : 'border-transparent hover:border-black'}`}
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            onClick={() => {
              const isUnderline = (selectedData.textDecoration || '').includes('underline');
              const newDecor = isUnderline ? (selectedData.textDecoration || '').replace('underline', '').trim() : `${selectedData.textDecoration || ''} underline`.trim();
              updateSelectedTextStyle({ textDecoration: newDecor });
            }}
            title="Underline"
            className={`w-8 h-8 flex items-center justify-center rounded border-2 shrink-0 ${(selectedData.textDecoration || '').includes('underline') ? 'bg-gray-200 border-black' : 'border-transparent hover:border-black'}`}
          >
            <Underline className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => {
              const isStrike = (selectedData.textDecoration || '').includes('line-through');
              const newDecor = isStrike ? (selectedData.textDecoration || '').replace('line-through', '').trim() : `${selectedData.textDecoration || ''} line-through`.trim();
              updateSelectedTextStyle({ textDecoration: newDecor });
            }}
            title="Strikethrough"
            className={`w-8 h-8 flex items-center justify-center rounded border-2 shrink-0 ${(selectedData.textDecoration || '').includes('line-through') ? 'bg-gray-200 border-black' : 'border-transparent hover:border-black'}`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 shrink-0"></div>

          {/* Alignment */}
          <button
            onClick={() => {
              const aligns = ['left', 'center', 'right', 'justify'];
              const current = selectedData.textAlign || 'center';
              const next = aligns[(aligns.indexOf(current) + 1) % aligns.length];
              updateSelectedTextStyle({ textAlign: next });
            }}
            title={t('editor.textAlign')}
            className="w-8 h-8 flex items-center justify-center rounded border-2 border-transparent hover:border-black shrink-0"
          >
            {(!selectedData.textAlign || selectedData.textAlign === 'center') && <AlignCenter className="w-4 h-4" />}
            {selectedData.textAlign === 'left' && <AlignLeft className="w-4 h-4" />}
            {selectedData.textAlign === 'right' && <AlignRight className="w-4 h-4" />}
            {selectedData.textAlign === 'justify' && <AlignJustify className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 shrink-0"></div>

          {/* Tool presets */}
          <button onClick={() => setShowTextStyleMenu((value) => !value)} className={`px-3 py-1 text-xs font-bold rounded shrink-0 whitespace-nowrap flex items-center gap-1 ${showTextStyleMenu ? 'bg-amber-200 border-2 border-black' : 'hover:bg-gray-100'}`}>
            <Wand2 className="w-3.5 h-3.5" />{t('editor.textEffects')}
          </button>
          <button onClick={() => setShowTextAnimMenu((value) => !value)} className={`px-3 py-1 text-xs font-bold rounded shrink-0 whitespace-nowrap flex items-center gap-1 ${showTextAnimMenu ? 'bg-emerald-200 border-2 border-black' : 'hover:bg-gray-100'}`}>
            <Play className="w-3 h-3 fill-black" />{t('editor.textAnimate')}
          </button>
          <button onClick={() => setShowTextPositionMenu((value) => !value)} className={`px-3 py-1 text-xs font-bold rounded shrink-0 whitespace-nowrap flex items-center gap-1 ${showTextPositionMenu ? 'bg-sky-200 border-2 border-black' : 'hover:bg-gray-100'}`}>
            <AlignCenter className="w-3 h-3" />{t('editor.textPosition')}
          </button>
        </div>

        {showTextStyleMenu && (
          <div className="absolute left-4 top-full mt-2 z-40 bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[300px]">
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1.5">{t('editor.textGradient')}</label>
                <div className="flex gap-2">
                  {textGradientPresets.map((preset) => (
                    <button key={preset.id} type="button" title={t(preset.labelKey)} onClick={() => applyTextStyle({ textGradient: selectedData.textGradient === preset.css ? undefined : preset.css })}
                      className={`h-8 flex-1 rounded-lg border-2 ${selectedData.textGradient === preset.css ? 'border-black ring-2 ring-offset-1 ring-black' : 'border-black'}`} style={{ background: preset.css }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => applyTextStyle({ textStroke: selectedData.textStroke ? undefined : 3 })} className={`flex-1 border-2 border-black rounded-lg px-2 py-1.5 font-black text-[10px] uppercase ${selectedData.textStroke ? 'bg-amber-200' : 'bg-white hover:bg-gray-50'}`}>{t('editor.textStroke')}</button>
                <button type="button" onClick={() => applyTextStyle({ textGlow: selectedData.textGlow ? undefined : '#f59e0b' })} className={`flex-1 border-2 border-black rounded-lg px-2 py-1.5 font-black text-[10px] uppercase ${selectedData.textGlow ? 'bg-amber-200' : 'bg-white hover:bg-gray-50'}`}>{t('editor.textGlow')}</button>
              </div>
              {(selectedData.textGradient || selectedData.textStroke || selectedData.textGlow) && (
                <button type="button" onClick={() => applyTextStyle({ textGradient: undefined, textStroke: undefined, textGlow: undefined })} className="w-full border-2 border-black rounded-lg px-2 py-1.5 font-black text-[10px] uppercase text-red-600 bg-white hover:bg-red-50">{t('editor.textStyleClear')}</button>
              )}
            </div>
          </div>
        )}

        {showTextAnimMenu && (
          <div className="absolute left-4 top-full mt-2 z-40 bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[300px]">
            <label className="text-[9px] font-black uppercase text-gray-400 block mb-1.5">{t('editor.textAnimate')}</label>
            <div className="grid grid-cols-2 gap-2">
              {textAnimations.map((anim) => (
                <button key={anim.id} type="button" onClick={() => {
                  applyTextStyle({ textAnimation: anim.id === 'none' ? undefined : anim.id });
                  setShowTextAnimMenu(false);
                }} className={`border-2 border-black rounded-lg px-2 py-1.5 font-black text-[10px] uppercase ${(selectedData.textAnimation || 'none') === anim.id ? 'bg-emerald-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>
                  {t(anim.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        {showTextPositionMenu && (
          <div className="absolute left-4 top-full mt-2 z-40 bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[300px]">
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1.5">{t('editor.textPositionH')}</label>
                <div className="flex gap-2">
                  {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify]].map(([align, Icon]) => (
                    <button key={align} type="button" onClick={() => {
                      applyTextStyle({ textAlign: align === 'center' ? undefined : align });
                      setShowTextPositionMenu(false);
                    }} title={align} className={`flex-1 flex items-center justify-center border-2 border-black rounded-lg px-1 py-1.5 ${(selectedData.textAlign || 'center') === align ? 'bg-sky-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-1.5">{t('editor.textPositionV')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['top', 'editor.textAlignTop'], ['middle', 'editor.textAlignMiddle'], ['bottom', 'editor.textAlignBottom']].map(([align, labelKey]) => (
                    <button key={align} type="button" onClick={() => {
                      applyTextStyle({ verticalAlign: align === 'middle' ? undefined : align });
                      setShowTextPositionMenu(false);
                    }} className={`border-2 border-black rounded-lg px-1 py-1.5 font-black text-[10px] uppercase ${(selectedData.verticalAlign || 'middle') === align ? 'bg-sky-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}>
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
      {saveStatus && <div className="absolute top-16 right-4 z-30 bg-emerald-100 border-2 border-black px-3 py-2 text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{saveStatus}</div>}

      {showShareModal && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
        <div className="w-full max-w-md bg-[#e8ecef] text-slate-800 dark:bg-[#202020] dark:text-white border-2 border-slate-300 dark:border-white/70 rounded-lg shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/20 pb-3">
            <h2 className="font-black text-lg">{t('editor.shareModalTitle')}</h2>
            <button onClick={() => setShowShareModal(false)} title={t('editor.close')} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <button onClick={nativeShare} className="mx-auto my-5 block bg-white text-black rounded-full px-5 py-2 font-bold hover:bg-gray-200">{t('editor.shareBtn')}</button>
          <p className="text-center text-sm text-slate-600 dark:text-gray-300 mb-5">{t('editor.shareModalDesc')}</p>
          <div className="grid grid-cols-5 gap-3 mb-6">
            <button onClick={() => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)} title={t('editor.facebook')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center font-black text-2xl">f</span><span className="text-[10px]">{t('editor.facebook')}</span></button>
            <button onClick={() => openShareLink(`sms:?body=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title={t('editor.messages')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-white text-[#1677e8] flex items-center justify-center"><MessageCircle className="w-7 h-7 fill-current" /></span><span className="text-[10px]">{t('editor.messages')}</span></button>
            <button onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title={t('editor.whatsapp')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center"><Smartphone className="w-6 h-6" /></span><span className="text-[10px]">{t('editor.whatsapp')}</span></button>
            <button onClick={() => openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)} title={t('editor.x')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-black border border-white/30 flex items-center justify-center font-black text-xl">X</span><span className="text-[10px]">{t('editor.x')}</span></button>
            <button onClick={copyShareLink} title={t('editor.copyLink')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"><Copy className="w-5 h-5" /></span><span className="text-[10px]">{copied ? t('editor.copied') : t('editor.copy')}</span></button>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#111] border border-slate-300 dark:border-white/20 rounded-lg p-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 dark:text-gray-300 outline-none" />
            <button onClick={copyShareLink} className="shrink-0 border border-slate-400 dark:border-white/40 rounded-full px-3 py-1 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10">{copied ? t('editor.copied') : t('editor.copy')}</button>
          </div>
        </div>
      </div>}

      {previewTemplateId && (() => {
        const previewTemplate = mapTemplates.find((item) => item.id === previewTemplateId);
        if (!previewTemplate) return null;
        return (
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewTemplateId(null)}>
            <div className="w-full max-w-2xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
                <h3 className="font-black text-sm uppercase">{t(previewTemplate.labelKey)}</h3>
                <button type="button" onClick={() => setPreviewTemplateId(null)} title={t('editor.close')} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-100 flex items-center justify-center max-h-[65vh] overflow-hidden">
                {previewTemplate.image ? (
                  <img src={previewTemplate.image} alt={t(previewTemplate.labelKey)} className="w-full max-h-[65vh] object-contain" />
                ) : (
                  <div className="w-full h-72" style={{ background: previewTemplate.preview }} />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t-2 border-black bg-white">
                <button type="button" onClick={() => setPreviewTemplateId(null)} className="border-2 border-black rounded-lg px-4 py-2 text-xs font-black uppercase hover:bg-gray-100">
                  {t('editor.close')}
                </button>
                <button type="button" onClick={() => { selectTemplate(previewTemplate.id); setPreviewTemplateId(null); }} className="border-2 border-black rounded-lg px-4 py-2 text-xs font-black uppercase bg-amber-300 hover:bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ใช้ template นี้
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showPublishModal && (
        <PublishMapModal
          mapId={mapId}
          initial={{
            title: mapTitle,
            description: publishDescription,
            imageUrl: publishCoverImage,
            tags: (publishTags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
            privacy: publishPrivacy,
            videoUrl: publishVideoUrl,
            selfieUrls: publishSelfieUrls
          }}
          onValuesChange={(values) => {
            setMapTitle(values.title);
            setPublishDescription(values.description);
            setPublishCoverImage(values.imageUrl);
            setPublishTags(Array.isArray(values.tags) ? values.tags.join(', ') : '');
            setPublishPrivacy(values.privacy);
            setPublishVideoUrl(values.videoUrl);
            setPublishSelfieUrls(Array.isArray(values.selfieUrls) ? values.selfieUrls : []);
          }}
          onClose={() => setShowPublishModal(false)}
          onPublish={(updates) => { publishMap(updates); }}
        />
      )}

      {showBadgeCelebration && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBadgeCelebration(false)}>
          <div className="w-full max-w-sm bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 text-center" onClick={(event) => event.stopPropagation()}>
            <div className="text-4xl mb-1">🎉</div>
            <h3 className="font-black uppercase text-sm">{t('editor.badgeUnlocked')}</h3>
            <div className="mt-4 space-y-2">
              {recentlyWonBadges.map((badge) => {
                const meta = badgeMeta[badge];
                return (
                  <div key={badge} className="flex items-center gap-3 border-2 border-black rounded-xl bg-amber-50 p-3">
                    <span className="text-3xl">{meta?.icon || '🏅'}</span>
                    <div className="text-left min-w-0">
                      <div className="font-black text-sm">{meta ? t(meta.labelKey) : badge}</div>
                      <div className="text-[10px] font-bold text-gray-500">{meta ? t(meta.descKey) : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => setShowBadgeCelebration(false)} className="mt-5 w-full bg-[#cc0000] text-white font-black py-2.5 rounded-xl border-2 border-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 cursor-pointer">
              {t('editor.badgeContinue')}
            </button>
          </div>
        </div>
      )}

      {/* EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT MENU STRIP */}
        <div className="w-20 bg-white border-r-4 border-black flex flex-col items-center py-4 gap-1 z-10 shrink-0 overflow-y-auto overflow-x-hidden">
          {editorTabs.map((tab, idx) => {
            if (tab.isDivider) {
              return <div key={`divider-${idx}`} className="w-6 h-px bg-gray-200 my-2 shrink-0"></div>;
            }
            return (
              <button 
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id && panelOpen) {
                    setPanelOpen(false);
                  } else {
                    setPanelOpen(true);
                    setActiveTab(tab.id);
                  }
                  if (tab.id !== 'TOOLS') {
                    setActiveTool('select');
                  }
                }}
                title={t(tab.labelKey) || tab.defaultLabel}
                className={`flex flex-col items-center justify-center w-16 py-2 rounded-lg border-2 transition-all gap-1 shrink-0 ${activeTab === tab.id ? 'border-black bg-gray-100 text-[#cc0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-black'}`}
              >
                <div className="relative">
                  <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-red-100' : ''}`} />
                  {tab.isPremium && (
                    <Crown className="w-3 h-3 text-amber-500 absolute -top-2 -right-3 fill-amber-500" />
                  )}
                </div>
                <span className="text-[10px] font-bold">{t(tab.labelKey) || tab.defaultLabel}</span>
              </button>
            );
          })}
        </div>

        {/* LEFT PANEL CONTENT */}
        {panelOpen ? (
        <div className="w-64 bg-white border-r-4 border-black flex flex-col z-10 shadow-[4px_0_0_0_rgba(0,0,0,1)] shrink-0 hidden md:flex">
          <div className="p-4 border-b-2 border-black flex items-center justify-between gap-2">
            <h2 className="font-black text-sm uppercase">
              {t(tabLabelKeys[activeTab]) || editorTabs.find(t => t.id === activeTab)?.defaultLabel}
            </h2>
            <button type="button" onClick={() => setPanelOpen(false)} title={t('editor.collapsePanel')} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100 shrink-0">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'TEMPLATES' && (
              <div>
                <div className="flex flex-wrap gap-3">
                  {mapTemplates.map((template) => (
                    <div key={template.id} className={`aspect-square w-[calc(50%-0.375rem)] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative ${selectedTemplate === template.id ? 'ring-4 ring-[#4895ef] ring-offset-2' : ''}`}>
                      <button type="button" onClick={() => selectTemplate(template.id)} aria-pressed={selectedTemplate === template.id} title={t(template.labelKey)} className="absolute inset-0 cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-end p-2">
                        <div className="absolute inset-0" style={{ background: template.preview }}></div>
                        {!template.image && (
                          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0_15px,#1f2937_16px_17px),repeating-linear-gradient(0deg,transparent_0_15px,#1f2937_16px_17px)]"></div>
                        )}
                        <span className="relative z-10 bg-white/90 border border-black px-1 text-[8px] font-black uppercase">{t(template.labelKey)}</span>
                      </button>
                      {selectedTemplate === template.id && <span className="absolute top-1 right-1 z-10 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center pointer-events-none"><Check className="w-3 h-3 stroke-[4]" /></span>}
                      <button type="button" onClick={(event) => { event.stopPropagation(); setPreviewTemplateId(template.id); }} title="ดูรูปตัวอย่าง" className="absolute bottom-1 left-1 z-10 w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-amber-200">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {baseMaps?.length > 0 && (
                  <div className="mt-4 border-t-2 border-black pt-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                      {t('editor.baseMaps')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {baseMaps.map((baseMap) => {
                        const bg = baseMap.image || baseMap.imageUrl;
                        const isActive = baseMapImageSelected(baseMap);
                        return (
                          <button
                            key={baseMap.id}
                            type="button"
                            onClick={() => selectBaseMapBackground(baseMap)}
                            aria-pressed={isActive}
                            disabled={!bg}
                            className={`aspect-square w-[calc(50%-0.375rem)] border-2 border-black rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform flex flex-col items-center justify-end p-2 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed ${isActive ? 'ring-4 ring-[#4895ef] ring-offset-2' : ''}`}
                          >
                            {bg ? (
                              <img src={bg} alt={baseMap.name || baseMap.id} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-xl">🗺️</div>
                            )}
                            {isActive && <span className="absolute top-1 right-1 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[4]" /></span>}
                            <span className="relative z-10 bg-amber-300 border border-black px-1 text-[8px] font-black uppercase truncate max-w-full">{baseMap.name || 'BASE'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'ELEMENTS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {elementOptions.map((item) => (
                    <button key={item.labelKey} draggable onDragStart={(event) => startPaletteDrag(event, { type: 'emoji', content: item.content, label: t(item.labelKey) })} onClick={() => addPaletteElement({ type: 'emoji', labelKey: item.labelKey, content: item.content, label: t(item.labelKey) })} className="aspect-square bg-gray-50 border-2 border-black rounded hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                      <span className="text-3xl">{item.content}</span>
                      <span className="text-[9px] font-black mt-1 uppercase">{t(item.labelKey)}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t-2 border-black pt-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('editor.frameTemplates')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['circle', t('editor.circleFrame')], ['rectangle', t('editor.rectangleFrame')], ['grid', t('editor.gridFrame')]].map(([shape, label]) => (
                      <button key={shape} type="button" onClick={() => addElement({ type: 'shape', shape, isFrame: true, content: '', label })} className="border-2 border-black rounded p-2 bg-gray-50 hover:bg-amber-100 font-black text-[9px] uppercase">
                        <span className="block h-8 mb-1" style={{ ...getShapeStyle({ shape, color: '#111111' }), ...getFramePlaceholderStyle({ isFrame: true, shape }) }} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 space-y-2 border-t-2 border-black pt-3">
                  <input ref={elementImageInputRef} type="file" accept=".png,image/png" multiple onChange={handleElementUpload} className="hidden" />
                  <button type="button" onClick={() => elementImageInputRef.current?.click()} className="w-full border-2 border-black bg-white font-black text-[10px] uppercase rounded px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> {t('editor.uploadPngElement')}
                  </button>
                  {elementUploadError && (
                    <p className="text-[10px] text-red-600 font-black">{elementUploadError}</p>
                  )}
                  {myElements.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('editor.myElements')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {myElements.map((item) => (
                          <div key={item.id} draggable onDragStart={(event) => startPaletteDrag(event, { type: 'image', label: item.label, content: item.url || item.content })} className="relative aspect-square border-2 border-black rounded overflow-hidden bg-gray-50 group">
                            <button type="button" draggable onDragStart={(event) => startPaletteDrag(event, { type: 'image', label: item.label, content: item.url || item.content })} onClick={() => addPaletteElement({ type: 'image', label: item.label, content: item.url || item.content })} title={item.label} className="w-full h-full cursor-pointer hover:bg-amber-100">
                              <img src={item.url || item.content} alt={item.label} className="w-full h-full object-contain" />
                              <span className="absolute bottom-0 inset-x-0 bg-white/90 border-t border-black text-[8px] font-black uppercase px-1 py-0.5 truncate">{item.label}</span>
                            </button>
                            <button type="button" onClick={() => removeUserAsset(item)} className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 cursor-pointer" title={t('editor.removeAsset')}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 font-bold leading-tight">{t('editor.pngHelper')}</p>
                </div>
              </div>
            )}
            {activeTab === 'TEXT' && (
              <div className="space-y-3">
                {textPresets.map((preset) => (
                  <button key={preset.labelKey} onClick={() => addElement({ type: 'text', labelKey: preset.labelKey, content: t(preset.contentKey), fontSize: preset.fontSize, fontWeight: preset.fontWeight })} className="w-full border-2 border-black bg-white px-3 py-3 text-left hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ fontSize: `${Math.min(24, preset.fontSize)}px`, fontWeight: preset.fontWeight, lineHeight: 1.3 }}>{t(preset.contentKey)}</button>
                ))}
              </div>
            )}
            {activeTab === 'UPLOADS' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-black bg-[#4895ef] text-white p-3 font-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600">{t('editor.uploadFile')}</button>
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedFiles.map((file) => {
                      const isSelected = selectedUploads.includes(file.id);
                      return (
                        <div key={file.id} draggable onDragStart={(event) => startPaletteDrag(event, { type: 'image', label: file.label, content: file.content })} className={`relative border-2 rounded overflow-hidden aspect-square group ${isSelected ? 'border-[#4895ef] ring-4 ring-[#4895ef] ring-offset-1' : 'border-black'}`}>
                          <button type="button" draggable onDragStart={(event) => startPaletteDrag(event, { type: 'image', label: file.label, content: file.content })} onClick={() => toggleUploadSelection(file.id)} title={file.label} className="w-full h-full cursor-pointer">
                            <img src={file.content} alt={file.label} className="w-full h-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Check className="w-6 h-6 text-white stroke-[4]" />
                            </span>
                          </button>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[4]" /></span>
                          )}
                          <button type="button" onClick={() => removeUpload(file.id)} className="absolute top-1 left-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 cursor-pointer" title={t('editor.removeUpload')}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedUploads.length > 0 && (
                  <button onClick={addSelectedUploads} className="w-full border-2 border-black bg-amber-300 font-black text-[10px] uppercase rounded px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-200 cursor-pointer">
                    {t('editor.addSelectedUploads', { count: selectedUploads.length })}
                  </button>
                )}
                <p className="text-[10px] text-gray-500 font-bold">{t('editor.uploadInstruction')}</p>
              </div>
            )}
            {activeTab === 'TOOLS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {drawingTools.map(([tool, Icon, labelKey]) => (
                    <button key={tool} type="button" onClick={() => handleToolAction(tool)} className={`flex items-center gap-2 border-2 border-black rounded-lg px-3 py-2.5 font-black text-[10px] uppercase transition-colors ${activeTool === tool ? 'bg-[#cc0000] text-white' : 'bg-white hover:bg-amber-100'}`}>
                      <Icon className="w-4 h-4" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
<div className="border-t-2 border-black pt-3 space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t('editor.color')}</label>
                   <label className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 cursor-pointer">
                     <span className="text-[9px] font-black uppercase text-gray-700">{t('editor.chooseColor')}</span>
                     <input type="color" value={drawingColor} onChange={(event) => setDrawingColor(event.target.value)} className="h-7 w-9 cursor-pointer border border-black bg-transparent p-0" />
                   </label>
                 </div>
                 {activeTool === 'draw-route' && (
                   <div className="border-t-2 border-black pt-3 space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t('editor.routeThickness')}</label>
                     <input type="range" min="1" max="20" value={routeThickness} onChange={(e) => setRouteThickness(Number(e.target.value))} className="w-full accent-[#cc0000]" />
                     <div className="flex items-center justify-between">
                       <span className="text-[9px] text-gray-400">1</span>
                       <span className="text-[10px] font-black text-emerald-600">{routeThickness}px</span>
                       <span className="text-[9px] text-gray-400">20</span>
                     </div>
                   </div>
                 )}
                                 {/* --- Navigation routes manager --- */}
                <div className="border-t-2 border-black pt-3 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t('editor.routesTitle')}</label>
                  {/* --- Quick A → B navigation --- */}
                  <div className="border-2 border-black rounded-lg p-2 space-y-2 bg-sky-50">
                    <p className="font-black text-[11px]">🧭 {t('editor.navABTitle')}</p>
                    {locationElements.length === 0 && (
                      <p className="text-[10px] font-bold text-red-600 leading-tight border-2 border-dashed border-red-300 rounded p-1.5 bg-white">{t('editor.navNoLocations')}</p>
                    )}
                    <label className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-black text-white text-[10px] font-black flex items-center justify-center shrink-0">A</span>
                      <select value={navStartId || ''} onChange={(e) => setNavPoint('start', e.target.value || null)} className="min-w-0 flex-1 border-2 border-black rounded px-1.5 py-1 text-[10px] font-bold outline-none bg-white">
                        <option value="">{t('editor.navSelectStart')}</option>
                        {locationElements.map((el) => (
                          <option key={el.id} value={el.id}>{el.locationDetails?.name || getElementLabel(el)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-black text-white text-[10px] font-black flex items-center justify-center shrink-0">B</span>
                      <select value={navEndId || ''} onChange={(e) => setNavPoint('end', e.target.value || null)} className="min-w-0 flex-1 border-2 border-black rounded px-1.5 py-1 text-[10px] font-bold outline-none bg-white">
                        <option value="">{t('editor.navSelectEnd')}</option>
                        {locationElements.map((el) => (
                          <option key={el.id} value={el.id}>{el.locationDetails?.name || getElementLabel(el)}</option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={swapNavAB} disabled={!navStartId && !navEndId} className="flex items-center justify-center gap-1 border-2 border-black bg-white rounded-lg px-2 py-1.5 font-black text-[9px] uppercase hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                        <ArrowLeftRight className="w-3 h-3" /> {t('editor.navSwap')}
                      </button>
                      <button type="button" onClick={clearNavAB} disabled={!navStartId && !navEndId} className="flex items-center justify-center gap-1 border-2 border-black bg-white rounded-lg px-2 py-1.5 font-black text-[9px] uppercase hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed">
                        <X className="w-3 h-3" /> {t('editor.navClear')}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold leading-tight">{t('editor.routesHelper')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={createRoute} className="flex items-center justify-center gap-1.5 border-2 border-black bg-emerald-400 rounded-lg px-2 py-2 font-black text-[10px] uppercase hover:bg-emerald-500">
                      <Plus className="w-3.5 h-3.5" /> {t('editor.routeNew')}
                    </button>
                    <button type="button" onClick={connectAllLocationsInOrder} disabled={locationElements.length < 2} className="flex items-center justify-center gap-1.5 border-2 border-black bg-amber-300 rounded-lg px-2 py-2 font-black text-[10px] uppercase hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed">
                      <RouteIcon className="w-3.5 h-3.5" /> {t('editor.routeConnectAll')}
                    </button>
                  </div>
                  {routes.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold text-center italic py-2 border-2 border-dashed border-gray-300 rounded">{t('editor.routesEmpty')}</p>
                  ) : routes.map((route) => (
                    <div key={route.id} className={`border-2 rounded-lg p-2 space-y-2 ${activeRouteId === route.id ? 'border-black bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 bg-white'}`}>
                      <button type="button" onClick={() => { setActiveRouteId(route.id); setActiveTool('route'); }} className="w-full flex items-center gap-2 text-left">
                        <span className="w-4 h-4 rounded-full border-2 border-black shrink-0" style={{ backgroundColor: route.color }} />
                        <span className="font-black text-[11px] truncate flex-1">{route.name}</span>
                        <span className="text-[9px] font-black text-gray-500 shrink-0">{route.pointIds.length} {t('editor.routePoints')}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={route.color || '#cc0000'} onChange={(e) => { pushHistory(); setRoutes((prev) => prev.map((r) => r.id === route.id ? { ...r, color: e.target.value } : r)); }} className="h-6 w-8 cursor-pointer border border-black bg-transparent p-0 shrink-0" title={t('editor.color')} />
                        <input type="text" value={route.name} onChange={(e) => setRoutes((prev) => prev.map((r) => r.id === route.id ? { ...r, name: e.target.value } : r))} className="min-w-0 flex-1 border border-black rounded px-1.5 py-1 text-[10px] font-bold outline-none" />
                        <button type="button" onClick={() => { pushHistory(); setRoutes((prev) => prev.map((r) => r.id === route.id ? { ...r, visible: r.visible === false ? true : false } : r)); }} title={t('editor.routeToggle')} className="w-6 h-6 flex items-center justify-center border border-black rounded hover:bg-gray-100 shrink-0">
                          <Eye className={`w-3.5 h-3.5 ${route.visible === false ? 'text-gray-300' : ''}`} />
                        </button>
                        <button type="button" onClick={() => deleteRoute(route.id)} title={t('editor.delete')} className="w-6 h-6 flex items-center justify-center border border-black rounded hover:bg-red-50 text-red-600 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {activeRouteId === route.id && (
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {route.pointIds.length === 0 && <p className="text-[9px] text-gray-400 font-bold italic">{t('editor.routeClickHint', { name: route.name })}</p>}
                          {route.pointIds.map((pid, idx) => {
                            const el = elements.find((e) => e.id === pid);
                            return (
                              <div key={`${pid}-${idx}`} className="flex items-center gap-1 bg-white border border-black rounded px-1.5 py-1">
                                <span className="w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center shrink-0" style={{ backgroundColor: route.color }}>{idx + 1}</span>
                                <span className="text-[9px] font-bold truncate flex-1">{el ? (el.locationDetails?.name || getElementLabel(el)) : pid}</span>
                                <button type="button" onClick={() => moveRoutePoint(route.id, idx, -1)} disabled={idx === 0} className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                <button type="button" onClick={() => moveRoutePoint(route.id, idx, 1)} disabled={idx === route.pointIds.length - 1} className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                                <button type="button" onClick={() => removeRoutePoint(route.id, idx)} className="p-0.5 hover:bg-red-50 rounded text-red-600"><X className="w-3 h-3" /></button>
                              </div>
                            );
                          })}
                          <button type="button" onClick={() => addWaypointToRoute(route.id)} className="w-full mt-1.5 py-1.5 border-2 border-black border-dashed rounded text-[10px] font-black text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1">
                            <Plus className="w-3 h-3" /> เพิ่มจุดแวะ (โค้งเส้น)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
<div className="border-t-2 border-black pt-3 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{t('editor.actions')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={undo} disabled={!history.length} className="flex items-center justify-center gap-2 border-2 border-black bg-white rounded-lg px-3 py-2 font-black text-[10px] uppercase hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Undo2 className="w-4 h-4" /> {t('editor.undo')}
                    </button>
                    <button type="button" onClick={redo} disabled={!future.length} className="flex items-center justify-center gap-2 border-2 border-black bg-white rounded-lg px-3 py-2 font-black text-[10px] uppercase hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Redo2 className="w-4 h-4" /> {t('editor.redo')}
                    </button>
                    <button type="button" onClick={fitView} className="flex items-center justify-center gap-2 border-2 border-black bg-white rounded-lg px-3 py-2 font-black text-[10px] uppercase hover:bg-gray-100">
                      <Maximize className="w-4 h-4" /> {t('editor.fitView')}
                    </button>
                    <button type="button" onClick={() => { pushHistory(); setElements([]); setElementPositions({}); setRoutes([]); setActiveRouteId(null); setNavStartId(null); setNavEndId(null); setSelectedElement(null); setContextMenuElementId(null); }} className="flex items-center justify-center gap-2 border-2 border-black bg-white rounded-lg px-3 py-2 font-black text-[10px] uppercase text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" /> {t('editor.clearCanvas')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'PROJECTS' && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold leading-tight">{t('editor.projectsHint')}</p>
                {savedProjects.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Folder className="w-6 h-6 mx-auto text-gray-300" />
                    <p className="text-[10px] font-black text-gray-400 mt-2">{t('editor.projectsEmpty')}</p>
                  </div>
                ) : savedProjects.map((project) => (
                  <div key={project.id} className={`border-2 border-black rounded-lg p-3 ${project.id === mapId ? 'bg-amber-50' : 'bg-white'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-xs truncate">{project.mapTitle || t('editor.untitledMap')}</p>
                      {project.id === mapId && <span className="text-[9px] font-black text-amber-600 uppercase shrink-0">{t('editor.currentProject')}</span>}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '—'}</p>
                    <button type="button" onClick={() => loadProject(project)} disabled={project.id === mapId} className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-black bg-[#4895ef] text-white rounded px-3 py-2 font-black text-[10px] uppercase hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Check className="w-3.5 h-3.5" /> {t('editor.projectsLoad')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'APPS' && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold leading-tight">{t('editor.appsHelper')}</p>
                {[
                  { id: 'community', labelKey: 'editor.appCommunity', icon: <Shapes className="w-5 h-5" />, onClick: () => navigateTo('community') },
                  { id: 'map', labelKey: 'editor.appWorldMap', icon: <LayoutGrid className="w-5 h-5" />, onClick: () => navigateTo('map') },
                  { id: 'mymaps', labelKey: 'editor.appMyMaps', icon: <Folder className="w-5 h-5" />, onClick: () => navigateTo('mymaps') },
                  { id: 'profile', labelKey: 'editor.appProfile', icon: <Compass className="w-5 h-5" />, onClick: () => navigateTo('profile') },
                  { id: 'settings', labelKey: 'editor.appSettings', icon: <Settings className="w-5 h-5" />, onClick: () => navigateTo('settings') }
                ].map((app) => (
                  <button key={app.id} type="button" onClick={app.onClick} className="w-full flex items-center gap-3 border-2 border-black bg-white rounded-lg px-3 py-3 hover:bg-amber-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="w-9 h-9 bg-gray-100 border-2 border-black rounded flex items-center justify-center">{app.icon}</span>
                    <span className="font-black text-xs">{t(app.labelKey)}</span>
                    <ArrowLeft className="w-4 h-4 ml-auto text-gray-400 rotate-180" />
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'BACKGROUND' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.bgSolidColor')}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#111111', '#cc0000', '#4895ef', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#92400e'].map((color) => (
                      <button key={color} type="button" onClick={() => applyBackgroundColor(color)} title={color} className="aspect-square rounded-full border-2 border-black cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <label className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 cursor-pointer">
                    <span className="text-[9px] font-black uppercase text-gray-700">{t('editor.color')}</span>
                    <input type="color" defaultValue="#ffffff" onInput={(event) => applyBackgroundColor(event.target.value)} className="h-7 w-9 cursor-pointer border border-black bg-transparent p-0" />
                  </label>
                </div>
                <div className="border-t-2 border-black pt-3 space-y-2">
                  <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                  <button type="button" onClick={() => backgroundInputRef.current?.click()} className={`w-full border-2 border-black font-black text-[10px] uppercase rounded px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 flex items-center justify-center gap-1.5 ${backgroundImage ? 'bg-amber-300' : 'bg-white'}`}>
                    <ImagePlus className="w-3.5 h-3.5" /> {t('editor.uploadBackground')}
                  </button>
                  {myBackgrounds.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('editor.myBackgrounds')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {myBackgrounds.map((asset) => (
                          <div key={asset.id} className={`relative aspect-square border-2 overflow-hidden rounded group ${backgroundImage === (asset.url || asset.content) ? 'border-[#4895ef] ring-4 ring-[#4895ef] ring-offset-1' : 'border-black'}`}>
                            <button type="button" onClick={() => setBackgroundImage(asset.url || asset.content)} title={asset.label} className="w-full h-full cursor-pointer">
                              <img src={asset.url || asset.content} alt={asset.label} className="w-full h-full object-cover" />
                            </button>
                            <button type="button" onClick={() => removeUserAsset(asset)} className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 cursor-pointer" title={t('editor.removeAsset')}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {backgroundImage && (
                    <button type="button" onClick={clearBackground} className="w-full border-2 border-black bg-white font-black text-[10px] uppercase rounded px-3 py-2 hover:bg-red-50 text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> {t('editor.clearBackground')}
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500 font-bold leading-tight">{t('editor.backgroundHelper')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
        <div className="w-10 bg-white border-r-4 border-black flex flex-col items-center pt-4 gap-2 z-10 shrink-0 hidden md:flex">
          <button type="button" onClick={() => setPanelOpen(true)} title={t('editor.expandPanel')} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100">
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
        )}

        {/* CENTER CANVAS AREA */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-hidden bg-gray-100"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onClick={() => {
            setSelectedElement(null);
            setContextMenuElementId(null);
          }}
        >
          {/* Konva background layer — the pannable/zoomable map viewport */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            <Stage
              width={viewportSize.width}
              height={viewportSize.height}
              x={camera.x}
              y={camera.y}
              scaleX={camera.scale}
              scaleY={camera.scale}
              listening={false}
            >
              <BackgroundLayer key={selectedTemplate} templateId={selectedTemplate} backgroundImage={backgroundImage} width={canvasWidth} height={canvasHeight} />
            </Stage>
          </div>

          {/* Interactive world overlay — elements live here, dragging empty space pans */}
          <div className="absolute inset-0 overflow-visible" style={{ pointerEvents: 'none' }}>
            <div
              className="border-4 border-black relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: canvasWidth,
                height: canvasHeight,
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                transformOrigin: '0 0',
                pointerEvents: 'auto'
              }}
              onPointerDown={handleWorldPointerDown}
              onDoubleClick={(e) => {
                if (activeTool === 'draw-route' && liveRouteDrawing) {
                  e.stopPropagation();
                  commitLiveRouteDrawing();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                const isDrawTool = ['pen', 'highlight', 'rectangle', 'circle', 'grid', 'eraser', 'draw-route'].includes(activeTool);
                if (isDrawTool) e.preventDefault();
              }}
            >
              <div className="absolute top-3 left-3 z-10 bg-white/90 border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                {t(activeTemplate.labelKey)}
              </div>

              {/* Navigation routes overlay — dashed paths connecting location pins */}
              <svg className="absolute inset-0 z-[2] pointer-events-none" width={canvasWidth} height={canvasHeight} viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
                {routePaths.filter((route) => route.visible !== false).map((route) => {
                  const pathD = generateRoutePathData(route.points, route.controlPoints);
                  return (
                    <g key={route.id}>
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="#000000" 
                        strokeWidth={20} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        opacity={0.1}
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onPointerDown={(e) => insertWaypointAtClick(e, route.id, route.points)}
                      />
                      <path d={pathD} fill="none" stroke={route.color || '#cc0000'} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="28 18" pointerEvents="none" />
                      
                      {route.pointIds && route.pointIds.length > 0 && route.points.map((p, idx) => {
                        const el = elements.find(e => e.id === route.pointIds[idx]);
                        const isHidden = el?.isHiddenWaypoint;
                        
                        return (
                          <g 
                            key={`${route.id}-n-${idx}`} 
                            style={{ pointerEvents: 'auto', cursor: 'move' }} 
                            onPointerDown={(e) => startDragging(route.pointIds[idx], e)}
                          >
                            {isHidden ? (
                              <circle cx={p.x} cy={p.y} r={20} fill="#fff" stroke="#3b82f6" strokeWidth={6} />
                            ) : (
                              <>
                                <circle cx={p.x} cy={p.y} r={34} fill={route.color || '#cc0000'} stroke="#000" strokeWidth={6} />
                                <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff" fontFamily="monospace" style={{ pointerEvents: 'none' }}>{idx + 1}</text>
                              </>
                            )}
                          </g>
                        );
                      })}
                      
                      {/* Control Points Handles for Active Route (only for pin-to-pin routes) */}
                      {activeTool === 'route' && activeRouteId === route.id && route.pointIds?.length > 0 && route.points.map((p, idx) => {
                        if (idx === route.points.length - 1) return null;
                        const nextP = route.points[idx + 1];
                        const cp = (route.controlPoints && route.controlPoints[idx]) || { x: (p.x + nextP.x) / 2, y: (p.y + nextP.y) / 2 };
                        return (
                          <g key={`cp-${idx}`} style={{ pointerEvents: 'auto' }}>
                            <line x1={p.x} y1={p.y} x2={cp.x} y2={cp.y} stroke="#000" strokeWidth={4} strokeDasharray="8 8" opacity={0.4} />
                            <line x1={nextP.x} y1={nextP.y} x2={cp.x} y2={cp.y} stroke="#000" strokeWidth={4} strokeDasharray="8 8" opacity={0.4} />
                            <circle 
                              cx={cp.x} cy={cp.y} r={24} fill="#fff" stroke="#16a34a" strokeWidth={6} 
                              className="cursor-move"
                              onPointerDown={(e) => startDraggingControlPoint(e, route.id, idx)}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                pushHistory();
                                setRoutes((prev) => prev.map((r) => {
                                  if (r.id !== route.id) return r;
                                  const newCp = [...(r.controlPoints || [])];
                                  newCp[idx] = null;
                                  return { ...r, controlPoints: newCp };
                                }));
                              }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
                {navABPoints && (
                  <g>
                    <polyline points={navABPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#000000" strokeWidth={16} strokeLinecap="round" opacity={0.25} />
                    <polyline points={navABPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" strokeDasharray="30 20" />
                    <polyline points={navABPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#16a34a" strokeWidth={4} strokeLinecap="round" strokeDasharray="30 20" />
                    <g>
                      <circle cx={navABPoints[0].x} cy={navABPoints[0].y} r={44} fill="#16a34a" stroke="#000" strokeWidth={7} />
                      <text x={navABPoints[0].x} y={navABPoints[0].y + 20} textAnchor="middle" fontSize={52} fontWeight={900} fill="#fff" fontFamily="monospace">A</text>
                    </g>
                    <g>
                      <circle cx={navABPoints[1].x} cy={navABPoints[1].y} r={44} fill="#dc2626" stroke="#000" strokeWidth={7} />
                      <text x={navABPoints[1].x} y={navABPoints[1].y + 20} textAnchor="middle" fontSize={52} fontWeight={900} fill="#fff" fontFamily="monospace">B</text>
                    </g>
                  </g>
                )}
              </svg>
              {activeTool === 'route' && activeRoute && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black text-white border-2 border-white px-3 py-1.5 text-[11px] font-black rounded-full shadow-lg pointer-events-none whitespace-nowrap">
                  {t('editor.routeClickHint', { name: activeRoute.name })} · {activeRoute.pointIds.length} {t('editor.routePoints')}
                </div>
              )}

              {selectedElement && selectedData && selectedPosition && (
                <div className="absolute z-40 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-2 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" style={selectionToolbarStyle}>
                  <div className="flex items-center gap-1">
                    <button type="button" title={t('editor.move')} className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); setActiveTool('select'); }}>
                      <MousePointer2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title={t(selectedData.locked ? 'editor.unlock' : 'editor.lock')} className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); toggleLockSelectedElement(); }}>
                      {selectedData.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="h-7 w-px bg-gray-300" />
                  <div className="flex items-center gap-1">
                    <button type="button" title={t('editor.editText')} className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-amber-50" onClick={(event) => { event.stopPropagation(); if (selectedData?.type === 'text') { setSelectedElement(selectedElement); setEditingTextId(selectedElement); } }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title={selectedData.isLocation ? t('editor.unpinElement') : t('editor.pinElement')} className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black ${selectedData.isLocation ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white hover:bg-amber-50'}`} onClick={(event) => { event.stopPropagation(); handlePinToolbarClick(); }}>
                      <MapPin className={`w-3.5 h-3.5 ${selectedData.isLocation ? 'fill-white' : ''}`} />
                    </button>
                    <button type="button" title={t('editor.duplicate')} className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); duplicateSelectedElement(); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title={t('editor.deleteSelected')} className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-red-50 text-red-600" onClick={(event) => { event.stopPropagation(); deleteSelectedElement(); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {contextMenuElement && contextMenuPosition && (
                <div className="absolute z-30 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-2xl" style={quickActionMenuStyle} onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col">
                    <button onClick={() => { duplicateSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                        <Copy className="w-4 h-4 text-gray-500" />
                        {t('editor.duplicate')}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">Ctrl+D</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1.5 mx-3"></div>
                    
                    <button onClick={() => { moveLayer('front'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                        <BringToFront className="w-4 h-4 text-gray-500" />
                        {t('editor.bringFront')}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">]</span>
                    </button>
                    
                    <button onClick={() => { moveLayer('back'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                        <SendToBack className="w-4 h-4 text-gray-500" />
                        {t('editor.sendBack')}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">[</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1.5 mx-3"></div>
                    
                    <button onClick={() => { toggleLockSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                        {selectedData?.locked ? <Unlock className="w-4 h-4 text-gray-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
                        {t(selectedData?.locked ? 'editor.unlock' : 'editor.lock')}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">Alt+L</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1.5 mx-3"></div>

                    <button onClick={() => { togglePinSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-red-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                        <MapPin className={`w-4 h-4 ${selectedData?.isLocation ? 'fill-red-500 text-red-600' : 'text-gray-500'}`} />
                        {selectedData?.isLocation ? t('editor.unpinElement') : t('editor.pinElement')}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">P</span>
                    </button>

                    <div className="h-px bg-gray-100 my-1.5 mx-3"></div>
                    
                    <button onClick={() => { deleteSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-red-50 transition-colors group">
                      <div className="flex items-center gap-3 text-xs font-bold text-red-600">
                        <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                        {t('editor.delete')}
                      </div>
                      <span className="text-[10px] font-bold text-red-400">Del</span>
                    </button>
                  </div>
                </div>
              )}

              {elements.map((element) => {
                if (element.isHiddenWaypoint) return null;
                
                const position = elementPositions[element.id];
                const isSelected = selectedElement === element.id;
                const isEditingText = editingTextId === element.id && element.type === 'text';

                return (
                  <div key={element.id}
                    className={`absolute flex items-center justify-center cursor-move select-none z-[3] ${isSelected ? 'outline outline-2 outline-dashed outline-violet-500 bg-transparent' : 'hover:outline hover:outline-2 hover:outline-blue-400 bg-transparent'}`}
                    style={{
                      top: `${position.top}px`,
                      left: `${position.left}px`,
                      width: `${position.width}px`,
                      height: `${position.height}px`,
                      opacity: 1,
                      alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                      transform: `rotate(${element.rotation ?? 0}deg)`
                    }}
                    onContextMenu={(event) => {
                    event.preventDefault();
                    if (['pen', 'highlight', 'rectangle', 'circle', 'grid', 'draw-route', 'eraser'].includes(activeTool)) {
                      return; // Let it bubble to handleWorldPointerDown for cancellation
                    }
                    event.stopPropagation();
                    setSelectedElement(element.id);
                    setContextMenuElementId(element.id);
                  }} onDragOver={element.type === 'shape' ? (event) => event.preventDefault() : undefined}
                  onDrop={element.type === 'shape' ? (event) => addElementIntoShape(event, element) : undefined}
                  onPointerDown={(event) => {
                    // Route tool: click pins in order to connect them, no dragging
                    if (activeTool === 'route') {
                      event.stopPropagation();
                      setTourActive(false);
                      handleRoutePointClick(element.id);
                      return;
                    }
                    if (['pen', 'highlight', 'rectangle', 'circle', 'grid', 'draw-route', 'eraser'].includes(activeTool)) {
                      // Let event bubble to handleWorldPointerDown to start drawing
                      return;
                    }
                    const now = Date.now();
                    const quickRepeat = now - lastClickRef.current < 350;
                    lastClickRef.current = now;
                    if (quickRepeat && element.type === 'text') {
                      event.stopPropagation();
                      setSelectedElement(element.id);
                      setContextMenuElementId(null);
                      return;
                    }
                    if (!element.locked) startDragging(element.id, event);
                    else {
                      event.stopPropagation();
                      setSelectedElement(element.id);
                      setContextMenuElementId(null);
                    }
                  }} onDoubleClick={(event) => {
                    if (element.type === 'text') {
                      event.stopPropagation();
                      setSelectedElement(element.id);
                      setEditingTextId(element.id);
                    }
                  }}>
                    <div className="w-full h-full flex items-center justify-center" style={getElementFrameStyle(element)}>
                    {element.type === 'image' ? (
                      element.filter === 'polaroid' ? (
                        <div className="w-full h-full flex items-center justify-center p-[5%] pointer-events-none">
                          <div className="w-full h-full bg-white border-2 border-black p-1 pb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] rotate-[-2deg]">
                            <img src={element.content} alt={getElementLabel(element)} className="w-full h-full object-contain" style={getImageFilterStyle(element)} />
                          </div>
                        </div>
                      ) : element.filter === 'sticker' ? (
                        <div className="w-full h-full p-[4%] pointer-events-none">
                          <div className="w-full h-full bg-white rounded-[28%] border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                            <img src={element.content} alt={getElementLabel(element)} className="w-full h-full object-cover" style={getImageFilterStyle(element)} />
                          </div>
                        </div>
                      ) : (
                        <img src={element.content} alt={getElementLabel(element)} className="w-full h-full object-contain pointer-events-none" style={getImageFilterStyle(element)} />
                      )
                    ) : element.type === 'drawing' ? (
                      <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${position.width} ${position.height}`} preserveAspectRatio="none">
                        <polyline
                          points={element.points.map((p) => {
                            const isOldAbsolute = p.x > position.width * 2 || p.y > position.height * 2;
                            return isOldAbsolute 
                              ? `${p.x - position.left},${p.y - position.top}`
                              : `${p.x},${p.y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={element.color}
                          strokeWidth={element.thickness}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={element.shape === 'highlight' ? 0.4 : 1}
                        />
                      </svg>
                    ) : element.type === 'shape' ? (
                      <div className="w-full h-full pointer-events-auto" onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => addElementIntoShape(event, element)} style={{ ...getShapeStyle(element, drawingColor), ...getFramePlaceholderStyle(element), overflow: element.frameImage || element.isFrame ? 'hidden' : undefined }}>
                        {element.frameImage && (element.frameImage.type === 'image' ? <img src={element.frameImage.content} alt={element.frameImage.label || 'framed element'} className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-[min(18cqw,180px)]">{element.frameImage.content}</span>)}
                      </div>
                    ) : (
                      isEditingText ? (
                        <textarea
                          autoFocus
                          value={element.content}
                          onChange={(event) => setElements((previous) => previous.map((item) => item.id === element.id ? { ...item, content: event.target.value } : item))}
                          onBlur={() => setEditingTextId(null)}
                          onPointerDown={(event) => event.stopPropagation()}
                          className="w-full bg-transparent border-none outline-none resize-none p-2"
                          style={{
                            fontSize: `${element.fontSize ?? 160}px`,
                            fontWeight: element.fontWeight ?? 900,
                            fontStyle: element.fontStyle || 'normal',
                            textDecoration: element.textDecoration || 'none',
                            textAlign: element.textAlign || 'center',
                            fontFamily: element.fontFamily || 'sans-serif',
                            lineHeight: 1.2,
                            color: element.color ?? drawingColor ?? '#111111',
                            ...(element.type !== 'emoji' && element.textStroke ? { WebkitTextStroke: `${element.textStroke}px #111111` } : {}),
                            ...(element.type !== 'emoji' && element.textGlow ? { textShadow: `0 0 16px ${element.textGlow}` } : {})
                          }}
                        />
                      ) : (
                        <span className={`filter drop-shadow-md px-2 w-full ${element.textAnimation ? textAnimationClass(element.textAnimation) : ''}`}
                          style={{
                            fontSize: element.type === 'emoji' ? `${Math.min(position.width, position.height) * 0.8}px` : `${element.fontSize ?? 160}px`,
                            fontWeight: element.fontWeight ?? 900,
                            fontStyle: element.fontStyle || 'normal',
                            textDecoration: element.textDecoration || 'none',
                            textAlign: element.textAlign || 'center',
                            fontFamily: element.fontFamily || 'sans-serif',
                            display: 'block',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            color: element.color ?? drawingColor ?? '#111111',
                            ...(element.type !== 'emoji' && element.textGradient ? { backgroundImage: element.textGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}),
                            ...(element.type !== 'emoji' && element.textStroke ? { WebkitTextStroke: `${element.textStroke}px #111111` } : {}),
                            ...(element.type !== 'emoji' && element.textGlow ? { textShadow: `0 0 18px ${element.textGlow}` } : {})
                          }}>
                            {element.content}
                        </span>
                      )
                    )}
                    </div>
                    {/* Location pin badge — shown for ANY element type marked as location */}
                    {element.isLocation && (
                      <div className="absolute -top-1 -right-1 pointer-events-none z-10" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '100% 0' }}>
                        <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-black flex items-center justify-center text-[11px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {elements.filter(e => e.isLocation).findIndex(e => e.id === element.id) + 1}
                        </div>
                      </div>
                    )}
                    {isSelected && !isEditingText && <>
                      {/* corners */}
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-tl'); }} className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-violet-500 cursor-nwse-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '0 0' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-tr'); }} className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-violet-500 cursor-nesw-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '100% 0' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-bl'); }} className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-violet-500 cursor-nesw-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '0 100%' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-br'); }} className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-violet-500 cursor-nwse-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '100% 100%' }}></div>
                      
                      {/* edges */}
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-t'); }} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-white border-2 border-violet-500 cursor-ns-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '50% 0' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-b'); }} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-white border-2 border-violet-500 cursor-ns-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '50% 100%' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-l'); }} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-4 bg-white border-2 border-violet-500 cursor-ew-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '0 50%' }}></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize-r'); }} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-4 bg-white border-2 border-violet-500 cursor-ew-resize" style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '100% 50%' }}></div>
                      
                      {/* rotate */}
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'rotate'); }} title={t('editor.rotate')} className="absolute left-1/2 -translate-x-1/2 -bottom-9 flex h-7 w-7 cursor-grab items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-violet-50 active:cursor-grabbing" style={{ transform: `translateX(-50%) scale(${1 / camera.scale})`, transformOrigin: '50% 100%' }}>
                        <RotateCw className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                    </>}
                  </div>
                );
              })}

               {liveDrawing && (
                 <svg className="absolute z-20 pointer-events-none overflow-visible"
                   style={{ left: Math.min(liveDrawing.minX, liveDrawing.maxX), top: Math.min(liveDrawing.minY, liveDrawing.maxY), width: Math.max(1, Math.abs(liveDrawing.maxX - liveDrawing.minX)), height: Math.max(1, Math.abs(liveDrawing.maxY - liveDrawing.minY)) }}>
                   {liveDrawing.tool === 'rectangle' || liveDrawing.tool === 'circle' || liveDrawing.tool === 'grid' || liveDrawing.tool === 'eraser' ? (
                     <rect x={0} y={0} width={Math.max(1, Math.abs(liveDrawing.maxX - liveDrawing.minX))} height={Math.max(1, Math.abs(liveDrawing.maxY - liveDrawing.minY))}
                       fill={liveDrawing.tool === 'eraser' ? 'rgba(239, 68, 68, 0.2)' : 'none'}
                       stroke={liveDrawing.tool === 'eraser' ? '#ef4444' : drawingColor}
                       strokeWidth={4 / camera.scale}
                       strokeDasharray={liveDrawing.tool === 'grid' || liveDrawing.tool === 'eraser' ? '6 6' : undefined}
                       rx={liveDrawing.tool === 'circle' ? '9999' : 0}
                     />
                   ) : (
                     <polyline
                       points={liveDrawing.points.map((p) => `${p.x - Math.min(liveDrawing.minX, liveDrawing.maxX)},${p.y - Math.min(liveDrawing.minY, liveDrawing.maxY)}`).join(' ')}
                       fill="none"
                       stroke={drawingColor}
                       strokeWidth={liveDrawing.tool === 'highlight' ? 60 : 8}
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       opacity={liveDrawing.tool === 'highlight' ? 0.4 : 1}
                     />
                   )}
                 </svg>
               )}

               {pendingDeleteSelection && (
                 <div className="absolute z-20 pointer-events-auto"
                   style={{
                     left: Math.min(pendingDeleteSelection.box.minX, pendingDeleteSelection.box.maxX),
                     top: Math.min(pendingDeleteSelection.box.minY, pendingDeleteSelection.box.maxY),
                     width: Math.max(1, Math.abs(pendingDeleteSelection.box.maxX - pendingDeleteSelection.box.minX)),
                     height: Math.max(1, Math.abs(pendingDeleteSelection.box.maxY - pendingDeleteSelection.box.minY))
                   }}
                 >
                   <svg className="w-full h-full pointer-events-none overflow-visible">
                     <rect x={0} y={0} width="100%" height="100%"
                       fill="rgba(239, 68, 68, 0.2)"
                       stroke="#ef4444"
                       strokeWidth={4 / camera.scale}
                       strokeDasharray="6 6"
                     />
                   </svg>
                   <button
                     type="button"
                     onPointerDown={(e) => {
                       e.stopPropagation();
                       confirmPendingDelete();
                     }}
                     onClick={(e) => e.stopPropagation()}
                     className="absolute -top-10 -right-2 flex items-center justify-center gap-1 bg-red-600 text-white rounded px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 cursor-pointer pointer-events-auto"
                     style={{ transform: `scale(${1 / camera.scale})`, transformOrigin: '100% 100%' }}
                   >
                     <Trash2 className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase">{t('editor.delete')}</span>
                   </button>
                 </div>
               )}

               {/* Live polyline free-route drawing preview */}
               {liveRouteDrawing && (
                 <svg className="absolute inset-0 z-20 pointer-events-none overflow-visible"
                   width={canvasWidth} height={canvasHeight} viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
                   <polyline points={liveRouteDrawing.points.map((p) => `${p.x},${p.y}`).join(' ') + (liveRouteDrawing.mousePos ? ` ${liveRouteDrawing.mousePos.x},${liveRouteDrawing.mousePos.y}` : '')}
                     fill="none"
                     stroke={liveRouteDrawing.color || drawingColor}
                     strokeWidth={liveRouteDrawing.thickness || routeThickness}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     opacity={0.85} />
                   
                   {/* Draw preview points for polyline corners */}
                   {liveRouteDrawing.points.map((p, idx) => (
                     <circle key={`prv-${idx}`} cx={p.x} cy={p.y} r={16} fill={liveRouteDrawing.color || drawingColor} />
                   ))}
                   {liveRouteDrawing.mousePos && (
                     <circle cx={liveRouteDrawing.mousePos.x} cy={liveRouteDrawing.mousePos.y} r={16} fill="#fff" stroke={liveRouteDrawing.color || drawingColor} strokeWidth={4} />
                   )}
                 </svg>
               )}
            </div>
          </div>

          {tourActive && tourStops[tourIndex] && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white border-2 border-black rounded-xl px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center min-w-[130px]">
                <div className="text-[9px] font-black uppercase text-gray-400">{t('editor.tourLabel')} {tourIndex + 1}<span className="mx-0.5">/</span>{tourStops.length}</div>
                <div className="font-black text-sm text-[#cc0000] truncate max-w-[200px]">{getElementLabel(tourStops[tourIndex].element)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setTourIndex(Math.max(0, tourIndex - 1))} disabled={tourIndex === 0} title={t('editor.tourPrev')} className="w-7 h-7 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" onClick={() => setTourIndex(Math.min(tourStops.length - 1, tourIndex + 1))} disabled={tourIndex === tourStops.length - 1} title={t('editor.tourNext')} className="w-7 h-7 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                <button type="button" onClick={() => setTourActive(false)} title={t('editor.tourStop')} className="w-7 h-7 flex items-center justify-center border-2 border-black rounded-lg bg-white hover:bg-red-50 text-red-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Pan hint */}
          <div className="absolute bottom-6 left-6 z-20 bg-white/85 border-2 border-black rounded px-2.5 py-1 text-[9px] font-black uppercase text-gray-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
            {activeTool === 'route' ? t('editor.routeHint') : ['pen', 'highlight', 'rectangle', 'circle', 'grid'].includes(activeTool) ? t('editor.drawHint') : t('editor.panHint')}
          </div>

          {/* Minimap */}
          <div 
            className="absolute bottom-16 right-6 z-20 bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-crosshair group bg-gray-200 hidden sm:block"
            style={{ 
              width: 140, 
              height: 140 * (canvasHeight / canvasWidth),
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const node = e.currentTarget;
              const updateCamera = (clientX, clientY) => {
                const rect = node.getBoundingClientRect();
                const mapX = clampValue(clientX - rect.left, 0, rect.width);
                const mapY = clampValue(clientY - rect.top, 0, rect.height);
                const worldX = (mapX / rect.width) * canvasWidth;
                const worldY = (mapY / rect.height) * canvasHeight;
                setCamera({
                  x: viewportSize.width / 2 - worldX * camera.scale,
                  y: viewportSize.height / 2 - worldY * camera.scale
                });
              };
              updateCamera(e.clientX, e.clientY);
              
              node.setPointerCapture(e.pointerId);
              const onPointerMove = (evt) => updateCamera(evt.clientX, evt.clientY);
              const onPointerUp = (evt) => {
                node.releasePointerCapture(evt.pointerId);
                node.removeEventListener('pointermove', onPointerMove);
                node.removeEventListener('pointerup', onPointerUp);
              };
              node.addEventListener('pointermove', onPointerMove);
              node.addEventListener('pointerup', onPointerUp);
            }}
            title={t('editor.panHint')}
          >
            {/* Viewport Box */}
            <div 
              className="absolute border-2 border-[#cc0000] bg-white/30 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-transform duration-75"
              style={{
                left: `${(-camera.x / (camera.scale * canvasWidth)) * 100}%`,
                top: `${(-camera.y / (camera.scale * canvasHeight)) * 100}%`,
                width: `${(viewportSize.width / (camera.scale * canvasWidth)) * 100}%`,
                height: `${(viewportSize.height / (camera.scale * canvasHeight)) * 100}%`,
              }}
            />
          </div>

          {/* Zoom Control */}
          <div className="absolute bottom-6 right-6 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center text-xs font-black p-1 z-20">
            <button className="w-6 h-6 hover:bg-gray-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); zoomOut(); }}>-</button>
            {zoomEditing ? (
              <input
                autoFocus
                type="number"
                min={Math.round(MIN_ZOOM * 100)}
                max={Math.round(MAX_ZOOM * 100)}
                value={zoomInputValue}
                onChange={(event) => setZoomInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyZoomValue();
                  if (event.key === 'Escape') setZoomEditing(false);
                }}
                onClick={(event) => event.stopPropagation()}
                onBlur={applyZoomValue}
                className="w-14 text-center border border-black outline-none rounded-sm px-0.5"
              />
            ) : (
              <button
                type="button"
                className="w-12 text-center hover:bg-amber-100 cursor-pointer rounded-sm"
                onClick={(event) => { event.stopPropagation(); startZoomEdit(); }}
                title={t('editor.setZoom')}
              >
                {Math.round(camera.scale * 100)}%
              </button>
            )}
            <button className="w-6 h-6 hover:bg-gray-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); zoomIn(); }}>+</button>
            <button className="w-6 h-6 hover:bg-gray-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); fitView(); }} title={t('editor.fitView')}>
              <Maximize className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT PANEL (PROPERTIES) */}
        {propertiesPanelOpen ? (
        <div className="w-72 bg-white border-l-4 border-black flex flex-col z-10 shadow-[-4px_0_0_0_rgba(0,0,0,1)] shrink-0 hidden xl:flex">
          <div className="p-4 border-b-2 border-black flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <h2 className="font-black text-sm uppercase">{t('editor.properties')}</h2>
            </div>
            <button type="button" onClick={() => setPropertiesPanelOpen(false)} title={t('editor.collapsePanel')} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100 shrink-0">
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          
          {selectedElement ? (
            <div className="p-4 space-y-6 overflow-y-auto">
              
              {/* Selected Element Overview */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.selectedElement')}</label>
                <div className="flex items-center gap-3 bg-gray-100 border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-10 h-10 bg-white border border-black rounded flex items-center justify-center text-xl overflow-hidden">
                    {selectedData.type === 'image' ? <img src={selectedData.content} alt="" className="w-full h-full object-contain" /> : selectedData.content}
                  </div>
                  <span className="font-black text-sm truncate">{getElementLabel(selectedData)}</span>
                </div>
              </div>

              {/* MARK AS LOCATION TOGGLE */}
              <div className="space-y-2">
                {selectedData.isLocation ? (
                  <>
                    <button type="button" onClick={() => setLocationModalOpen(true)} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-amber-400 text-black py-2 rounded text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-500 active:translate-y-0.5 active:shadow-none">
                      <Pencil className="w-3.5 h-3.5" /> {t('editor.editLocation')}
                    </button>
                    <button type="button" onClick={() => { pushHistory(); setElements((prev) => prev.map((el) => el.id === selectedElement ? { ...el, isLocation: false } : el)); setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== selectedElement) }))); pruneNavForElement(selectedElement); setLocationModalOpen(false); }} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-red-50 text-red-700 py-2 rounded text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-100 active:translate-y-0.5 active:shadow-none">
                      <X className="w-3.5 h-3.5" /> {t('editor.unmarkLocation')}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => { pushHistory(); setElements((prev) => prev.map((el) => el.id === selectedElement ? { ...el, isLocation: true } : el)); setLocationModalOpen(true); }} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-emerald-400 text-black py-2 rounded text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-500 active:translate-y-0.5 active:shadow-none">
                    {t('editor.markAsLocation')}
                  </button>
                )}
              </div>

              {selectedData.isLocation && locationModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLocationModalOpen(false)}>
                  <div className="w-full max-w-lg bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
                    <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
                      <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">📍 {t('editor.editLocation')}</h3>
                      <button type="button" onClick={() => setLocationModalOpen(false)} title={t('editor.close')} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1.5">{t('editor.locName')}</label>
                        <input type="text" value={selectedData.locationDetails?.name || ''} onChange={(e) => updateSelectedLocationData('name', e.target.value)} placeholder="Starting Town" className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1.5">{t('editor.locDescription')}</label>
                        <textarea rows="3" value={selectedData.locationDetails?.description || ''} onChange={(e) => updateSelectedLocationData('description', e.target.value)} placeholder="Where the journey begins." className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
                      </div>
                      <div className="border-t-4 border-black" />
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase mb-3">
                          <span className="text-red-600">2.</span> {t('myMaps.logisticsTitle')}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="border-2 border-black p-2.5 block">
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><Clock3 className="w-3.5 h-3.5" /> {t('myMaps.hours')}</span>
                            <input value={selectedData.locationDetails?.hours || (selectedData.locationDetails?.openTime && selectedData.locationDetails?.closeTime ? `${selectedData.locationDetails.openTime} - ${selectedData.locationDetails.closeTime}` : '')} onChange={(e) => updateSelectedLocationData('hours', e.target.value)} placeholder="24/7" list="loc-hours-options" className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                            <datalist id="loc-hours-options">{locationHoursOptions.map((option) => <option key={option} value={option} />)}</datalist>
                          </label>
                          <label className="border-2 border-black p-2.5 block">
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><CircleDollarSign className="w-3.5 h-3.5" /> {t('myMaps.fee')}</span>
                            <input value={selectedData.locationDetails?.fee || ''} onChange={(e) => updateSelectedLocationData('fee', e.target.value)} placeholder={t('editor.freeExploration')} className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                          </label>
                          <label className="border-2 border-black p-2.5 block">
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><Sun className="w-3.5 h-3.5" /> {t('myMaps.bestTime')}</span>
                            <input value={selectedData.locationDetails?.bestTime || ''} onChange={(e) => updateSelectedLocationData('bestTime', e.target.value)} placeholder={t('editor.anytime')} list="loc-besttime-options" className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                            <datalist id="loc-besttime-options">{locationBestTimeOptions.map((option) => <option key={option} value={option} />)}</datalist>
                          </label>
                          <label className="border-2 border-black p-2.5 block">
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><Train className="w-3.5 h-3.5" /> {t('myMaps.travel')}</span>
                            <input value={selectedData.locationDetails?.travel || ''} onChange={(e) => updateSelectedLocationData('travel', e.target.value)} placeholder={t('editor.communityGateway')} list="loc-travel-options" className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                            <datalist id="loc-travel-options">{locationTravelOptions.map((option) => <option key={option} value={option} />)}</datalist>
                          </label>
                        </div>
                      </div>
                      <div className="border-t-4 border-black" />
                      <div>
                        <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-[#cc0000]" /> {t('editor.mapCover')}</label>
                        <EditableCover
                          value={selectedData.locationDetails?.image || ''}
                          onApply={(url) => patchLocationDetails({ image: url })}
                          onRemove={() => removeLocationMedia('image')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" /> {t('editor.mapVideo')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={selectedData.locationDetails?.video?.startsWith?.('data:') ? '' : (selectedData.locationDetails?.youtubeUrl || '')}
                            onChange={(e) => updateSelectedLocationData('youtubeUrl', e.target.value)}
                            placeholder={t('editor.videoYtPh')}
                            className="min-w-0 flex-1 border-2 border-black rounded p-2.5 text-xs font-bold bg-gray-50 focus:outline-none focus:bg-amber-50"
                          />
                          <input ref={locationVideoInputRef} type="file" accept="video/*" onChange={handleLocationVideoUpload} className="hidden" />
                          <button type="button" onClick={() => locationVideoInputRef.current?.click()} className="shrink-0 border-2 border-black rounded bg-amber-400 px-3 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Video className="w-4 h-4 mx-auto" />
                            <span className="sr-only">{t('editor.uploadVideo')}</span>
                          </button>
                        </div>
                        {selectedData.locationDetails?.video && (
                          <div className="mt-2 flex items-center gap-2 border-2 border-black rounded p-2 bg-emerald-50">
                            <span className="text-[10px] text-emerald-800 font-black uppercase flex-1 min-w-0 truncate">{t('editor.videoSelected')}</span>
                            <button type="button" onClick={() => removeLocationMedia('video')} className="shrink-0 w-5 h-5 bg-white border border-black rounded-full flex items-center justify-center text-red-600 hover:bg-red-50" title={t('editor.removeVideo')}><X className="w-3 h-3" /></button>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-gray-500 font-bold">{t('editor.videoHelper')}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> {t('editor.selfiePhoto')}
                        </label>
                        <div className="flex gap-2 items-start">
                          <input ref={locationSelfieInputRef} type="file" accept="image/*" multiple onChange={handleLocationSelfieUpload} className="hidden" />
                          <button
                            type="button"
                            onClick={() => locationSelfieInputRef.current?.click()}
                            className="shrink-0 border-2 border-black rounded bg-sky-400 hover:bg-sky-300 px-3 py-2.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                          >
                            <ImageIcon className="w-4 h-4" /> {t('editor.attachSelfie')} {selectedData.locationDetails?.selfies?.length ? `(${selectedData.locationDetails.selfies.length}/9)` : ''}
                          </button>
                          <div className="flex-1 min-w-0">
                            {selectedData.locationDetails?.selfies?.length ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  {selectedData.locationDetails.selfies.map((url, idx) => (
                                    <div key={`${url.slice(0, 20)}-${idx}`} className="relative border-2 border-black rounded overflow-hidden bg-gray-50 group">
                                      <img src={url} alt={`${t('editor.selfiePreviewAlt')} ${idx + 1}`} className="w-full h-20 object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => removeLocationSelfie(idx)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90"
                                        title={t('editor.removeSelfie')}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] font-bold text-center py-0.5">{idx + 1}/9</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-emerald-700 font-bold">{t('editor.selfieSelected')} · {selectedData.locationDetails.selfies.length} {t('editor.imagesAttached')}</p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.selfieHelper')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
                        <button type="button" onClick={() => setLocationModalOpen(false)} className="px-4 py-2 border-2 border-black rounded font-black text-xs uppercase hover:bg-gray-100">{t('editor.cancel')}</button>
                        <button type="button" onClick={() => setLocationModalOpen(false)} className="px-4 py-2 bg-[#cc0000] text-white border-2 border-black rounded font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{t('editor.saveLocation')}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedData.type === 'text' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.text')}</label>
                  <div className="space-y-3">
                    <textarea value={selectedData.content} onChange={(event) => setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, content: event.target.value } : element))} className="w-full h-20 px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none resize-none" />
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">{t('editor.fontSize')}</label>
                        <input type="number" min="8" max="120" value={selectedData.fontSize ?? 28} onChange={(event) => updateSelectedTextStyle({ fontSize: Math.max(8, Math.min(120, Number(event.target.value) || 8)) })} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                      </div>
                      <button type="button" onClick={() => updateSelectedTextStyle({ fontWeight: (selectedData.fontWeight ?? 900) > 400 ? 400 : 900 })} className={`px-3 py-2 border-2 border-black rounded font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedData.fontWeight && selectedData.fontWeight > 400 ? 'bg-slate-800 dark:bg-black text-white' : 'bg-yellow-200 text-black'}`}>
                        {selectedData.fontWeight && selectedData.fontWeight > 400 ? t('editor.normal') : t('editor.bold')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedData.type === 'image' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.filterTitle')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {photoFilters.map((filter) => (
                      <button key={filter.id} type="button" onClick={() => { pushHistory(); setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, filter: filter.id === 'none' ? undefined : filter.id } : element)); }}
                        className={`border-2 border-black rounded-lg px-1 py-1.5 font-black text-[9px] uppercase text-center ${(selectedData.filter || 'none') === filter.id ? 'bg-amber-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        {t(filter.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedData.type === 'shape' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.shape')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['rectangle', t('editor.toolRect')],
                      ['circle', t('editor.toolCircle')],
                      ['grid', t('editor.toolGrid')],
                      ['line', t('editor.toolLine')],
                      ['highlight', t('editor.toolHighlight')]
                    ].map(([shape, label]) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => changeSelectedShape(shape)}
                        className={`border-2 border-black rounded px-2 py-2 text-[9px] font-black uppercase ${selectedData.shape === shape ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <span className="block h-5 mb-1" style={getShapeStyle({ shape, color: selectedData.color })} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedData.type !== 'shape' && selectedData.type !== 'drawing' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.frameShape')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['', t('editor.frameNone')],
                      ['circle', t('editor.frameCircle')],
                      ['rounded', t('editor.frameRounded')],
                      ['diamond', t('editor.frameDiamond')],
                      ['hexagon', t('editor.frameHexagon')]
                    ].map(([frameShape, label]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => changeSelectedFrameShape(frameShape)}
                        className={`border-2 border-black rounded px-2 py-2 text-[9px] font-black uppercase ${ (selectedData.frameShape || '') === frameShape ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <span className="block h-5 mb-1 border-2 border-black bg-gray-200" style={getElementFrameStyle({ frameShape })} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transform */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.transform')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">{t('editor.xPos')}</label>
                    <input type="number" min="0" max="800" value={Math.round(selectedPosition.left)} onChange={(event) => updateSelectedPosition('left', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">{t('editor.yPos')}</label>
                    <input type="number" min="0" max="600" value={Math.round(selectedPosition.top)} onChange={(event) => updateSelectedPosition('top', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">{t('editor.width')}</label>
                    <input type="number" min="40" max="800" value={Math.round(selectedPosition.width)} onChange={(event) => updateSelectedPosition('width', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">{t('editor.height')}</label>
                    <input type="number" min="40" max="600" value={Math.round(selectedPosition.height)} onChange={(event) => updateSelectedPosition('height', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                </div>
              </div>

              {/* Arrangement */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.arrangement')}</label>
                <div className="flex gap-2">
                  <button onClick={() => moveLayer('front')} title={t('editor.bringFront')} className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <BringToFront className="w-4 h-4" /> 
                  </button>
                  <button onClick={() => moveLayer('back')} title={t('editor.sendBack')} className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <SendToBack className="w-4 h-4" /> 
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t-2 border-black border-dashed">
                <button onClick={deleteSelectedElement} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-red-50 hover:text-red-600 font-black py-2 rounded text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                  <Trash2 className="w-4 h-4" /> {t('editor.deleteElement')}
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-xs text-gray-400 font-bold border-2 border-dashed border-gray-300 p-4 rounded">
                {t('editor.clickElementHint')}
              </p>
            </div>
          )}

          {/* ADDED LOCATIONS LIST */}
          <div className="mt-auto border-t-4 border-black bg-gray-50 flex flex-col min-h-[160px] max-h-[30vh]">
            <div className="p-3 border-b-2 border-black border-dashed shrink-0">
              <h3 className="font-black text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5">{t('editor.addedLocations')} <span className="text-[10px] text-gray-400 font-bold normal-case">({elements.filter(e => e.isLocation).length})</span></h3>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              {elements.filter(e => e.isLocation).length === 0 ? (
                 <p className="text-[10px] text-gray-400 font-bold text-center italic py-4 border-2 border-dashed border-gray-300 rounded">{t('editor.markLocationHint')}</p>
              ) : elements.filter(e => e.isLocation).map((loc, idx) => (
                <div key={loc.id} className={`flex items-center justify-between bg-white border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-amber-50 transition-colors ${selectedElement === loc.id ? 'border-amber-400 bg-amber-50' : ''}`} onClick={() => setSelectedElement(loc.id)}>
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-black flex items-center justify-center text-[10px] font-black text-white shrink-0">
                      {idx + 1}
                    </div>
                    <div className="w-6 h-6 bg-gray-100 border border-black rounded flex items-center justify-center text-sm overflow-hidden shrink-0">
                      {loc.type === 'image' ? <img src={loc.content} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">{loc.content?.slice(0, 2)}</span>}
                    </div>
                    <span className="font-black text-[10px] truncate">{loc.locationDetails?.name || getElementLabel(loc)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setNavPoint('start', navStartId === loc.id ? null : loc.id); }} title={t('editor.navSetStart')} className={`w-5 h-5 rounded-full border-2 border-black text-[9px] font-black flex items-center justify-center ${navStartId === loc.id ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-emerald-100'}`}>A</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setNavPoint('end', navEndId === loc.id ? null : loc.id); }} title={t('editor.navSetEnd')} className={`w-5 h-5 rounded-full border-2 border-black text-[9px] font-black flex items-center justify-center ${navEndId === loc.id ? 'bg-red-600 text-white' : 'bg-white hover:bg-red-100'}`}>B</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedElement(loc.id); setLocationModalOpen(true); }} title={t('editor.editLocation')} className="p-1 hover:bg-gray-100 rounded border border-transparent hover:border-black"><Pencil className="w-3 h-3 text-blue-600" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); pushHistory(); setElements(prev => prev.map(el => el.id === loc.id ? { ...el, isLocation: false, locationDetails: undefined } : el)); setRoutes((prev) => prev.map((route) => ({ ...route, pointIds: route.pointIds.filter((id) => id !== loc.id) }))); pruneNavForElement(loc.id); if (selectedElement === loc.id) setSelectedElement(null); }} className="p-1 hover:bg-red-50 rounded border border-transparent hover:border-black" title={t('editor.unmarkLocationTitle')}><X className="w-3 h-3 text-red-600" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        ) : (
        <div className="w-10 bg-white border-l-4 border-black flex flex-col items-center pt-4 gap-2 z-10 shrink-0 hidden xl:flex">
          <button type="button" onClick={() => setPropertiesPanelOpen(true)} title={t('editor.expandPanel')} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100">
            <PanelRightOpen className="w-4 h-4" />
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
