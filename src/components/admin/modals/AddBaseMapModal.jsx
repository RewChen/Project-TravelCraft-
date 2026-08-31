import { useState } from 'react';
import { Map, X, Plus, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function AddBaseMapModal({ isOpen, onClose }) {
  const { addBaseMap } = useApp();
  const [mapName, setMapName] = useState('');
  const [theme, setTheme] = useState('Plains & Forest');
  const [region, setRegion] = useState('Kanto Valley');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const presetImages = [
    { label: 'Forest / Plains', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80' },
    { label: 'Desert Ruins', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80' },
    { label: 'Ocean Coast', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { label: 'Mountain Peaks', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
    { label: 'Neon Cyber City', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80' },
    { label: 'Canyon Gorge', url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mapName.trim()) return;

    addBaseMap({
      name: mapName,
      theme,
      region,
      image: imageUrl || presetImages[0].url,
      description: description || 'A new frontier ready for trainer quests and cartography.'
    });

    setMapName('');
    setDescription('');
    setImageUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            <h3 className="text-base font-black uppercase tracking-wider">Add New Base Map</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-neutral-800 text-white rounded-lg border-2 border-white flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Base Map Title
            </label>
            <input
              type="text"
              required
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="e.g. Celestial Highlands"
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
                Biome / Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="Plains & Forest">🌲 Plains & Forest</option>
                <option value="Desert & Volcano">🏜️ Desert & Volcano</option>
                <option value="Ocean & Isles">🌊 Ocean & Isles</option>
                <option value="Mountains & Peaks">⛰️ Mountains & Peaks</option>
                <option value="Urban & Neon">🏙️ Urban & Neon</option>
                <option value="Glacial Tundra">❄️ Glacial Tundra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
                Regional Territory
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="Kanto Valley">Kanto Valley</option>
                <option value="Cinnabar Badlands">Cinnabar Badlands</option>
                <option value="Vermilion Archipelago">Vermilion Archipelago</option>
                <option value="Indigo Plateau">Indigo Plateau</option>
                <option value="Johto Borderland">Johto Borderland</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Select Preset Tile or Enter Image URL
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {presetImages.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(preset.url)}
                  className={`border-2 border-black rounded-lg p-1 text-[10px] font-bold text-left cursor-pointer transition-all flex flex-col gap-1 overflow-hidden ${
                    imageUrl === preset.url ? 'bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-10 object-cover rounded border border-black" />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste custom image URL: https://..."
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Description & Terrain Lore
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe geographical features, weather conditions..."
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 border-2 border-black rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Base Map</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

