import { useEffect, useState } from 'react';
import { 
  Undo2, Redo2, Compass, LayoutGrid, Shapes, Type, Upload, 
  BringToFront, SendToBack, Trash2, Settings, ArrowLeft 
} from 'lucide-react';

export default function MapEditor({ onBack }) {
  const [activeTab, setActiveTab] = useState('TEMPLATES');
  const [selectedElement, setSelectedElement] = useState('tree'); // 'tree', 'chest', null
  const [zoom, setZoom] = useState(100);
  const [elementPositions, setElementPositions] = useState({
    tree: { left: 200, top: 150, width: 128, height: 128 },
    chest: { left: 500, top: 350, width: 64, height: 64 }
  });
  const [dragging, setDragging] = useState(null);

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

  const startDragging = (elementId, event) => {
    event.stopPropagation();
    const position = elementPositions[elementId];
    setSelectedElement(elementId);
    setDragging({
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: position.left,
      startTop: position.top
    });
  };

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
            <button className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Undo2 className="w-4 h-4" /></button>
            <button className="w-8 h-8 border-2 border-black rounded flex items-center justify-center hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-1 bg-black rounded-full mx-1 hidden sm:block"></div>
          <button className="bg-[#4895ef] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase">
            SAVE <span className="hidden sm:inline">DRAFT</span>
          </button>
          <button className="bg-[#cc0000] text-white font-black text-xs px-3 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none uppercase flex items-center gap-2">
            <Compass className="w-3 h-3 hidden sm:block" /> PUBLISH
          </button>
        </div>
      </header>

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
                <div className="aspect-square bg-[#a8e6cf] border-2 border-black rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform flex items-center justify-center text-2xl relative overflow-hidden">
                   <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
                   🌲
                </div>
                <div className="aspect-square bg-red-900 border-2 border-black rounded cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-2xl">🌋</div>
                <div className="aspect-square bg-sky-300 border-2 border-black rounded cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-2xl border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]">🏝️</div>
                <div className="aspect-square bg-emerald-900 border-2 border-black rounded cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-2xl">🌲</div>
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
              className="bg-[#b7e4c7] border-4 border-black relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]"
              style={{ width: '800px', height: '600px', transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Element: Ancient Tree */}
              <div 
                className={`absolute flex items-center justify-center bg-white/50 cursor-move
                  ${selectedElement === 'tree' ? 'outline outline-2 outline-dashed outline-red-500 bg-red-500/10' : 'hover:outline hover:outline-2 hover:outline-blue-400'}`}
                style={{
                  top: `${elementPositions.tree.top}px`,
                  left: `${elementPositions.tree.left}px`,
                  width: `${elementPositions.tree.width}px`,
                  height: `${elementPositions.tree.height}px`
                }}
                onPointerDown={(event) => startDragging('tree', event)}
              >
                <div className="text-6xl filter drop-shadow-md">🌳</div>
                
                {/* Selection Handles (Canva Style) */}
                {selectedElement === 'tree' && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500"></div>
                  </>
                )}
              </div>

              {/* Element: Chest */}
              <div 
                className={`absolute flex items-center justify-center bg-white/50 cursor-move
                  ${selectedElement === 'chest' ? 'outline outline-2 outline-dashed outline-red-500 bg-red-500/10' : 'hover:outline hover:outline-2 hover:outline-blue-400'}`}
                style={{
                  top: `${elementPositions.chest.top}px`,
                  left: `${elementPositions.chest.left}px`,
                  width: `${elementPositions.chest.width}px`,
                  height: `${elementPositions.chest.height}px`
                }}
                onPointerDown={(event) => startDragging('chest', event)}
              >
                <div className="text-3xl filter drop-shadow-md">🧰</div>
                {selectedElement === 'chest' && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500"></div>
                  </>
                )}
              </div>
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
                  <div className="w-10 h-10 bg-white border border-black rounded flex items-center justify-center text-xl">
                    {selectedElement === 'tree' ? '🌳' : '🧰'}
                  </div>
                  <span className="font-black text-sm">{selectedElement === 'tree' ? 'Ancient Tree' : 'Wooden Chest'}</span>
                </div>
              </div>

              {/* Transform */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">TRANSFORM</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">X Pos</label>
                    <input type="number" readOnly value={elementPositions[selectedElement].left} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Y Pos</label>
                    <input type="number" readOnly value={elementPositions[selectedElement].top} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Width</label>
                    <input type="number" readOnly value={elementPositions[selectedElement].width} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Height</label>
                    <input type="number" readOnly value={elementPositions[selectedElement].height} className="w-full px-2 py-1.5 border-2 border-black rounded text-xs font-bold bg-gray-50 outline-none" />
                  </div>
                </div>
              </div>

              {/* Arrangement */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">ARRANGEMENT</label>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <BringToFront className="w-4 h-4" /> 
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-gray-50 hover:bg-gray-200 py-2 rounded font-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <SendToBack className="w-4 h-4" /> 
                  </button>
                </div>
              </div>

              {/* Color Overlay */}
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">COLOR OVERLAY</label>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-white cursor-pointer hover:scale-110"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-red-500 cursor-pointer hover:scale-110"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-blue-500 cursor-pointer hover:scale-110"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-emerald-500 cursor-pointer hover:scale-110"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-black bg-amber-400 cursor-pointer hover:scale-110"></div>
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t-2 border-black border-dashed">
                <button className="w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-red-50 hover:text-red-600 font-black py-2 rounded text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
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