import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from 'react-konva';
import { useApp } from '../context/AppContext';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check,
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Grid3X3,
  Share2, MessageCircle, Smartphone, Copy, X, Lock, Unlock, RotateCw, Video, Camera, Image as ImageIcon, Maximize
} from 'lucide-react';
import useCanvasControls from '../hooks/useCanvasControls';
import BackgroundLayer from '../components/editor/BackgroundLayer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ELEMENT_SIZE, MIN_ZOOM, MAX_ZOOM, clampValue, scaleElementPositions, scaleElementFontSizes } from '../lib/editorCanvas';

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
  { id: 'TEMPLATES', icon: LayoutGrid, labelKey: 'editor.templates' },
  { id: 'ELEMENTS', icon: Shapes, labelKey: 'editor.elements' },
  { id: 'TEXT', icon: Type, labelKey: 'editor.text' },
  { id: 'UPLOADS', icon: Upload, labelKey: 'editor.uploads' }
];

const tabLabelKeys = {
  TEMPLATES: 'editor.templates',
  ELEMENTS: 'editor.elements',
  TEXT: 'editor.text',
  UPLOADS: 'editor.uploads'
};

const mapTemplates = [
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
  }
];

const privacyOptions = [
  { value: 'public', labelKey: 'editor.public', descKey: 'editor.publicDesc' },
  { value: 'unlisted', labelKey: 'editor.unlisted', descKey: 'editor.unlistedDesc' },
  { value: 'private', labelKey: 'editor.private', descKey: 'editor.privateDesc' }
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
  { labelKey: 'editor.textHeading', contentKey: 'editor.textHeadingContent', fontSize: 56, fontWeight: 900 },
  { labelKey: 'editor.textSubheading', contentKey: 'editor.textSubheadingContent', fontSize: 36, fontWeight: 700 },
  { labelKey: 'editor.textBody', contentKey: 'editor.textBodyContent', fontSize: 26, fontWeight: 400 }
];

