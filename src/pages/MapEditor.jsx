import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check,
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Grid3X3,
  Share2, MessageCircle, Smartphone, Copy, X, Lock, Unlock, RotateCw, Video
} from 'lucide-react';

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
  { content: '📍', labelKey: 'editor.elemPin' },
  { content: '☀️', labelKey: 'editor.elemSun' },
  { content: '🌊', labelKey: 'editor.elemWater' },
  { content: '🔥', labelKey: 'editor.elemCampfire' },
  { content: '⭐', labelKey: 'editor.elemStar' }
];

const textPresets = [
  { labelKey: 'editor.textHeading', contentKey: 'editor.textHeadingContent', fontSize: 32, fontWeight: 900 },
  { labelKey: 'editor.textSubheading', contentKey: 'editor.textSubheadingContent', fontSize: 22, fontWeight: 700 },
  { labelKey: 'editor.textBody', contentKey: 'editor.textBodyContent', fontSize: 16, fontWeight: 400 }
];

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
  const { t, publishMapToCommunity, editorSetup } = useApp();
  const [activeTab, setActiveTab] = useState('TEMPLATES');
  const [selectedElement, setSelectedElement] = useState('tree'); // 'tree', 'chest', null
  const [zoom, setZoom] = useState(100);
  const [selectedTemplate, setSelectedTemplate] = useState('tropical');
  const [elements, setElements] = useState([
    { id: 'tree', type: 'emoji', labelKey: 'editor.ancientTree', content: '🌳' },
    { id: 'chest', type: 'emoji', labelKey: 'editor.woodenChest', content: '🧰' }
  ]);
  const [elementPositions, setElementPositions] = useState({
    tree: { left: 200, top: 150, width: 128, height: 128 },
    chest: { left: 500, top: 350, width: 64, height: 64 }
  });
  const [dragging, setDragging] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTool, setActiveTool] = useState('select');
  const [drawingColor, setDrawingColor] = useState('#111111');
  const [mapTitle, setMapTitle] = useState(() => editorSetup?.title || t('editor.untitledMap'));
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishDescription, setPublishDescription] = useState(() => editorSetup?.description || '');
  const [publishTags, setPublishTags] = useState(() => editorSetup?.tags?.join(', ') || '');
  const [publishPrivacy, setPublishPrivacy] = useState(() => editorSetup?.privacy || 'public');
  const [publishVideoUrl, setPublishVideoUrl] = useState(() => editorSetup?.videoUrl || '');
  const [publishVideoError, setPublishVideoError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [contextMenuElementId, setContextMenuElementId] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const nextElementId = useRef(0);

  const getElementLabel = (element) => (element.labelKey ? t(element.labelKey) : element.label);

  const pushHistory = () => {
    setHistory((previous) => [...previous, { elements, elementPositions }]);
    setFuture([]);
  };

  useEffect(() => {
    if (!dragging) return undefined;

    const handlePointerMove = (event) => {
      const scale = zoom / 100;
      const deltaX = (event.clientX - dragging.startX) / scale;
      const deltaY = (event.clientY - dragging.startY) / scale;

      setElementPositions((previous) => {
        const element = previous[dragging.id];
        const maxLeft = 800 - element.width;
        const maxTop = 600 - element.height;

        if (dragging.mode === 'resize') {
          const nextWidth = Math.max(40, Math.min(800 - element.left, dragging.startWidth + deltaX));
          const nextHeight = Math.max(40, Math.min(600 - element.top, dragging.startHeight + deltaY));
          return { ...previous, [dragging.id]: { ...element, width: nextWidth, height: nextHeight } };
        }

        return {
          ...previous,
          [dragging.id]: {
            ...element,
            left: Math.max(0, Math.min(maxLeft, dragging.startLeft + deltaX)),
            top: Math.max(0, Math.min(maxTop, dragging.startTop + deltaY))
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
  }, [dragging, zoom]);

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

  const startDragging = (elementId, event, mode = 'move') => {
    event.stopPropagation();
    const position = elementPositions[elementId];
    pushHistory();
    setSelectedElement(elementId);
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
    setElementPositions((previous) => ({
      ...previous,
      [selectedElement]: {
        ...previous[selectedElement],
        [property]: Math.max(property === 'width' || property === 'height' ? 40 : 0, numericValue)
      }
    }));
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
    localStorage.setItem('pocket_odyssey_editor_draft', JSON.stringify({ elements, elementPositions, selectedTemplate }));
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

    const publishedPins = elements.map((element) => {
      const position = elementPositions[element.id];
      return {
        id: `editor-${element.id}`,
        title: getElementLabel(element),
        top: `${Math.round(((position.top + position.height / 2) / 600) * 100)}%`,
        left: `${Math.round(((position.left + position.width / 2) / 800) * 100)}%`,
        icon: element.type === 'image' ? '🖼️' : element.type === 'text' ? '📝' : element.content,
        category: 'landmarks',
        lore: element.type === 'text' ? element.content : t('editor.addedLore', { name: getElementLabel(element) })
      };
    });

    const mapData = {
      title: mapTitle.trim() || t('editor.untitledMap'),
      region: t('editor.realm', { name: t(activeTemplate.labelKey) }),
      description: publishDescription.trim() || t('editor.generatingDesc', { name: t(activeTemplate.labelKey) }),
      imageUrl: null,
      videoUrl: videoUrl.startsWith('data:video/') ? videoUrl : getYouTubeEmbedUrl(videoUrl),
      previewBackground: activeTemplate.canvas,
      isEditorMap: true,
      hours: editorSetup?.hours || '24/7',
      fee: editorSetup?.fee || t('editor.freeExploration'),
      bestTime: editorSetup?.bestTime || t('editor.anytime'),
      travel: editorSetup?.travel || t('editor.communityGateway'),
      logs: editorSetup?.logs || [],
      tags: publishTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      privacy: publishPrivacy,
      pins: publishedPins
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
          fontSize: element.fontSize ?? 28,
          fontWeight: element.fontWeight ?? 900,
          color: colorValue
        }
      : { color: colorValue };
    setElements((previous) => [...previous, { ...element, ...textStyles, id, color: colorValue }]);
    setElementPositions((previous) => ({
      ...previous,
      [id]: { left: 330, top: 220, width: element.type === 'text' ? 220 : 100, height: element.type === 'text' ? 70 : 100 }
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
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addElement({ type: 'image', label: file.name, content: reader.result });
    reader.readAsDataURL(file);
    event.target.value = '';
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

  const selectedData = elements.find((element) => element.id === selectedElement);
  const selectedPosition = selectedElement ? elementPositions[selectedElement] : null;
  const contextMenuElement = contextMenuElementId ? elements.find((element) => element.id === contextMenuElementId) : null;
  const selectionToolbarStyle = selectedPosition ? {
    top: Math.max(10, selectedPosition.top - 50),
    left: Math.max(10, Math.min(selectedPosition.left + selectedPosition.width / 2 - 72, 660))
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
    left: Math.max(20, Math.min(contextMenuPosition.left, 650))
  } : {};
  const activeTemplate = mapTemplates.find((template) => template.id === selectedTemplate);
  const selectTemplate = (templateId) => setSelectedTemplate(templateId);

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
          <div className="p-5 space-y-4">
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
            )}
            {activeTab === 'ELEMENTS' && (
              <div className="grid grid-cols-2 gap-3">
                {elementOptions.map((item) => (
                  <button key={item.labelKey} onClick={() => addElement({ type: 'emoji', labelKey: item.labelKey, content: item.content })} className="aspect-square bg-gray-50 border-2 border-black rounded hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                    <span className="text-3xl">{item.content}</span>
                    <span className="text-[9px] font-black mt-1 uppercase">{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'TEXT' && (
              <div className="space-y-3">
                {textPresets.map((preset) => (
                  <button key={preset.labelKey} onClick={() => addElement({ type: 'text', labelKey: preset.labelKey, content: t(preset.contentKey), fontSize: preset.fontSize, fontWeight: preset.fontWeight })} className="w-full border-2 border-black bg-white p-3 text-left hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ fontSize: `${preset.fontSize}px`, fontWeight: preset.fontWeight }}>{t(preset.contentKey)}</button>
                ))}
              </div>
            )}
            {activeTab === 'UPLOADS' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-black bg-[#4895ef] text-white p-3 font-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600">{t('editor.uploadFile')}</button>
                <p className="text-[10px] text-gray-500 font-bold">{t('editor.uploadInstruction')}</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER CANVAS AREA */}
        <div 
          className="flex-1 relative overflow-hidden bg-[#e5e5e5]"
          style={{ backgroundImage: 'radial-gradient(#9ca3af 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
          onClick={() => setSelectedElement(null)}
        >
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
          {/* Zoom Control */}
          <div className="absolute bottom-6 right-6 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center text-xs font-black p-1 z-20">
            <button className="w-6 h-6 hover:bg-gray-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setZoom(Math.max(50, zoom - 10)); }}>-</button>
            <span className="w-12 text-center">{zoom}%</span>
            <button className="w-6 h-6 hover:bg-gray-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setZoom(Math.min(200, zoom + 10)); }}>+</button>
          </div>

          {/* Actual Canvas */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-12">
            <div 
              className="border-4 border-black relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden"
              style={{ width: '800px', height: '600px', transform: `scale(${zoom / 100})`, transformOrigin: 'center', ...activeTemplate.canvas }}
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
                <div className="absolute z-30 w-56 rounded-xl border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={quickActionMenuStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-wide text-gray-500">{t('editor.actions')}</span>
                    <button onClick={() => setContextMenuElementId(null)} className="flex h-5 w-5 items-center justify-center rounded-full border border-black bg-gray-100 text-[10px] font-black">×</button>
                  </div>
                  <div className="space-y-1.5">
                    <button onClick={() => { duplicateSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⧉</span>{t('editor.duplicate')}</span>
                    </button>
                    <button onClick={() => { moveLayer('front'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⇡</span>{t('editor.bringFront')}</span>
                    </button>
                    <button onClick={() => { moveLayer('back'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⇣</span>{t('editor.sendBack')}</span>
                    </button>
                    <button onClick={() => { toggleLockSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">{selectedData?.locked ? '🔓' : '🔒'}</span>{t(selectedData?.locked ? 'editor.unlock' : 'editor.lock')}</span>
                    </button>
                    <button onClick={() => { deleteSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-red-50 text-red-600">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">🗑</span>{t('editor.delete')}</span>
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
                            fontSize: `${element.fontSize ?? 28}px`,
                            fontWeight: element.fontWeight ?? 900,
                            lineHeight: 1.2,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            color: element.color ?? drawingColor ?? '#111111'
                          }}
                        />
                      ) : (
                        <span className="filter drop-shadow-md px-2 text-center flex items-center justify-center w-full h-full" style={{ fontSize: `${Math.max(12, Math.min(120, Math.round(Math.min(position.width, position.height) * 0.7)))}px`, fontWeight: element.fontWeight ?? 900, whiteSpace: 'pre-wrap', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'break-word', color: element.color ?? drawingColor ?? '#111111' }}>{element.content}</span>
                      )
                    )}
                    {isSelected && !isEditingText && <>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-violet-500 cursor-nwse-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-violet-500 cursor-nesw-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-violet-500 cursor-nesw-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-violet-500 cursor-nwse-resize"></div>
                      <button type="button" title={t('editor.rotate')} onClick={(event) => { event.stopPropagation(); rotateSelectedElement(); }} className="absolute left-1/2 -translate-x-1/2 -bottom-7 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-violet-50">
                        <RotateCw className="w-3 h-3 text-violet-600" />
                      </button>
                    </>}
                  </div>
                );
              })}
            </div>
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
                    <textarea value={selectedData.content} onChange={(event) => setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, content: event.target.value } : element))} className="w-full min-h-20 px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none resize-y" />
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
