import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage } from 'react-konva';
import { useApp } from '../context/AppContext';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check,
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Grid3X3,
  Share2, MessageCircle, Smartphone, Copy, X, Lock, Unlock, RotateCw, Video, Camera, Image as ImageIcon, Maximize, MapPin,
  Crown, PenTool, Folder, LayoutDashboard, ImagePlus,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Play, ChevronLeft, ChevronRight, Wand2,
  Utensils, Plane, Trees, Gamepad2, Landmark, Tag, Link
} from 'lucide-react';
import confetti from 'canvas-confetti';
import useCanvasControls from '../hooks/useCanvasControls';
import { compressForUpload } from '../lib/imageUtils';
import BackgroundLayer from '../components/editor/BackgroundLayer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ELEMENT_SIZE, MIN_ZOOM, MAX_ZOOM, clampValue, scaleElementPositions, scaleElementFontSizes, derivePinsFromElements } from '../lib/editorCanvas';
import { getShapeStyle, getImageFilterStyle, getElementFrameStyle, getFramePlaceholderStyle } from '../lib/editorElements';

const getYouTubeEmbedUrl = (value) => {
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

const mapTemplates = [
  {
    id: 'blank',
    labelKey: 'editor.templateBlank',
    preview: '#ffffff',
    canvas: {
      backgroundColor: '#ffffff',
      backgroundImage: 'none'
    }
  },
  {
    id: 'tropical',
    labelKey: 'editor.templateTropical',
    preview: 'linear-gradient(#48b4ed 0 24%, #f8d58b 24% 58%, #42b8d7 58%)',
    canvas: {
      backgroundColor: '#f8d58b',
      backgroundImage: 'linear-gradient(180deg, transparent 0 44%, #d9a866 44% 45%, #f8d58b 45% 66%, #42b8d7 66% 67%, #278fc8 67%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px)'
    }
  },
  {
    id: 'island',
    labelKey: 'editor.templateGreen',
    preview: 'linear-gradient(135deg, #58b74d 0 30%, #96df4e 30% 70%, #58b74d 70%)',
    canvas: {
      backgroundColor: '#85d64d',
      backgroundImage: 'radial-gradient(ellipse at center, #a0e65c 0 45%, transparent 46%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px)'
    }
  },
  {
    id: 'river',
    labelKey: 'editor.templateRiver',
    preview: 'linear-gradient(135deg, #77cf3d 0 45%, #398ac1 45% 58%, #77cf3d 58%)',
    canvas: {
      backgroundColor: '#78ce3d',
      backgroundImage: 'linear-gradient(90deg, transparent 0 42%, #328ec4 43% 48%, #78ce3d 49%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px)'
    }
  },
  {
    id: 'boardwalk',
    labelKey: 'editor.templateBeach',
    preview: 'linear-gradient(#f5cf7b 0 40%, #98613d 40% 53%, #35afd2 53%)',
    canvas: {
      backgroundColor: '#f5cf7b',
      backgroundImage: 'linear-gradient(180deg, transparent 0 39%, #98613d 40% 52%, #f5cf7b 53% 62%, #35afd2 63%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px)'
    }
  },
  {
    id: 'gametion-village-lake',
    labelKey: 'editor.templateGametionVillageLake',
    preview: 'url("/templates/map1.png") center / cover, #e2f0d9',
    image: '/templates/map1.png',
    canvas: { backgroundColor: '#e2f0d9', backgroundImage: 'none' }
  },
  {
    id: 'gametion-region-fields',
    labelKey: 'editor.templateGametionRegionFields',
    preview: 'url("/templates/map2.jpg") center / cover, #e2f0d9',
    image: '/templates/map2.jpg',
    canvas: { backgroundColor: '#e2f0d9', backgroundImage: 'none' }
  },
  {
    id: 'gametion-lighthouse-cave',
    labelKey: 'editor.templateGametionLighthouseCave',
    preview: 'url("/templates/map3.jpg") center / cover, #e2f0d9',
    image: '/templates/map3.jpg',
    canvas: { backgroundColor: '#e2f0d9', backgroundImage: 'none' }
  },
  {
    id: 'gametion-volcanic-cavern',
    labelKey: 'editor.templateGametionVolcanicCavern',
    preview: 'url("/templates/map4.jpg") center / cover, #201818',
    image: '/templates/map4.jpg',
    canvas: { backgroundColor: '#201818', backgroundImage: 'none' }
  },
  {
    id: 'gametion-world-region',
    labelKey: 'editor.templateGametionWorldRegion',
    preview: 'url("/templates/map5.jpg") center / cover, #1377b9',
    image: '/templates/map5.jpg',
    canvas: { backgroundColor: '#1377b9', backgroundImage: 'none' }
  }
];

const privacyOptions = [
  { value: 'public', labelKey: 'editor.public', descKey: 'editor.publicDesc' },
  { value: 'unlisted', labelKey: 'editor.unlisted', descKey: 'editor.unlistedDesc' },
  { value: 'private', labelKey: 'editor.private', descKey: 'editor.privateDesc' }
];

const publishPresetTags = [
  { value: 'restaurant', labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  { value: 'travel', labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  { value: 'park', labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  { value: 'game', labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  { value: 'attraction', labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
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
  const [showTextAnimMenu, setShowTextAnimMenu] = useState(false);
  const [showTextPositionMenu, setShowTextPositionMenu] = useState(false);
  const [liveDrawing, setLiveDrawing] = useState(null);
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
  } = useCanvasControls();
  const tourCameraRef = useRef(camera);
  const [backgroundImage, setBackgroundImage] = useState(() => (typeof savedEditorState?.backgroundImage === 'string' && savedEditorState.backgroundImage) || '');
  const [ready, setReady] = useState(false);
  const [elements, setElements] = useState(() => (Array.isArray(savedEditorState?.elements)
    ? scaleElementFontSizes(savedEditorState.elements, savedEditorState?.elementPositions).map((element) => normalizeElementFont(element))
    : []));
  const [elementPositions, setElementPositions] = useState(() => scaleElementPositions(savedEditorState?.elementPositions) || {});
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
  const [publishVideoError, setPublishVideoError] = useState('');
  const [publishSelfieUrls, setPublishSelfieUrls] = useState(() => {
    if (Array.isArray(savedEditorState?.publishSelfieUrls)) return savedEditorState.publishSelfieUrls;
    if (typeof savedEditorState?.publishSelfieUrl === 'string' && savedEditorState.publishSelfieUrl) return [savedEditorState.publishSelfieUrl];
    return [];
  });
  const [publishSelfieError, setPublishSelfieError] = useState('');
  const [publishCoverImage, setPublishCoverImage] = useState(() => {
    if (typeof savedEditorState?.publishCoverImage === 'string' && savedEditorState.publishCoverImage) return savedEditorState.publishCoverImage;
    return editorSetup?.imageUrl || '';
  });
  const [publishCoverError, setPublishCoverError] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
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
  const videoInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const nextElementId = useRef(0);

  const getElementLabel = (element) => (element.labelKey ? t(element.labelKey) : element.label);

  const pushHistory = () => {
    setHistory((previous) => [...previous, { elements, elementPositions }]);
    setFuture([]);
  };

  const editorDraftState = {
    elements,
    elementPositions,
    selectedTemplate,
    backgroundImage,
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

  const commitLiveDrawing = (draw) => {
    if (!draw || (draw.tool === 'pen' || draw.tool === 'highlight') && draw.points.length < 2) return;
    pushHistory();
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
        points, color: drawingColor, thickness: draw.tool === 'highlight' ? 60 : 8, rotation: 0
      }]);
      setElementPositions((prev) => ({ ...prev, [id]: box }));
      setSelectedElement(id);
    }
  };

  useEffect(() => {
    liveDrawingRef.current = liveDrawing;
  }, [liveDrawing]);

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
        setHistory((previous) => [...previous, { elements, elementPositions }]);
        setFuture([]);
        setElements((previous) => previous.map((element) =>
          element.id === selectedElement ? { ...element, isLocation: !element.isLocation } : element
        ));
        return;
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      event.preventDefault();
      setHistory((previous) => [...previous, { elements, elementPositions }]);
      setFuture([]);
      setElements((previous) => previous.filter((element) => element.id !== selectedElement));
      setElementPositions((previous) => {
        const next = { ...previous };
        delete next[selectedElement];
        return next;
      });
      setSelectedElement(null);
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [selectedElement, elements, elementPositions]);

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
    const small = await compressForUpload(file, { maxWidth: 1280, quality: 0.8 });
    addUserAsset({ type: 'background', label: file.name, file: small || file }).then((asset) => {
      if (asset?.url) setBackgroundImage(asset.url);
    });
  };

  const clearBackground = () => setBackgroundImage('');

  const handleWorldPointerDown = (event) => {
    setTourActive(false);
    setContextMenuElementId(null);
    const isDrawTool = ['pen', 'highlight', 'rectangle', 'circle', 'grid'].includes(activeTool);
    if (isDrawTool && event.target === event.currentTarget) {
      event.stopPropagation();
      const rect = viewportRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - camera.x) / camera.scale;
      const y = (event.clientY - rect.top - camera.y) / camera.scale;
      setLiveDrawing({ tool: activeTool, points: [{ x, y }], minX: x, maxX: x, minY: y, maxY: y });
      return;
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
        selectedTemplate,
        backgroundImage,
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
  }, [elements, elementPositions, selectedTemplate, backgroundImage, mapTitle, publishDescription, publishTags, publishPrivacy, publishVideoUrl, publishSelfieUrls, publishCoverImage, mapId]);

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

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((current) => [...current, { elements, elementPositions }]);
    setElements(previous.elements);
    setElementPositions(previous.elementPositions);
    setHistory((current) => current.slice(0, -1));
    setSelectedElement(null);
  };

  const redo = () => {
    const next = future[future.length - 1];
    if (!next) return;
    setHistory((current) => [...current, { elements, elementPositions }]);
    setElements(next.elements);
    setElementPositions(next.elementPositions);
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
      const maxValue = property === 'width' ? CANVAS_WIDTH - current.left
        : property === 'height' ? CANVAS_HEIGHT - current.top
          : property === 'left' ? CANVAS_WIDTH - current.width
            : CANVAS_HEIGHT - current.height;
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
        left: Math.min(position.left + 24, CANVAS_WIDTH - position.width),
        top: Math.min(position.top + 24, CANVAS_HEIGHT - position.height),
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
    pushHistory();
    setElements((previous) => previous.map((element) =>
      element.id === selectedElement ? { ...element, isLocation: !element.isLocation } : element
    ));
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

  const publishMap = async () => {
    const videoUrl = publishVideoUrl.trim();
    if (videoUrl && !videoUrl.startsWith('data:video/')) {
      const youtubeUrl = getYouTubeEmbedUrl(videoUrl);
      if (!youtubeUrl) {
        setPublishVideoError(t('editor.ytInvalid'));
        return;
      }
    }
    // Build traveler logs with all attached selfies (multi)
    let finalLogs = Array.isArray(editorSetup?.logs) ? [...editorSetup.logs] : [];
    if (publishSelfieUrls.length) {
      // eslint-disable-next-line react-hooks/purity -- unique id for publish-time log entries (event handler, not render)
      const baseTime = Date.now();
      const selfieLogs = publishSelfieUrls.map((img, idx) => ({
        id: `selfie-${baseTime}-${idx}`,
        type: 'selfie',
        image: img,
        caption: mapTitle.trim() || t('editor.untitledMap'),
        author: userProfile?.name || 'Traveler',
        date: new Date().toLocaleDateString(),
      }));
      finalLogs = [...finalLogs, ...selfieLogs];
    }

    const publishedPins = derivePinsFromElements(elements, elementPositions, (el) => (el.labelKey ? t(el.labelKey) : el.label));

    const mapData = {
id: mapId,
      title: mapTitle.trim() || t('editor.untitledMap'),
      region: editorSetup?.locationCity || editorSetup?.region || '',
      description: publishDescription.trim() || t('editor.generatingDesc', {
        user: userProfile?.name || 'a TravelCraft traveler',
        name: t(activeTemplate.labelKey)
      }),
      imageUrl: publishCoverImage || editorSetup?.imageUrl || null,
      videoUrl: videoUrl.startsWith('data:video/') ? videoUrl : getYouTubeEmbedUrl(videoUrl),
      previewBackground: activeTemplate.canvas,
      bgThemeUrl: typeof backgroundImage === 'string' && backgroundImage ? backgroundImage : null,
      isEditorMap: true,
      hours: editorSetup?.hours || '24/7',
      fee: editorSetup?.fee || t('editor.freeExploration'),
      bestTime: editorSetup?.bestTime || t('editor.anytime'),
      travel: editorSetup?.travel || t('editor.communityGateway'),
      logs: finalLogs,
      selfieUrl: publishSelfieUrls[0] || null,
      selfieUrls: publishSelfieUrls.length ? [...publishSelfieUrls] : null,
      rarity: editorSetup?.rarity || 'common',
      tags: publishTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      privacy: publishPrivacy,
      pins: publishedPins,
      editorState: editorDraftState
    };

if (publishPrivacy === 'private') {
      localStorage.setItem('project_travelcraft_editor_draft', JSON.stringify({ elements, elementPositions, selectedTemplate, ...mapData }));
      setSaveStatus(t('editor.statusPrivateSaved'));
      setShowPublishModal(false);
      return;
    }

    publishMapToCommunity(mapData);

    if (publishPrivacy === 'unlisted') {
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
    const fallbackLeft = CANVAS_WIDTH / 2 - width / 2;
    const fallbackTop = CANVAS_HEIGHT / 2 - height / 2;
    const viewportX = viewportSize.width / 2;
    const viewportY = viewportSize.height / 2;
    const placeLeft = viewportSize.width
      ? Math.max(0, Math.min(CANVAS_WIDTH - width, Math.round((viewportX - camera.x) / camera.scale - width / 2)))
      : fallbackLeft;
    const placeTop = viewportSize.height
      ? Math.max(0, Math.min(CANVAS_HEIGHT - height, Math.round((viewportY - camera.y) / camera.scale - height / 2)))
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
      setSelectedElement(null);
      return;
    }
    if (tool === 'select') {
      setActiveTool('select');
      return;
    }
    setActiveTool(tool);
  };

  const handleUpload = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        nextElementId.current += 1;
        const id = `upload-${nextElementId.current}`;
        setUploadedFiles((previous) => [...previous, { id, label: file.name, content: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
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

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setPublishVideoError(t('editor.onlyVideo'));
      event.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPublishVideoError(t('editor.videoTooLarge'));
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPublishVideoUrl(reader.result);
      setPublishVideoError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSelfieUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remainingSlots = 9 - publishSelfieUrls.length;
    if (files.length > remainingSlots) {
      setPublishSelfieError(t('editor.selfieTooMany', { max: 9 }));
    }
    const toProcess = files.slice(0, remainingSlots);
    let hasError = false;
    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setPublishSelfieError(t('editor.onlyImage'));
        hasError = true;
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setPublishSelfieError(t('editor.imageTooLarge'));
        hasError = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPublishSelfieUrls((prev) => {
          if (prev.length >= 9) return prev;
          return [...prev, reader.result];
        });
        setPublishSelfieError('');
      };
      reader.readAsDataURL(file);
    });
    if (!hasError && toProcess.length) setPublishSelfieError('');
    event.target.value = '';
  };

  const removeSelfieAt = (idx) => {
    setPublishSelfieUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPublishCoverError(t('editor.onlyImage'));
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPublishCoverError(t('editor.imageTooLarge'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPublishCoverImage(reader.result);
      setPublishCoverError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const publishTagList = () => (publishTags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const hasPublishTag = (tag) => publishTagList().some((existing) => existing.toLowerCase() === tag.toLowerCase());
  const togglePublishTag = (tag) => {
    const current = publishTagList();
    const next = hasPublishTag(tag)
      ? current.filter((existing) => existing.toLowerCase() !== tag.toLowerCase())
      : [...current, tag];
    setPublishTags(next.join(', '));
  };
  const addPublishCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (!hasPublishTag(tag)) setPublishTags([...publishTagList(), tag].join(', '));
    setCustomTagInput('');
  };
  const removePublishTag = (tag) => {
    setPublishTags(publishTagList().filter((existing) => existing.toLowerCase() !== tag.toLowerCase()).join(', '));
  };

  const selectedData = elements.find((element) => element.id === selectedElement);
  const selectedPosition = selectedElement ? elementPositions[selectedElement] : null;
  const contextMenuElement = contextMenuElementId ? elements.find((element) => element.id === contextMenuElementId) : null;
  const selectionToolbarStyle = selectedPosition ? {
    top: Math.max(12, selectedPosition.top - 12),
    left: Math.max(10, Math.min(selectedPosition.left + selectedPosition.width / 2, CANVAS_WIDTH - 20)),
    transform: `translate(-50%, -100%) scale(${1 / camera.scale})`,
    transformOrigin: 'bottom center'
  } : {};
  const contextMenuPosition = contextMenuElementId ? elementPositions[contextMenuElementId] : null;
  const quickActionMenuStyle = contextMenuElement && contextMenuPosition ? {
    top: Math.max(20, contextMenuPosition.top + contextMenuPosition.height + 10),
    left: Math.max(20, Math.min(contextMenuPosition.left, CANVAS_WIDTH - 240)),
    transform: `scale(${1 / camera.scale})`,
    transformOrigin: 'top left'
  } : {};
  const activeTemplate = mapTemplates.find((template) => template.id === selectedTemplate) || mapTemplates[0];
  const selectTemplate = (templateId) => {
    const template = mapTemplates.find((item) => item.id === templateId);
    setSelectedTemplate(templateId);
    setBackgroundImage(template?.image || '');
  };

  const selectBaseMapBackground = (baseMap) => {
    setSelectedTemplate('blank');
    setBackgroundImage(baseMap.image || baseMap.imageUrl || '');
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

  return (
    <div className="h-screen w-full bg-[#f0f0f0] flex flex-col font-mono text-black overflow-hidden selection:bg-red-200">
      <style>{`
        .editor-anim-wave { animation: editorWave 1.2s ease-in-out infinite; transform-origin: 50% 50%; }
        @keyframes editorWave { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg) translateY(-8px); } }
        .editor-anim-shake { animation: editorShake .5s ease-in-out infinite; }
        @keyframes editorShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .editor-anim-float { animation: editorFloat 2.4s ease-in-out infinite; }
        @keyframes editorFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>
      
      {/* TOP NAVBAR */}
      <header className="h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)] z-20 relative">
        <div className="flex items-center gap-4 h-full">
          <button onClick={onBack} className="hover:bg-gray-200 p-1 rounded transition-colors" title={t('editor.backToMyMaps')}>
            <ArrowLeft className="w-5 h-5 font-black" />
          </button>
          <div className="flex items-center gap-2 text-[#cc0000] font-black uppercase tracking-wider">
            <Compass className="w-5 h-5" />
            <span className="hidden sm:inline">TravelCraft</span>
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
        <div className="w-full max-w-md bg-[#202020] text-white border-2 border-white/70 rounded-lg shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="font-black text-lg">{t('editor.shareModalTitle')}</h2>
            <button onClick={() => setShowShareModal(false)} title={t('editor.close')} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <button onClick={nativeShare} className="mx-auto my-5 block bg-white text-black rounded-full px-5 py-2 font-bold hover:bg-gray-200">{t('editor.shareBtn')}</button>
          <p className="text-center text-sm text-gray-300 mb-5">{t('editor.shareModalDesc')}</p>
          <div className="grid grid-cols-5 gap-3 mb-6">
            <button onClick={() => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)} title={t('editor.facebook')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center font-black text-2xl">f</span><span className="text-[10px]">{t('editor.facebook')}</span></button>
            <button onClick={() => openShareLink(`sms:?body=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title={t('editor.messages')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-white text-[#1677e8] flex items-center justify-center"><MessageCircle className="w-7 h-7 fill-current" /></span><span className="text-[10px]">{t('editor.messages')}</span></button>
            <button onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title={t('editor.whatsapp')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center"><Smartphone className="w-6 h-6" /></span><span className="text-[10px]">{t('editor.whatsapp')}</span></button>
            <button onClick={() => openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)} title={t('editor.x')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-black border border-white/30 flex items-center justify-center font-black text-xl">X</span><span className="text-[10px]">{t('editor.x')}</span></button>
            <button onClick={copyShareLink} title={t('editor.copyLink')} className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"><Copy className="w-5 h-5" /></span><span className="text-[10px]">{copied ? t('editor.copied') : t('editor.copy')}</span></button>
          </div>
          <div className="flex items-center gap-2 bg-[#111] border border-white/20 rounded-lg p-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs text-gray-300 outline-none" />
            <button onClick={copyShareLink} className="shrink-0 border border-white/40 rounded-full px-3 py-1 text-xs font-bold hover:bg-white/10">{copied ? t('editor.copied') : t('editor.copy')}</button>
          </div>
        </div>
      </div>}

      {showPublishModal && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowPublishModal(false)}>
        <form onSubmit={(event) => { event.preventDefault(); publishMap(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
            <h2 className="font-black uppercase tracking-wide">{t('editor.publishTitle')}</h2>
            <button type="button" onClick={() => setShowPublishModal(false)} title={t('editor.close')} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="publish-title" className="block text-xs font-black uppercase mb-1.5">{t('editor.mapTitle')}</label>
              <input id="publish-title" value={mapTitle} onChange={(event) => setMapTitle(event.target.value)} required className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
            </div>
            <div>
              <label htmlFor="publish-description" className="block text-xs font-black uppercase mb-1.5">{t('editor.description')}</label>
              <textarea id="publish-description" rows="3" value={publishDescription} onChange={(event) => setPublishDescription(event.target.value)} placeholder={t('editor.descriptionPh')} className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
            </div>
            {/* Cover Image — used as the map cover shown in the Community feed */}
            <div>
              <label className="block text-xs font-black uppercase mb-1.5">{t('editor.mapCover')}</label>
              <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
              <div className="flex gap-2 items-start">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="shrink-0 border-2 border-black rounded bg-amber-400 hover:bg-amber-300 px-3 py-2.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> {t('editor.uploadCover')}
                </button>
                <div className="flex-1 min-w-0">
                  {publishCoverImage ? (
                    <div className="relative border-2 border-black rounded overflow-hidden bg-gray-50">
                      <img src={publishCoverImage} alt={t('editor.coverPreviewAlt')} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => setPublishCoverImage('')}
                        className="absolute top-1 right-1 w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90 cursor-pointer"
                        title={t('editor.removeCover')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.coverHelper')}</p>
                  )}
                  {publishCoverError && <p className="mt-1 text-[10px] text-red-600 font-bold">{publishCoverError}</p>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-[#cc0000]" /> {t('myMaps.tagsTitle')}</label>
              <p className="mb-2 text-[10px] text-gray-500 font-bold">{t('myMaps.tagsHelp')}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {publishPresetTags.map(({ value, labelKey, emoji, icon: Icon }) => {
                  const active = hasPublishTag(value);
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => togglePublishTag(value)}
                      className={`px-2.5 py-1.5 border-2 border-black text-[9px] font-black uppercase flex items-center gap-1 rounded cursor-pointer ${active ? 'bg-amber-300' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {active ? <Check className="w-3 h-3" /> : <span className="text-[11px]">+</span>} <Icon className="w-3 h-3" /> {emoji} {t(labelKey)}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1 border-2 border-black bg-gray-50 p-1.5">
                  <Tag className="w-4 h-4 text-[#cc0000] shrink-0" />
                  <input
                    value={customTagInput}
                    onChange={(event) => setCustomTagInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPublishCustomTag(); } }}
                    placeholder={t('myMaps.customTagPh')}
                    className="w-full text-xs font-bold bg-transparent outline-none"
                  />
                </div>
                <button type="button" onClick={addPublishCustomTag} className="shrink-0 px-4 py-2 bg-[#cc0000] text-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{t('myMaps.addTag')}</button>
              </div>
              {publishTagList().filter((tag) => !publishPresetTags.some((preset) => preset.value === tag)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {publishTagList().filter((tag) => !publishPresetTags.some((preset) => preset.value === tag)).map((tag) => (
                    <span key={tag} className="px-2 py-1 border-2 border-black bg-amber-100 text-[9px] font-black uppercase flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removePublishTag(tag)} className="text-red-600 font-black cursor-pointer">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="publish-video-url" className="block text-xs font-black uppercase mb-1.5">{t('editor.mapVideo')}</label>
              <div className="flex gap-2">
                <input
                  id="publish-video-url"
                  type="url"
                  value={publishVideoUrl.startsWith('data:') ? '' : publishVideoUrl}
                  onChange={(event) => { setPublishVideoUrl(event.target.value); setPublishVideoError(''); }}
                  placeholder={t('editor.videoYtPh')}
                  className="min-w-0 flex-1 border-2 border-black rounded p-2.5 text-xs font-bold bg-gray-50 focus:outline-none focus:bg-amber-50"
                />
                <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                <button type="button" onClick={() => videoInputRef.current?.click()} className="shrink-0 border-2 border-black rounded bg-amber-400 px-3 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Video className="w-4 h-4 mx-auto" />
                  <span className="sr-only">{t('editor.uploadVideo')}</span>
                </button>
              </div>
              {publishVideoUrl.startsWith('data:video/') && <p className="mt-1 text-[10px] text-emerald-700 font-bold">{t('editor.videoSelected')}</p>}
              {publishVideoError && <p className="mt-1 text-[10px] text-red-600 font-bold">{publishVideoError}</p>}
              <p className="mt-1 text-[10px] text-gray-500 font-bold">{t('editor.videoHelper')}</p>
            </div>
            {/* Selfie attachment for Traveler Logs (บันทึกการเดินทาง) */}
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> {t('editor.selfiePhoto')}
              </label>
              <div className="flex gap-2 items-start">
                <input ref={selfieInputRef} type="file" accept="image/*" multiple onChange={handleSelfieUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  className="shrink-0 border-2 border-black rounded bg-sky-400 hover:bg-sky-300 px-3 py-2.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> {t('editor.attachSelfie')} {publishSelfieUrls.length ? `(${publishSelfieUrls.length}/9)` : ''}
                </button>
                <div className="flex-1 min-w-0">
                  {publishSelfieUrls.length ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {publishSelfieUrls.map((url, idx) => (
                          <div key={`${url.slice(0,20)}-${idx}`} className="relative border-2 border-black rounded overflow-hidden bg-gray-50 group">
                            <img src={url} alt={`${t('editor.selfiePreviewAlt')} ${idx + 1}`} className="w-full h-20 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSelfieAt(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90"
                              title={t('editor.removeSelfie')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] font-bold text-center py-0.5">{idx + 1}/9</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-bold">{t('editor.selfieSelected')} · {publishSelfieUrls.length} {t('editor.imagesAttached')}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.selfieHelper')}</p>
                  )}
                  {publishSelfieError && <p className="mt-1 text-[10px] text-red-600 font-bold">{publishSelfieError}</p>}
                </div>
              </div>
            </div>
            <fieldset>
              <legend className="block text-xs font-black uppercase mb-2">{t('editor.privacy')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {privacyOptions.map((option) => (
                  <label key={option.value} className={`border-2 border-black rounded p-2 cursor-pointer ${publishPrivacy === option.value ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <input type="radio" name="privacy" value={option.value} checked={publishPrivacy === option.value} onChange={(event) => setPublishPrivacy(event.target.value)} className="sr-only" />
                    <span className="block text-xs font-black uppercase">{t(option.labelKey)}</span>
                    <span className="block mt-1 text-[9px] leading-tight font-bold text-gray-600">{t(option.descKey)}</span>
                  </label>
                ))}
              </div>
              {publishPrivacy === 'unlisted' && (
                <div className="mt-2 border-2 border-amber-400 bg-amber-50 rounded p-2.5 text-[10px] font-bold text-amber-800 leading-relaxed">
                  {t('editor.publishUnlistedNotice')}
                </div>
              )}
              {publishPrivacy === 'private' && (
                <div className="mt-2 border-2 border-red-400 bg-red-50 rounded p-2.5 text-[10px] font-bold text-red-700 leading-relaxed">
                  {t('editor.publishPrivateNotice')}
                </div>
              )}
            </fieldset>
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button type="button" onClick={() => setShowPublishModal(false)} className="px-4 py-2 border-2 border-black rounded font-black text-xs uppercase hover:bg-gray-100">{t('editor.cancel')}</button>
              <button type="submit" className="px-4 py-2 bg-[#cc0000] text-white border-2 border-black rounded font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5">
                {publishPrivacy === 'unlisted' && <Link className="w-3.5 h-3.5" />}
                {publishPrivacy === 'unlisted' ? t('editor.shareMap') : publishPrivacy === 'private' ? t('editor.saveDraft') : t('editor.publishMap')}
              </button>
            </div>
          </div>
        </form>
      </div>}

      {showBadgeCelebration && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowBadgeCelebration(false)}>
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
                    <button key={template.id} type="button" onClick={() => selectTemplate(template.id)} aria-pressed={selectedTemplate === template.id} className={`aspect-square w-[calc(50%-0.375rem)] border-2 border-black rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform flex flex-col items-center justify-end p-2 relative overflow-hidden ${selectedTemplate === template.id ? 'ring-4 ring-[#4895ef] ring-offset-2' : ''}`}>
                      <div className="absolute inset-0" style={{ background: template.preview }}></div>
                      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0_15px,#1f2937_16px_17px),repeating-linear-gradient(0deg,transparent_0_15px,#1f2937_16px_17px)]"></div>
                      {selectedTemplate === template.id && <span className="absolute top-1 right-1 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[4]" /></span>}
                      <span className="relative z-10 bg-white/90 border border-black px-1 text-[8px] font-black uppercase">{t(template.labelKey)}</span>
                    </button>
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
                    <button type="button" onClick={() => { pushHistory(); setElements([]); setElementPositions({}); setSelectedElement(null); setContextMenuElementId(null); }} className="flex items-center justify-center gap-2 border-2 border-black bg-white rounded-lg px-3 py-2 font-black text-[10px] uppercase text-red-600 hover:bg-red-50">
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
              <BackgroundLayer key={selectedTemplate} templateId={selectedTemplate} backgroundImage={backgroundImage} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
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
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                transformOrigin: '0 0',
                pointerEvents: 'auto'
              }}
              onPointerDown={handleWorldPointerDown}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-3 left-3 z-10 bg-white/90 border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                {t(activeTemplate.labelKey)}
              </div>

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
                const position = elementPositions[element.id];
                const isSelected = selectedElement === element.id;
                const isEditingText = editingTextId === element.id && element.type === 'text';

                return (
                  <div key={element.id}
                    className={`absolute flex items-center justify-center cursor-move select-none ${isSelected ? 'outline outline-2 outline-dashed outline-violet-500 bg-transparent' : 'hover:outline hover:outline-2 hover:outline-blue-400 bg-transparent'}`}
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
                    event.stopPropagation();
                    setSelectedElement(element.id);
                    setContextMenuElementId(element.id);
                  }} onDragOver={element.type === 'shape' ? (event) => event.preventDefault() : undefined}
                  onDrop={element.type === 'shape' ? (event) => addElementIntoShape(event, element) : undefined}
                  onPointerDown={(event) => {
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
                          points={element.points.map((p) => `${p.x - position.left},${p.y - position.top}`).join(' ')}
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
                  {liveDrawing.tool === 'rectangle' || liveDrawing.tool === 'circle' || liveDrawing.tool === 'grid' ? (
                    <rect x={0} y={0} width={Math.max(1, Math.abs(liveDrawing.maxX - liveDrawing.minX))} height={Math.max(1, Math.abs(liveDrawing.maxY - liveDrawing.minY))}
                      fill={liveDrawing.tool === 'grid' ? 'none' : 'none'}
                      stroke={drawingColor}
                      strokeWidth={4 / camera.scale}
                      strokeDasharray={liveDrawing.tool === 'grid' ? '6 6' : undefined}
                      rx={liveDrawing.tool === 'circle' ? '9999' : 0}
                    />
                  ) : (
                    <polyline
                      points={liveDrawing.points.map((p) => `${p.x - Math.min(liveDrawing.minX, liveDrawing.maxX)},${p.y - Math.min(liveDrawing.minY, liveDrawing.maxY)}`).join(' ')}
                      fill="none"
                      stroke={drawingColor}
                      strokeWidth={(liveDrawing.tool === 'highlight' ? 60 : 8) / camera.scale}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={liveDrawing.tool === 'highlight' ? 0.4 : 1}
                    />
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
            {['pen', 'highlight', 'rectangle', 'circle', 'grid'].includes(activeTool) ? t('editor.drawHint') : t('editor.panHint')}
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
              <div>
                {selectedData.isLocation ? (
                  <button type="button" onClick={() => { pushHistory(); setElements((prev) => prev.map((el) => el.id === selectedElement ? { ...el, isLocation: false } : el)); setLocationModalOpen(false); }} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-red-50 text-red-700 py-2 rounded text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-100 active:translate-y-0.5 active:shadow-none">
                    <X className="w-3.5 h-3.5" /> {t('editor.unmarkLocation')}
                  </button>
                ) : (
                  <button type="button" onClick={() => { pushHistory(); setElements((prev) => prev.map((el) => el.id === selectedElement ? { ...el, isLocation: true } : el)); setLocationModalOpen(true); }} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-emerald-400 text-black py-2 rounded text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-500 active:translate-y-0.5 active:shadow-none">
                    {t('editor.markAsLocation')}
                  </button>
                )}
              </div>

              {selectedData.isLocation && locationModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLocationModalOpen(false)}>
                  <div className="w-full max-w-md space-y-3 border-4 border-black p-5 bg-white rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)]" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-between border-b-2 border-black pb-3">
                      <h3 className="font-black text-sm uppercase text-red-600 flex items-center gap-1.5">📍 {t('editor.editLocation')}</h3>
                      <button type="button" onClick={() => setLocationModalOpen(false)} className="w-7 h-7 flex items-center justify-center border-2 border-black rounded bg-red-50 hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-1">{t('editor.locName')}</label>
                    <input type="text" value={selectedData.locationDetails?.name || ''} onChange={(e) => updateSelectedLocationData('name', e.target.value)} className="w-full px-2 py-1.5 border-2 border-black bg-white text-xs font-bold outline-none rounded" placeholder="Starting Town" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-1">{t('editor.locDescription')}</label>
                    <textarea value={selectedData.locationDetails?.description || ''} onChange={(e) => updateSelectedLocationData('description', e.target.value)} className="w-full h-16 px-2 py-1.5 border-2 border-black bg-white text-xs font-bold outline-none resize-none rounded" placeholder="Where the journey begins." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-1">{t('editor.locYoutube')}</label>
                    <input type="url" value={selectedData.locationDetails?.youtubeUrl || ''} onChange={(e) => updateSelectedLocationData('youtubeUrl', e.target.value)} className="w-full px-2 py-1.5 border-2 border-black bg-white text-xs font-bold outline-none rounded" placeholder="https://youtube.com/..." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-1">{t('editor.locOpen')}</label>
                      <input type="time" value={selectedData.locationDetails?.openTime || ''} onChange={(e) => updateSelectedLocationData('openTime', e.target.value)} className="w-full px-2 py-1.5 border-2 border-black bg-white text-[10px] font-bold outline-none rounded" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-1">{t('editor.locClose')}</label>
                      <input type="time" value={selectedData.locationDetails?.closeTime || ''} onChange={(e) => updateSelectedLocationData('closeTime', e.target.value)} className="w-full px-2 py-1.5 border-2 border-black bg-white text-[10px] font-bold outline-none rounded" />
                    </div>
                  </div>
                    <button type="button" onClick={() => setLocationModalOpen(false)} className="w-full bg-amber-400 border-2 border-black mt-1 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-500 active:translate-y-0.5 active:shadow-none transition-all rounded">{t('editor.saveLocation')}</button>
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
                      <button type="button" onClick={() => updateSelectedTextStyle({ fontWeight: (selectedData.fontWeight ?? 900) > 400 ? 400 : 900 })} className={`px-3 py-2 border-2 border-black rounded font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedData.fontWeight && selectedData.fontWeight > 400 ? 'bg-gray-900 text-white' : 'bg-yellow-200 text-black'}`}>
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedElement(loc.id); }} className="p-1 hover:bg-gray-100 rounded border border-transparent hover:border-black"><Pencil className="w-3 h-3 text-blue-600" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); pushHistory(); setElements(prev => prev.map(el => el.id === loc.id ? { ...el, isLocation: false, locationDetails: undefined } : el)); if (selectedElement === loc.id) setSelectedElement(null); }} className="p-1 hover:bg-red-50 rounded border border-transparent hover:border-black" title={t('editor.unmarkLocationTitle')}><X className="w-3 h-3 text-red-600" /></button>
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