const MAX_TEXT_FONT_SIZE = 64;
const normalizeElementFont = (element) => {
  if (element.type !== 'text' || typeof element.fontSize !== 'number') return element;
  if (element.fontSize > MAX_TEXT_FONT_SIZE) {
    return { ...element, fontSize: MAX_TEXT_FONT_SIZE };
  }
  return element;
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
const { t, publishMapToCommunity, editorSetup, userProfile, saveEditorMapState, registerEditorDraft } = useApp();
  const [mapId] = useState(() => editorSetup?.id || 'comm-user-draft-new');
  const [savedEditorState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pocket_odyssey_editorSaves')) || {};
      return editorSetup?.editorState || saved[mapId] || null;
    } catch {
      return editorSetup?.editorState || null;
    }
  });
  const [activeTab, setActiveTab] = useState('TEMPLATES');
  const [selectedElement, setSelectedElement] = useState('tree'); // 'tree', 'chest', null
  const [selectedTemplate, setSelectedTemplate] = useState(() => savedEditorState?.selectedTemplate || 'tropical');
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
  const [backgroundImage, setBackgroundImage] = useState(() => (typeof savedEditorState?.backgroundImage === 'string' && savedEditorState.backgroundImage) || '');
  const [ready, setReady] = useState(false);
  const [elements, setElements] = useState(() => (Array.isArray(savedEditorState?.elements)
    ? scaleElementFontSizes(savedEditorState.elements).map((element) => normalizeElementFont(element))
    : [
        { id: 'tree', type: 'emoji', labelKey: 'editor.ancientTree', content: '🌳' },
        { id: 'chest', type: 'emoji', labelKey: 'editor.woodenChest', content: '🧰' }
      ]));
  const [elementPositions, setElementPositions] = useState(() => scaleElementPositions(savedEditorState?.elementPositions) || {
    tree: { left: 1000, top: 750, width: 640, height: 640 },
    chest: { left: 2500, top: 1750, width: 320, height: 320 }
  });
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [contextMenuElementId, setContextMenuElementId] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedUploads, setSelectedUploads] = useState([]);
  const [customElements, setCustomElements] = useState([]);
  const [elementUploadError, setElementUploadError] = useState('');
  const fileInputRef = useRef(null);
  const elementImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const selfieInputRef = useRef(null);
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
    // keep legacy single for backwards compat
    publishSelfieUrl: publishSelfieUrls[0] || ''
  };

  const persistEditorStateToStore = useCallback((id, state) => {
    if (!id) return;
    const snapshot = { ...state, updatedAt: Date.now() };
    try {
      const key = 'pocket_odyssey_editorSaves';
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

  useEffect(() => {
    const handleDeleteKey = (event) => {
      if (!selectedElement || (event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement)) return;
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

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBackgroundImage(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const clearBackground = () => setBackgroundImage('');

  const handleWorldPointerDown = (event) => {
    setContextMenuElementId(null);
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
        publishSelfieUrl: publishSelfieUrls[0] || ''
      });
      setAutosaveStatus('Saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [elements, elementPositions, selectedTemplate, backgroundImage, mapTitle, publishDescription, publishTags, publishPrivacy, publishVideoUrl, publishSelfieUrls, mapId]);

  const startDragging = (elementId, event, mode = 'move') => {
    event.stopPropagation();
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

  const setOverlay = (color) => {
    if (!selectedElement) return;
    pushHistory();
    setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, overlay: color } : element));
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
        left: Math.min(position.left + 24, 760),
        top: Math.min(position.top + 24, 540),
        width: position.width,
        height: position.height
      }
    }));
    setSelectedElement(duplicateId);
  };

  const rotateSelectedElement = () => {
    if (!selectedElement) return;
    setElements((previous) => previous.map((element) => element.id === selectedElement
      ? { ...element, rotation: ((element.rotation ?? 0) + 15) % 360 }
      : element));
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

  const saveDraft = () => {
persistEditorStateToStore(mapId, editorDraftState);
    setSaveStatus(t('editor.statusDraftSaved'));
  };

  const publishMap = () => {
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

    const publishedPins = elements.map((element) => {
      const position = elementPositions[element.id];
      return {
        id: `editor-${element.id}`,
        title: getElementLabel(element),
        top: `${Math.round(((position.top + position.height / 2) / CANVAS_HEIGHT) * 100)}%`,
        left: `${Math.round(((position.left + position.width / 2) / CANVAS_WIDTH) * 100)}%`,
        icon: element.type === 'image' ? '🖼️' : element.type === 'text' ? '📝' : element.content,
        category: 'landmarks',
        lore: element.type === 'text' ? element.content : t('editor.addedLore', { name: getElementLabel(element) })
      };
    });

    const mapData = {
id: mapId,
      title: mapTitle.trim() || t('editor.untitledMap'),
      region: editorSetup?.locationCity || editorSetup?.region || t('editor.realm', { name: t(activeTemplate.labelKey) }),
      description: publishDescription.trim() || t('editor.generatingDesc', {
        user: userProfile?.name || 'a TravelCraft traveler',
        name: t(activeTemplate.labelKey)
      }),
      imageUrl: editorSetup?.imageUrl || null,
      videoUrl: videoUrl.startsWith('data:video/') ? videoUrl : getYouTubeEmbedUrl(videoUrl),
      previewBackground: activeTemplate.canvas,
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
      localStorage.setItem('pocket_odyssey_editor_draft', JSON.stringify({ elements, elementPositions, selectedTemplate, ...mapData }));
      setSaveStatus(t('editor.statusPrivateSaved'));
      setShowPublishModal(false);
      return;
    }

    publishMapToCommunity(mapData);
    setSaveStatus(t('editor.statusPublished'));
    setShowPublishModal(false);
  };

  const shareUrl = window.location.href;
  const shareTitle = t('editor.shareTitle');
  const openShareLink = (url) => {
    const shareWindow = window.open(url, '_blank');
    if (!shareWindow) setSaveStatus(t('editor.sharePopupRequired'));
  };
  const copyShareLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const helper = document.createElement('textarea');
        helper.value = shareUrl;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      setCopied(true);
      setSaveStatus(t('editor.linkCopied'));
      setTimeout(() => setCopied(false), 1800);
    } catch {
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
    pushHistory();
    nextElementId.current += 1;
    const id = `${element.type}-${nextElementId.current}`;
    const colorValue = element.color ?? drawingColor ?? '#111111';
    const textStyles = element.type === 'text'
      ? {
          fontSize: element.fontSize ?? 32,
          fontWeight: element.fontWeight ?? 900,
          color: colorValue
        }
      : { color: colorValue };
    setElements((previous) => [...previous, { ...element, ...textStyles, id, color: colorValue }]);
    const width = element.type === 'text' ? 400 : 500;
    const height = element.type === 'text' ? 140 : 500;
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

  const updateSelectedTextStyle = (updates) => {
    if (!selectedElement) return;
    setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, ...updates } : element));
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
    const toolElements = {
      pen: { type: 'shape', shape: 'line', labelKey: 'editor.drawLine', content: '', color: drawingColor },
      highlight: { type: 'shape', shape: 'highlight', labelKey: 'editor.highlight', content: '', color: drawingColor },
      rectangle: { type: 'shape', shape: 'rectangle', labelKey: 'editor.rectangle', content: '', color: drawingColor },
      circle: { type: 'shape', shape: 'circle', labelKey: 'editor.circle', content: '', color: drawingColor },
      grid: { type: 'shape', shape: 'grid', labelKey: 'editor.grid', content: '', color: drawingColor }
    };
    if (toolElements[tool]) {
      setActiveTool(tool);
      addElement(toolElements[tool]);
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

  const handleElementUpload = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    let hasInvalid = false;
    files.forEach((file) => {
      if (file.type !== 'image/png') {
        hasInvalid = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        nextElementId.current += 1;
        const id = `custom-el-${nextElementId.current}`;
        const content = reader.result;
        setCustomElements((previous) => [...previous, { id, label: file.name, content }]);
        setElementUploadError('');
      };
      reader.readAsDataURL(file);
    });
    if (hasInvalid) setElementUploadError(t('editor.pngOnly'));
  };

  const addCustomElement = (item) => {
    addElement({ type: 'image', label: item.label, content: item.content });
  };

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

  const selectedData = elements.find((element) => element.id === selectedElement);
  const selectedPosition = selectedElement ? elementPositions[selectedElement] : null;
  const contextMenuElement = contextMenuElementId ? elements.find((element) => element.id === contextMenuElementId) : null;
  const selectionToolbarStyle = selectedPosition ? {
    top: Math.max(10, selectedPosition.top - 50),
    left: Math.max(10, Math.min(selectedPosition.left + selectedPosition.width / 2, CANVAS_WIDTH - 20)),
    transform: `translateX(-50%) scale(${1 / camera.scale})`,
    transformOrigin: 'top center'
  } : {};
  const getShapeStyle = (element) => {
    const color = element.color ?? drawingColor ?? '#111111';

    if (element.shape === 'line') {
      return { borderTop: `4px solid ${color}`, background: 'transparent', borderColor: color };
    }

    if (element.shape === 'highlight') {
      return {
        backgroundColor: `${color}55`,
        border: `2px solid ${color}`,
        boxShadow: `inset 0 0 0 1px ${color}`
      };
    }

    if (element.shape === 'rectangle') {
      return { border: `4px solid ${color}`, background: 'transparent', borderColor: color };
    }

    if (element.shape === 'circle') {
      return { border: `4px solid ${color}`, borderRadius: '9999px', background: 'transparent', borderColor: color };
    }

    if (element.shape === 'grid') {
      return {
        backgroundImage: `linear-gradient(90deg, transparent 9px, ${color} 10px), linear-gradient(transparent 9px, ${color} 10px)`,
        backgroundSize: '10px 10px',
        backgroundColor: 'transparent'
      };
    }

    return { borderColor: color };
  };
  const contextMenuPosition = contextMenuElementId ? elementPositions[contextMenuElementId] : null;
  const quickActionMenuStyle = contextMenuElement && contextMenuPosition ? {
    top: Math.max(20, contextMenuPosition.top + contextMenuPosition.height + 10),
    left: Math.max(20, Math.min(contextMenuPosition.left, CANVAS_WIDTH - 240)),
    transform: `scale(${1 / camera.scale})`,
    transformOrigin: 'top left'
  } : {};
  const activeTemplate = mapTemplates.find((template) => template.id === selectedTemplate);
  const selectTemplate = (templateId) => setSelectedTemplate(templateId);

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
        </div>
      </header>
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
            <div>
              <label htmlFor="publish-tags" className="block text-xs font-black uppercase mb-1.5">{t('editor.tags')}</label>
              <input id="publish-tags" value={publishTags} onChange={(event) => setPublishTags(event.target.value)} placeholder={t('editor.tagsPh')} className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
              <p className="mt-1 text-[10px] text-gray-500 font-bold">{t('editor.tagsHelp')}</p>
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
            </fieldset>
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button type="button" onClick={() => setShowPublishModal(false)} className="px-4 py-2 border-2 border-black rounded font-black text-xs uppercase hover:bg-gray-100">{t('editor.cancel')}</button>
              <button type="submit" className="px-4 py-2 bg-[#cc0000] text-white border-2 border-black rounded font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{t('editor.publishMap')}</button>
            </div>
          </div>
        </form>
      </div>}

      {/* EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT MENU STRIP */}
        <div className="w-20 bg-white border-r-4 border-black flex flex-col items-center py-4 gap-2 z-10 shrink-0">
          {editorTabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={t(tab.labelKey)}
              aria-label={t(tab.labelKey)}
              className={`flex items-center justify-center w-14 h-14 rounded-lg border-2 transition-all ${activeTab === tab.id ? 'border-black bg-gray-100 text-[#cc0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-black'}`}
            >
              <tab.icon className={`w-7 h-7 ${activeTab === tab.id ? 'fill-red-100' : ''}`} />
            </button>
          ))}
        </div>

        {/* LEFT PANEL CONTENT */}
        <div className="w-64 bg-white border-r-4 border-black flex flex-col z-10 shadow-[4px_0_0_0_rgba(0,0,0,1)] shrink-0 hidden md:flex">
          <div className="p-4 border-b-2 border-black">
            <h2 className="font-black text-sm uppercase">{t(tabLabelKeys[activeTab])}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'TEMPLATES' && (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {mapTemplates.map((template) => (
                    <button key={template.id} type="button" onClick={() => selectTemplate(template.id)} aria-pressed={selectedTemplate === template.id} className={`aspect-square border-2 border-black rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform flex flex-col items-center justify-end p-2 relative overflow-hidden ${selectedTemplate === template.id ? 'ring-4 ring-[#4895ef] ring-offset-2' : ''}`}>
                      <div className="absolute inset-0" style={{ background: template.preview }}></div>
                      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0_15px,#1f2937_16px_17px),repeating-linear-gradient(0deg,transparent_0_15px,#1f2937_16px_17px)]"></div>
                      {selectedTemplate === template.id && <span className="absolute top-1 right-1 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[4]" /></span>}
                      <span className="relative z-10 bg-white/90 border border-black px-1 text-[8px] font-black uppercase">{t(template.labelKey)}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t-2 border-black pt-3">
                  <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                  <button type="button" onClick={() => backgroundInputRef.current?.click()} className={`w-full border-2 border-black font-black text-[10px] uppercase rounded px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 flex items-center justify-center gap-1.5 ${backgroundImage ? 'bg-amber-300' : 'bg-white'}`}>
                    <Upload className="w-3.5 h-3.5" /> {t('editor.uploadBackground')}
                  </button>
                  {backgroundImage && (
                    <button type="button" onClick={clearBackground} className="w-full border-2 border-black bg-white font-black text-[10px] uppercase rounded px-3 py-2 hover:bg-red-50 text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> {t('editor.clearBackground')}
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.backgroundHelper')}</p>
                </div>
              </div>
            )}
            {activeTab === 'ELEMENTS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {elementOptions.map((item) => (
                    <button key={item.labelKey} onClick={() => addElement({ type: 'emoji', labelKey: item.labelKey, content: item.content })} className="aspect-square bg-gray-50 border-2 border-black rounded hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                      <span className="text-3xl">{item.content}</span>
                      <span className="text-[9px] font-black mt-1 uppercase">{t(item.labelKey)}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 space-y-2 border-t-2 border-black pt-3">
                  <input ref={elementImageInputRef} type="file" accept=".png,image/png" multiple onChange={handleElementUpload} className="hidden" />
                  <button type="button" onClick={() => elementImageInputRef.current?.click()} className="w-full border-2 border-black bg-white font-black text-[10px] uppercase rounded px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> {t('editor.uploadPngElement')}
                  </button>
                  {elementUploadError && (
                    <p className="text-[10px] text-red-600 font-black">{elementUploadError}</p>
                  )}
                  {customElements.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {customElements.map((item) => (
                        <button key={item.id} type="button" onClick={() => addCustomElement(item)} title={item.label} className="relative aspect-square bg-gray-50 border-2 border-black rounded hover:bg-amber-100 hover:ring-4 hover:ring-[#4895ef] hover:ring-offset-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <img src={item.content} alt={item.label} className="w-full h-full object-contain" />
                          <span className="absolute bottom-0 inset-x-0 bg-white/90 border-t border-black text-[8px] font-black uppercase px-1 py-0.5 truncate">{item.label}</span>
                        </button>
                      ))}
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
                        <div key={file.id} className={`relative border-2 rounded overflow-hidden aspect-square group ${isSelected ? 'border-[#4895ef] ring-4 ring-[#4895ef] ring-offset-1' : 'border-black'}`}>
                          <button type="button" onClick={() => toggleUploadSelection(file.id)} title={file.label} className="w-full h-full cursor-pointer">
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
          </div>
        </div>

        {/* CENTER CANVAS AREA */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-hidden bg-[#e5e5e5]"
          style={{ backgroundImage: 'radial-gradient(#9ca3af 1.5px, transparent 1.5px)', backgroundSize: '32px 32px', cursor: isPanning ? 'grabbing' : 'grab' }}
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
              <BackgroundLayer templateId={selectedTemplate} backgroundImage={backgroundImage} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
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
                <div className="absolute z-40 flex items-center gap-1 rounded-full border-2 border-black bg-white px-1.5 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" style={selectionToolbarStyle}>
                  <button type="button" title={t('editor.move')} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); setActiveTool('select'); }}>
                    <MousePointer2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title={t(selectedData.locked ? 'editor.unlock' : 'editor.lock')} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); toggleLockSelectedElement(); }}>
                    {selectedData.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" title={t('editor.duplicate')} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-gray-100" onClick={(event) => { event.stopPropagation(); duplicateSelectedElement(); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title={t('editor.deleteSelected')} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-red-50 text-red-600" onClick={(event) => { event.stopPropagation(); deleteSelectedElement(); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                  <div key={element.id} className={`absolute flex items-center justify-center cursor-move select-none ${isSelected ? 'outline outline-2 outline-dashed outline-violet-500 bg-transparent' : 'hover:outline hover:outline-2 hover:outline-blue-400 bg-transparent'}`} style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px`, height: `${position.height}px`, backgroundColor: element.overlay ? `${element.overlay}00` : 'transparent', opacity: 1, transform: `rotate(${element.rotation ?? 0}deg)` }} onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedElement(element.id);
                    setContextMenuElementId(element.id);
                  }} onPointerDown={(event) => {
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
                    {element.type === 'image' ? <img src={element.content} alt={getElementLabel(element)} className="w-full h-full object-contain pointer-events-none" /> : element.type === 'shape' ? <div className="w-full h-full pointer-events-none" style={getShapeStyle(element)} /> : (
                      isEditingText ? (
                        <textarea
                          autoFocus
                          value={element.content}
                          onChange={(event) => setElements((previous) => previous.map((item) => item.id === element.id ? { ...item, content: event.target.value } : item))}
                          onBlur={() => setEditingTextId(null)}
                          onPointerDown={(event) => event.stopPropagation()}
                          className="w-full h-full bg-transparent border-none outline-none resize-none p-2 text-center"
                          style={{
                            fontSize: `${element.fontSize ?? 32}px`,
                            fontWeight: element.fontWeight ?? 900,
                            lineHeight: 1.2,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            color: element.color ?? drawingColor ?? '#111111'
                          }}
                        />
                      ) : (
                        <span className="filter drop-shadow-md px-2 text-center flex items-center justify-center w-full h-full overflow-hidden" style={{ fontSize: element.type === 'emoji' ? `${Math.min(position.width, position.height) * 0.8}px` : `${element.fontSize ?? 32}px`, fontWeight: element.fontWeight ?? 900, whiteSpace: 'pre-wrap', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'break-word', color: element.color ?? drawingColor ?? '#111111' }}>{element.content}</span>
                      )
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
            </div>
          </div>

          {/* Drawing tools + color */}
          <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-white border-2 border-black rounded-xl p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                {drawingTools.map(([tool, Icon, labelKey]) => (
                  <button key={tool} onClick={(event) => { event.stopPropagation(); handleToolAction(tool); }} title={t(labelKey)} className={`w-9 h-9 flex items-center justify-center rounded-lg ${activeTool === tool ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-2 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <span className="text-[8px] font-black uppercase text-gray-700">{t('editor.color')}</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-black overflow-hidden bg-white">
                  <input type="color" value={drawingColor} onChange={(event) => setDrawingColor(event.target.value)} className="h-full w-full cursor-pointer border-0 bg-transparent p-0" title={t('editor.chooseColor')} />
                </span>
              </label>
            </div>
          </div>

          {/* Pan hint */}
          <div className="absolute bottom-6 left-6 z-20 bg-white/85 border-2 border-black rounded px-2.5 py-1 text-[9px] font-black uppercase text-gray-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
            {t('editor.panHint')}
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
        <div className="w-72 bg-white border-l-4 border-black flex flex-col z-10 shadow-[-4px_0_0_0_rgba(0,0,0,1)] shrink-0 hidden xl:flex">
          <div className="p-4 border-b-2 border-black flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <h2 className="font-black text-sm uppercase">{t('editor.properties')}</h2>
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

              {/* Color Overlay */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">{t('editor.colorOverlay')}</label>
                <div className="flex gap-2">
                  {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#fbbf24'].map((color) => <button key={color} onClick={() => setOverlay(color)} title={t('editor.overlayColor', { color })} className="w-6 h-6 rounded-full border-2 border-black cursor-pointer hover:scale-110" style={{ backgroundColor: color }} />)}
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
        </div>
      </div>
    </div>
  );
}
