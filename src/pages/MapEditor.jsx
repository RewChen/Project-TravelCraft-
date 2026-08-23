import { useEffect, useRef, useState } from 'react';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft, Check
} from 'lucide-react';

export default function MapEditor({ onBack }) {
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
  const fileInputRef = useRef(null);
  const nextElementId = useRef(0);

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
          const width = Math.max(40, Math.min(800 - element.left, dragging.startWidth + deltaX));
          const height = Math.max(40, Math.min(600 - element.top, dragging.startHeight + deltaY));
          return { ...previous, [dragging.id]: { ...element, width, height } };
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

  const pushHistory = () => {
    setHistory((previous) => [...previous, { elements, elementPositions }]);
    setFuture([]);
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

  const saveDraft = () => {
    localStorage.setItem('pocket_odyssey_editor_draft', JSON.stringify({ elements, elementPositions, selectedTemplate }));
    setSaveStatus('Draft saved');
  };

  const publishMap = () => {
    saveDraft();
    setSaveStatus('Map published');
  };

  const addElement = (element) => {
    pushHistory();
    nextElementId.current += 1;
    const id = `${element.type}-${nextElementId.current}`;
    setElements((previous) => [...previous, { ...element, id }]);
    setElementPositions((previous) => ({
      ...previous,
      [id]: { left: 330, top: 220, width: element.type === 'text' ? 220 : 100, height: element.type === 'text' ? 70 : 100 }
    }));
    setSelectedElement(id);
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
            defaultValue="Untitled Map" 
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
          <button onClick={publishMap} className="bg-[#cc0000] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Compass className="w-3 h-3 hidden sm:block" /> PUBLISH
          </button>
        </div>
      </header>
      {saveStatus && <div className="absolute top-16 right-4 z-30 bg-emerald-100 border-2 border-black px-3 py-2 text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{saveStatus}</div>}

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
                <button onClick={() => addElement({ type: 'text', label: 'Heading', content: 'เพิ่มหัวเรื่อง' })} className="w-full border-2 border-black bg-white p-3 text-left text-2xl font-black hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">เพิ่มหัวเรื่อง</button>
                <button onClick={() => addElement({ type: 'text', label: 'Subheading', content: 'เพิ่มหัวเรื่องย่อย' })} className="w-full border-2 border-black bg-white p-3 text-left text-lg font-bold hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">เพิ่มหัวเรื่องย่อย</button>
                <button onClick={() => addElement({ type: 'text', label: 'Body', content: 'เพิ่มข้อความในสไตล์ของคุณ' })} className="w-full border-2 border-black bg-white p-3 text-left text-sm hover:bg-amber-100 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">เพิ่มข้อความ</button>
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
              {elements.map((element) => {
                const position = elementPositions[element.id];
                const isSelected = selectedElement === element.id;
                return (
                  <div key={element.id} className={`absolute flex items-center justify-center bg-white/50 cursor-move select-none ${isSelected ? 'outline outline-2 outline-dashed outline-red-500 bg-red-500/10' : 'hover:outline hover:outline-2 hover:outline-blue-400'}`} style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px`, height: `${position.height}px`, backgroundColor: element.overlay ? `${element.overlay}55` : undefined }} onPointerDown={(event) => startDragging(element.id, event)}>
                    {element.type === 'image' ? <img src={element.content} alt={element.label} className="w-full h-full object-contain pointer-events-none" /> : <span className={`${element.type === 'text' ? 'text-xl font-black px-2 text-center' : 'text-5xl'} filter drop-shadow-md`}>{element.content}</span>}
                    {isSelected && <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500"></div>
                      <div onPointerDown={(event) => startDragging(element.id, event, 'resize')} className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-red-500 cursor-nwse-resize"></div>
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
                  <textarea value={selectedData.content} onChange={(event) => setElements((previous) => previous.map((element) => element.id === selectedElement ? { ...element, content: event.target.value } : element))} className="w-full min-h-20 px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none resize-y" />
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
                <button onClick={() => { pushHistory(); setElements((previous) => previous.filter((element) => element.id !== selectedElement)); setSelectedElement(null); }} className="w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-red-50 hover:text-red-600 font-black py-2 rounded text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
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