import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check,
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Grid3X3,
  Share2, MessageCircle, Smartphone, Copy, X
} from 'lucide-react';

export default function MapEditor({ onBack }) {
  const { publishMapToCommunity, editorSetup } = useApp();
  const [activeTab, setActiveTab] = useState('TEMPLATES');
  const [selectedElement, setSelectedElement] = useState('tree'); // 'tree', 'chest', null
  const [zoom, setZoom] = useState(100);
  const [selectedTemplate, setSelectedTemplate] = useState('tropical');
  const [elements, setElements] = useState([
    { id: 'tree', type: 'emoji', label: 'Ancient Tree', content: '🌳' },
    { id: 'chest', type: 'emoji', label: 'Wooden Chest', content: '🧰' }
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
  const [mapTitle, setMapTitle] = useState(() => editorSetup?.title || 'Untitled Map');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishDescription, setPublishDescription] = useState(() => editorSetup?.description || '');
  const [publishTags, setPublishTags] = useState(() => editorSetup?.tags?.join(', ') || '');
  const [publishPrivacy, setPublishPrivacy] = useState(() => editorSetup?.privacy || 'public');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);
  const [contextMenuElementId, setContextMenuElementId] = useState(null);
  const fileInputRef = useRef(null);
  const nextElementId = useRef(0);

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

    setElements((previous) => [...previous, { ...source, id: duplicateId, label: `${source.label} Copy` }]);
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
    setSaveStatus('Draft saved');
  };

  const publishMap = () => {
    const publishedPins = elements.map((element) => {
      const position = elementPositions[element.id];
      return {
        id: `editor-${element.id}`,
        title: element.label,
        top: `${Math.round(((position.top + position.height / 2) / 600) * 100)}%`,
        left: `${Math.round(((position.left + position.width / 2) / 800) * 100)}%`,
        icon: element.type === 'image' ? '🖼️' : element.type === 'text' ? '📝' : element.content,
        category: 'landmarks',
        lore: element.type === 'text' ? element.content : `${element.label} added to this custom map.`
      };
    });

    const mapData = {
      title: mapTitle.trim() || 'Untitled Map',
      region: `${activeTemplate.label} Realm`,
      description: publishDescription.trim() || `A custom map created with the ${activeTemplate.label} template.`,
      hours: editorSetup?.hours || '24/7',
      fee: editorSetup?.fee || 'Free Exploration',
      bestTime: editorSetup?.bestTime || 'Anytime',
      travel: editorSetup?.travel || 'Community Gateway',
      logs: editorSetup?.logs || [],
      tags: publishTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      privacy: publishPrivacy,
      pins: publishedPins
    };

    if (publishPrivacy === 'private') {
      localStorage.setItem('pocket_odyssey_editor_draft', JSON.stringify({ elements, elementPositions, selectedTemplate, ...mapData }));
      setSaveStatus('Private draft saved');
      setShowPublishModal(false);
      return;
    }

    publishMapToCommunity(mapData);
    setShowPublishModal(false);
  };

  const shareUrl = window.location.href;
  const shareTitle = 'My Pocket Odyssey Map';
  const openShareLink = (url) => {
    const shareWindow = window.open(url, '_blank');
    if (!shareWindow) setSaveStatus('อนุญาต popup เพื่อเปิดช่องทางแชร์');
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
      setSaveStatus('คัดลอกลิงก์แล้ว');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setSaveStatus('คัดลอกไม่สำเร็จ กรุณาคัดลอกลิงก์ด้วยตัวเอง');
    }
  };
  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: 'Check out my travel map!', url: shareUrl });
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
    const textStyles = element.type === 'text'
      ? {
          fontSize: element.fontSize ?? 28,
          fontWeight: element.fontWeight ?? 900
        }
      : {};
    setElements((previous) => [...previous, { ...element, ...textStyles, id }]);
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
      pen: { type: 'shape', shape: 'line', label: 'Draw Line', content: '' },
      highlight: { type: 'shape', shape: 'highlight', label: 'Highlight', content: '' },
      rectangle: { type: 'shape', shape: 'rectangle', label: 'Rectangle', content: '' },
      circle: { type: 'shape', shape: 'circle', label: 'Circle', content: '' },
      grid: { type: 'shape', shape: 'grid', label: 'Grid', content: '' }
    };
    if (toolElements[tool]) addElement(toolElements[tool]);
    setActiveTool('select');
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addElement({ type: 'image', label: file.name, content: reader.result });
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const selectedData = elements.find((element) => element.id === selectedElement);
  const selectedPosition = selectedElement ? elementPositions[selectedElement] : null;
  const contextMenuElement = contextMenuElementId ? elements.find((element) => element.id === contextMenuElementId) : null;
  const contextMenuPosition = contextMenuElementId ? elementPositions[contextMenuElementId] : null;
  const quickActionMenuStyle = contextMenuElement && contextMenuPosition ? {
    top: Math.max(20, contextMenuPosition.top + contextMenuPosition.height + 10),
    left: Math.max(20, Math.min(contextMenuPosition.left, 650))
  } : {};
  const mapTemplates = [
    {
      id: 'tropical',
      label: 'Tropical Coast',
      preview: 'linear-gradient(#48b4ed 0 24%, #f8d58b 24% 58%, #42b8d7 58%)',
      canvas: {
        backgroundColor: '#f8d58b',
        backgroundImage: 'linear-gradient(180deg, transparent 0 44%, #d9a866 44% 45%, #f8d58b 45% 66%, #42b8d7 66% 67%, #278fc8 67%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px)'
      }
    },
    {
      id: 'island',
      label: 'Green Island',
      preview: 'linear-gradient(135deg, #58b74d 0 30%, #96df4e 30% 70%, #58b74d 70%)',
      canvas: {
        backgroundColor: '#85d64d',
        backgroundImage: 'radial-gradient(ellipse at center, #a0e65c 0 45%, transparent 46%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px)'
      }
    },
    {
      id: 'river',
      label: 'River Valley',
      preview: 'linear-gradient(135deg, #77cf3d 0 45%, #398ac1 45% 58%, #77cf3d 58%)',
      canvas: {
        backgroundColor: '#78ce3d',
        backgroundImage: 'linear-gradient(90deg, transparent 0 42%, #328ec4 43% 48%, #78ce3d 49%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px)'
      }
    },
    {
      id: 'boardwalk',
      label: 'Beach Boardwalk',
      preview: 'linear-gradient(#f5cf7b 0 40%, #98613d 40% 53%, #35afd2 53%)',
      canvas: {
        backgroundColor: '#f5cf7b',
        backgroundImage: 'linear-gradient(180deg, transparent 0 39%, #98613d 40% 52%, #f5cf7b 53% 62%, #35afd2 63%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px)'
      }
    }
  ];
  const activeTemplate = mapTemplates.find((template) => template.id === selectedTemplate);
  const selectTemplate = (templateId) => setSelectedTemplate(templateId);

  return (
    <div className="h-screen w-full bg-[#f0f0f0] flex flex-col font-mono text-black overflow-hidden selection:bg-red-200">
      
      {/* TOP NAVBAR */}
      <header className="h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,1)] z-20 relative">
        <div className="flex items-center gap-4 h-full">
          <button onClick={onBack} className="hover:bg-gray-200 p-1 rounded transition-colors" title="Back to My Maps">
            <ArrowLeft className="w-5 h-5 font-black" />
          </button>
          <div className="flex items-center gap-2 text-[#cc0000] font-black uppercase tracking-wider">
            <Compass className="w-5 h-5" />
            <span className="hidden sm:inline">POCKET ODYSSEY</span>
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
            <button onClick={undo} disabled={!history.length} title="Undo" className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!future.length} title="Redo" className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-1 bg-black rounded-full mx-1 hidden sm:block"></div>
          <button onClick={saveDraft} className="bg-[#4895ef] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase">
            SAVE <span className="hidden sm:inline">DRAFT</span>
          </button>
          <button onClick={() => setShowPublishModal(true)} className="bg-[#cc0000] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Compass className="w-3 h-3 hidden sm:block" /> PUBLISH
          </button>
          <button onClick={() => setShowShareModal(true)} title="Share map" className="bg-amber-400 text-black font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Share2 className="w-3 h-3" /> SHARE
          </button>
        </div>
      </header>
      {saveStatus && <div className="absolute top-16 right-4 z-30 bg-emerald-100 border-2 border-black px-3 py-2 text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{saveStatus}</div>}

      {showShareModal && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
        <div className="w-full max-w-md bg-[#202020] text-white border-2 border-white/70 rounded-lg shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="font-black text-lg">Share map</h2>
            <button onClick={() => setShowShareModal(false)} title="Close" className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <button onClick={nativeShare} className="mx-auto my-5 block bg-white text-black rounded-full px-5 py-2 font-bold hover:bg-gray-200">Share</button>
          <p className="text-center text-sm text-gray-300 mb-5">Share this map with your friends</p>
          <div className="grid grid-cols-5 gap-3 mb-6">
            <button onClick={() => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)} title="Facebook" className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center font-black text-2xl">f</span><span className="text-[10px]">Facebook</span></button>
            <button onClick={() => openShareLink(`sms:?body=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title="Messages" className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-white text-[#1677e8] flex items-center justify-center"><MessageCircle className="w-7 h-7 fill-current" /></span><span className="text-[10px]">Messages</span></button>
            <button onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`)} title="WhatsApp" className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center"><Smartphone className="w-6 h-6" /></span><span className="text-[10px]">WhatsApp</span></button>
            <button onClick={() => openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)} title="X" className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-black border border-white/30 flex items-center justify-center font-black text-xl">X</span><span className="text-[10px]">X</span></button>
            <button onClick={copyShareLink} title="Copy link" className="flex flex-col items-center gap-1"><span className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"><Copy className="w-5 h-5" /></span><span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span></button>
          </div>
          <div className="flex items-center gap-2 bg-[#111] border border-white/20 rounded-lg p-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs text-gray-300 outline-none" />
            <button onClick={copyShareLink} className="shrink-0 border border-white/40 rounded-full px-3 py-1 text-xs font-bold hover:bg-white/10">{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
      </div>}

      {showPublishModal && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowPublishModal(false)}>
        <form onSubmit={(event) => { event.preventDefault(); publishMap(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
            <h2 className="font-black uppercase tracking-wide">Publish Map</h2>
            <button type="button" onClick={() => setShowPublishModal(false)} title="Close" className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="publish-title" className="block text-xs font-black uppercase mb-1.5">Map Title</label>
              <input id="publish-title" value={mapTitle} onChange={(event) => setMapTitle(event.target.value)} required className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
            </div>
            <div>
              <label htmlFor="publish-description" className="block text-xs font-black uppercase mb-1.5">Description</label>
              <textarea id="publish-description" rows="3" value={publishDescription} onChange={(event) => setPublishDescription(event.target.value)} placeholder="Tell travelers what makes this map special" className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
            </div>
            <div>
              <label htmlFor="publish-tags" className="block text-xs font-black uppercase mb-1.5">Tags</label>
              <input id="publish-tags" value={publishTags} onChange={(event) => setPublishTags(event.target.value)} placeholder="landmark, scenic, adventure" className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
              <p className="mt-1 text-[10px] text-gray-500 font-bold">Separate tags with commas.</p>
            </div>
            <fieldset>
              <legend className="block text-xs font-black uppercase mb-2">Privacy</legend>
              <div className="grid grid-cols-3 gap-2">
                {[['public', 'Public', 'Visible in Community'], ['unlisted', 'Unlisted', 'Only with a link'], ['private', 'Private', 'Keep as a draft']].map(([value, label, description]) => (
                  <label key={value} className={`border-2 border-black rounded p-2 cursor-pointer ${publishPrivacy === value ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <input type="radio" name="privacy" value={value} checked={publishPrivacy === value} onChange={(event) => setPublishPrivacy(event.target.value)} className="sr-only" />
                    <span className="block text-xs font-black uppercase">{label}</span>
                    <span className="block mt-1 text-[9px] leading-tight font-bold text-gray-600">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button type="button" onClick={() => setShowPublishModal(false)} className="px-4 py-2 border-2 border-black rounded font-black text-xs uppercase hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#cc0000] text-white border-2 border-black rounded font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">Publish Map</button>
            </div>
          </div>
        </form>
      </div>}

      {/* EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT MENU STRIP */}
        <div className="w-20 bg-white border-r-4 border-black flex flex-col items-center py-4 gap-2 z-10 shrink-0">
          {[
            { id: 'TEMPLATES', icon: LayoutGrid, label: 'TEMPLATES' },
            { id: 'ELEMENTS', icon: Shapes, label: 'ELEMENTS' },
            { id: 'TEXT', icon: Type, label: 'TEXT' },
            { id: 'UPLOADS', icon: Upload, label: 'UPLOADS' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all ${activeTab === tab.id ? 'border-black bg-gray-100 text-[#cc0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-black'}`}
            >
              <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'fill-red-100' : ''}`} />
              <span className="text-[8px] font-black">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* LEFT PANEL CONTENT */}
        <div className="w-64 bg-white border-r-4 border-black flex flex-col z-10 shadow-[4px_0_0_0_rgba(0,0,0,1)] shrink-0 hidden md:flex">
          <div className="p-4 border-b-2 border-black">
            <h2 className="font-black text-sm uppercase">{activeTab}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'TEMPLATES' && (
              <div className="grid grid-cols-2 gap-3">
                {mapTemplates.map((template) => (
                  <button key={template.id} type="button" onClick={() => selectTemplate(template.id)} aria-pressed={selectedTemplate === template.id} className={`aspect-square border-2 border-black rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform flex flex-col items-center justify-end p-2 relative overflow-hidden ${selectedTemplate === template.id ? 'ring-4 ring-[#4895ef] ring-offset-2' : ''}`}>
                    <div className="absolute inset-0" style={{ background: template.preview }}></div>
                    <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0_15px,#1f2937_16px_17px),repeating-linear-gradient(0deg,transparent_0_15px,#1f2937_16px_17px)]"></div>
                    {selectedTemplate === template.id && <span className="absolute top-1 right-1 w-5 h-5 bg-[#4895ef] text-white border-2 border-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 stroke-[4]" /></span>}
                    <span className="relative z-10 bg-white/90 border border-black px-1 text-[8px] font-black uppercase">{template.label}</span>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'ELEMENTS' && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['🌲', 'Tree'], ['🏔️', 'Mountain'], ['🏠', 'House'], ['📍', 'Pin'],
                  ['☀️', 'Sun'], ['🌊', 'Water'], ['🔥', 'Campfire'], ['⭐', 'Star']
                ].map(([content, label]) => (
                  <button key={label} onClick={() => addElement({ type: 'emoji', label, content })} className="aspect-square bg-gray-50 border-2 border-black rounded hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                    <span className="text-3xl">{content}</span>
                    <span className="text-[9px] font-black mt-1 uppercase">{label}</span>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'TEXT' && (
              <div className="space-y-3">
                <button onClick={() => addElement({ type: 'text', label: 'Heading', content: 'เพิ่มหัวเรื่อง', fontSize: 32, fontWeight: 900 })} className="w-full border-2 border-black bg-white p-3 text-left hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ fontSize: '32px', fontWeight: 900 }}>เพิ่มหัวเรื่อง</button>
                <button onClick={() => addElement({ type: 'text', label: 'Subheading', content: 'เพิ่มหัวเรื่องย่อย', fontSize: 22, fontWeight: 700 })} className="w-full border-2 border-black bg-white p-3 text-left hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ fontSize: '22px', fontWeight: 700 }}>เพิ่มหัวเรื่องย่อย</button>
                <button onClick={() => addElement({ type: 'text', label: 'Body', content: 'เพิ่มข้อความในสไตล์ของคุณ', fontSize: 16, fontWeight: 400 })} className="w-full border-2 border-black bg-white p-3 text-left hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ fontSize: '16px', fontWeight: 400 }}>เพิ่มข้อความ</button>
              </div>
            )}
            {activeTab === 'UPLOADS' && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-black bg-[#4895ef] text-white p-3 font-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600">อัปโหลดไฟล์</button>
                <p className="text-[10px] text-gray-500 font-bold">เลือกรูปภาพจากเครื่องของคุณ แล้วลากหรือย่อขยายบน canvas ได้ทันที</p>
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
          <div className="absolute top-4 left-4 z-20 bg-white border-2 border-black rounded-xl p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
            {[
              ['select', MousePointer2, 'Select and move'],
              ['pen', Pencil, 'Draw line'],
              ['highlight', Minus, 'Add highlight'],
              ['rectangle', Square, 'Add rectangle'],
              ['circle', Circle, 'Add circle'],
              ['grid', Grid3X3, 'Add grid'],
              ['eraser', Eraser, 'Delete selected']
            ].map(([tool, Icon, label]) => (
              <button key={tool} onClick={(event) => { event.stopPropagation(); handleToolAction(tool); }} title={label} className={`w-9 h-9 flex items-center justify-center rounded-lg ${activeTool === tool ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                <Icon className="w-5 h-5" />
              </button>
            ))}
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
                {activeTemplate.label}
              </div>

              {contextMenuElement && contextMenuPosition && (
                <div className="absolute z-30 w-56 rounded-xl border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={quickActionMenuStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-wide text-gray-500">Actions</span>
                    <button onClick={() => setContextMenuElementId(null)} className="flex h-5 w-5 items-center justify-center rounded-full border border-black bg-gray-100 text-[10px] font-black">×</button>
                  </div>
                  <div className="space-y-1.5">
                    <button onClick={() => { duplicateSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⧉</span>Duplicate</span>
                    </button>
                    <button onClick={() => { moveLayer('front'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⇡</span>Bring to front</span>
                    </button>
                    <button onClick={() => { moveLayer('back'); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">⇣</span>Send to back</span>
                    </button>
                    <button onClick={() => { toggleLockSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-gray-100">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">{selectedData?.locked ? '🔓' : '🔒'}</span>{selectedData?.locked ? 'Unlock' : 'Lock'}</span>
                    </button>
                    <button onClick={() => { deleteSelectedElement(); setContextMenuElementId(null); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-red-50 text-red-600">
                      <span className="flex items-center gap-2 text-xs font-bold"><span className="text-base">🗑</span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {elements.map((element) => {
                const position = elementPositions[element.id];
                const isSelected = selectedElement === element.id;
                const isEditingText = editingTextId === element.id && element.type === 'text';

                return (
                  <div key={element.id} className={`absolute flex items-center justify-center cursor-move select-none ${isSelected ? 'outline outline-2 outline-dashed outline-red-500 bg-red-500/10' : 'hover:outline hover:outline-2 hover:outline-blue-400'}`} style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px`, height: `${position.height}px`, backgroundColor: element.overlay ? `${element.overlay}55` : undefined, opacity: 1 }} onContextMenu={(event) => {
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
                    {element.type === 'image' ? <img src={element.content} alt={element.label} className="w-full h-full object-contain pointer-events-none" /> : element.type === 'shape' ? <div className={`w-full h-full ${element.shape === 'line' ? 'border-t-4 border-black mt-1/2' : ''} ${element.shape === 'highlight' ? 'h-5 bg-yellow-300/70 border-2 border-yellow-500' : ''} ${element.shape === 'rectangle' ? 'border-4 border-red-500' : ''} ${element.shape === 'circle' ? 'rounded-full border-4 border-blue-600' : ''} ${element.shape === 'grid' ? 'bg-[linear-gradient(90deg,transparent_9px,#2563eb_10px),linear-gradient(transparent_9px,#2563eb_10px)] bg-[size:10px_10px]' : ''} pointer-events-none`} /> : (
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
                            overflowWrap: 'break-word'
                          }}
                        />
                      ) : (
                        <span className="filter drop-shadow-md px-2 text-center flex items-center justify-center w-full h-full" style={{ fontSize: `${Math.max(12, Math.min(120, Math.round(Math.min(position.width, position.height) * 0.7)))}px`, fontWeight: element.fontWeight ?? 900, whiteSpace: 'pre-wrap', lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{element.content}</span>
                      )
                    )}
                    {isSelected && !isEditingText && <>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 cursor-nwse-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500 cursor-nesw-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 cursor-nesw-resize"></div>
                      <div onPointerDown={(event) => { event.stopPropagation(); startDragging(element.id, event, 'resize'); }} className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-red-500 cursor-nwse-resize"></div>
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
            <h2 className="font-black text-sm uppercase">PROPERTIES</h2>
          </div>
          
          {selectedElement ? (
            <div className="p-4 space-y-6 overflow-y-auto">
              
              {/* Selected Element Overview */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">SELECTED ELEMENT</label>
                <div className="flex items-center gap-3 bg-gray-100 border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-10 h-10 bg-white border border-black rounded flex items-center justify-center text-xl overflow-hidden">
                    {selectedData.type === 'image' ? <img src={selectedData.content} alt="" className="w-full h-full object-contain" /> : selectedData.content}
                  </div>
                  <span className="font-black text-sm truncate">{selectedData.label}</span>
                </div>
              </div>

              {selectedData.type === 'text' && (
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">TEXT</label>
                  <div className="space-y-3">
                    <textarea value={selectedData.content} onChange={(event) => setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, content: event.target.value } : element))} className="w-full min-h-20 px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none resize-y" />
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Font Size</label>
                        <input type="number" min="8" max="120" value={selectedData.fontSize ?? 28} onChange={(event) => updateSelectedTextStyle({ fontSize: Math.max(8, Math.min(120, Number(event.target.value) || 8)) })} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                      </div>
                      <button type="button" onClick={() => updateSelectedTextStyle({ fontWeight: (selectedData.fontWeight ?? 900) > 400 ? 400 : 900 })} className={`px-3 py-2 border-2 border-black rounded font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedData.fontWeight && selectedData.fontWeight > 400 ? 'bg-gray-900 text-white' : 'bg-yellow-200 text-black'}`}>
                        {selectedData.fontWeight && selectedData.fontWeight > 400 ? 'Normal' : 'Bold'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transform */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">TRANSFORM</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">X Pos</label>
                    <input type="number" min="0" max="800" value={Math.round(selectedPosition.left)} onChange={(event) => updateSelectedPosition('left', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Y Pos</label>
                    <input type="number" min="0" max="600" value={Math.round(selectedPosition.top)} onChange={(event) => updateSelectedPosition('top', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Width</label>
                    <input type="number" min="40" max="800" value={Math.round(selectedPosition.width)} onChange={(event) => updateSelectedPosition('width', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Height</label>
                    <input type="number" min="40" max="600" value={Math.round(selectedPosition.height)} onChange={(event) => updateSelectedPosition('height', event.target.value)} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                </div>
              </div>

              {/* Arrangement */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">ARRANGEMENT</label>
                <div className="flex gap-2">
                  <button onClick={() => moveLayer('front')} title="Bring to front" className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <BringToFront className="w-4 h-4" /> 
                  </button>
                  <button onClick={() => moveLayer('back')} title="Send to back" className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <SendToBack className="w-4 h-4" /> 
                  </button>
                </div>
              </div>

              {/* Color Overlay */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">COLOR OVERLAY</label>
                <div className="flex gap-2">
                  {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#fbbf24'].map((color) => <button key={color} onClick={() => setOverlay(color)} title={`Overlay ${color}`} className="w-6 h-6 rounded-full border-2 border-black cursor-pointer hover:scale-110" style={{ backgroundColor: color }} />)}
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t-2 border-black border-dashed">
                <button onClick={deleteSelectedElement} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-red-50 hover:text-red-600 font-black py-2 rounded text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                  <Trash2 className="w-4 h-4" /> DELETE ELEMENT
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-xs text-gray-400 font-bold border-2 border-dashed border-gray-300 p-4 rounded">
                Click an element on the canvas to edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}