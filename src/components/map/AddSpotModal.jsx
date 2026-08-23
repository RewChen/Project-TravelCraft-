import { useState } from 'react';
import { X, Upload, Camera, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddSpotModal({ onClose, defaultCoords }) {
  const { addCustomPin } = useApp();

  const [title, setTitle] = useState('');
  const [lore, setLore] = useState('');
  const [category, setCategory] = useState('photos');
  const [tag, setTag] = useState('My Spot');
  const [imagePreview, setImagePreview] = useState(null);

  // Position on map (% top & % left)
  const [topPos, setTopPos] = useState(defaultCoords?.top || '50%');
  const [leftPos, setLeftPos] = useState(defaultCoords?.left || '50%');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCustomPin({
      title: title.trim(),
      type: category === 'photos' ? 'Photo Spot' : category.toUpperCase(),
      category,
      tag: tag || 'Traveler Photo',
      lore: lore.trim() || 'A custom traveler photo pinned on the world map.',
      imageUrl: imagePreview,
      top: topPos,
      left: leftPos,
      icon: '📷'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              Upload Photo & Add Spot to Map
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 bg-white text-black border-2 border-black rounded-md flex items-center justify-center hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Select Photo Image
            </label>
            <div className="relative border-4 border-dashed border-black rounded-xl p-4 text-center bg-gray-50 hover:bg-amber-50 transition-colors">
              {imagePreview ? (
                <div className="relative group">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-44 w-full object-cover rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                  />
                  <label className="absolute inset-0 bg-black/50 text-white font-black text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg transition-opacity">
                    Change Image 📷
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4">
                  <div className="w-12 h-12 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Upload className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-xs font-bold">Click to choose image file</span>
                  <span className="text-[10px] text-gray-500 font-sans">PNG, JPG, WEBP supported</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Spot Title */}
          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Spot / Photo Title *
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset over Bamboo Forest" 
              required
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-bold bg-gray-50 focus:outline-none focus:bg-white focus:border-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Category & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-bold bg-gray-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="photos">📷 Photo Spot</option>
                <option value="temples">⛩️ Temple / Shrine</option>
                <option value="cafes">☕ Cafe / Food</option>
                <option value="viewpoints">⛰️ Viewpoint</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Badge Tag</label>
              <input 
                type="text" 
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Secret Gem"
                className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-bold bg-gray-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Lore / Description */}
          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Traveler Notes & Lore
            </label>
            <textarea 
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              placeholder="Share what makes this spot special..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-xs font-sans font-medium bg-gray-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            ></textarea>
          </div>

          {/* Position Selector Presets */}
          <div>
            <label className="block text-xs font-black uppercase mb-1 flex items-center justify-between">
              <span>Map Position Preset</span>
              <span className="text-[10px] text-gray-500">Top: {topPos} | Left: {leftPos}</span>
            </label>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => { setTopPos('30%'); setLeftPos('35%'); }}
                className={`py-1.5 border-2 border-black rounded ${topPos === '30%' ? 'bg-amber-400' : 'bg-gray-100'}`}
              >
                North West
              </button>
              <button
                type="button"
                onClick={() => { setTopPos('25%'); setLeftPos('65%'); }}
                className={`py-1.5 border-2 border-black rounded ${topPos === '25%' ? 'bg-amber-400' : 'bg-gray-100'}`}
              >
                North East
              </button>
              <button
                type="button"
                onClick={() => { setTopPos('55%'); setLeftPos('50%'); }}
                className={`py-1.5 border-2 border-black rounded ${topPos === '55%' ? 'bg-amber-400' : 'bg-gray-100'}`}
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => { setTopPos('70%'); setLeftPos('30%'); }}
                className={`py-1.5 border-2 border-black rounded ${topPos === '70%' ? 'bg-amber-400' : 'bg-gray-100'}`}
              >
                South West
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#cc0000] text-white font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" /> Place Photo Pin (+50 Coins)
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
