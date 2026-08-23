import { useState } from 'react';
import { X, Upload, Map, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MapBackgroundModal({ onClose }) {
  const { mapBackgroundImage, setMapBackgroundImage, resetMapBackgroundImage } = useApp();

  const [previewImage, setPreviewImage] = useState(mapBackgroundImage);

  const presets = [
    {
      name: 'Kyoto Default Canvas',
      value: null,
      color: 'bg-[#e2f0d9]'
    },
    {
      name: 'RPG Fantasy World',
      value: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
      color: 'bg-[#4895ef]'
    },
    {
      name: 'Vintage Parchment',
      value: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
      color: 'bg-amber-100'
    },
    {
      name: 'Cyberpunk Neon',
      value: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
      color: 'bg-slate-900'
    }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    setMapBackgroundImage(previewImage);
    onClose();
  };

  const handleReset = () => {
    resetMapBackgroundImage();
    setPreviewImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              Upload Whole World Map Background (ทั้งแมพ)
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 bg-white text-black border-2 border-black rounded-md flex items-center justify-center hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-black uppercase mb-1.5">
              1. Choose Map Image File from Device
            </label>
            <div className="relative border-4 border-dashed border-black rounded-xl p-4 text-center bg-gray-50 hover:bg-amber-50 transition-colors">
              {previewImage ? (
                <div className="relative group">
                  <img 
                    src={previewImage} 
                    alt="Map Background Preview" 
                    className="h-48 w-full object-cover rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                  />
                  <label className="absolute inset-0 bg-black/60 text-white font-black text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg transition-opacity">
                    Change Map Image File 🗺️
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-6">
                  <div className="w-14 h-14 bg-red-600 text-white border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black uppercase">Upload Custom Map Background Image</span>
                  <span className="text-[11px] text-gray-600 font-sans">
                    Supports JPG, PNG, WEBP, SVG maps & floorplans
                  </span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <label className="block text-xs font-black uppercase mb-2">
              2. Or Select Map Theme Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPreviewImage(preset.value)}
                  className={`p-2 border-2 border-black rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    previewImage === preset.value ? 'bg-amber-400 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-full h-8 rounded border border-black ${preset.color} flex items-center justify-center text-xs`}>
                    {preset.value ? '🗺️' : '🏞️'}
                  </div>
                  <span className="text-[10px] font-extrabold truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-between items-center border-t-2 border-black">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-red-600 border-2 border-black rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default Map
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-[#cc0000] text-white font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Apply to Whole Map
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
