import { useState } from 'react';
import { Radio, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function NewMissionModal({ isOpen, onClose }) {
  const { showAdminToast } = useApp();
  const [missionTitle, setMissionTitle] = useState('');
  const [targetRegion, setTargetRegion] = useState('All Regions');
  const [rewardCoins, setRewardCoins] = useState(250);
  const [missionType, setMissionType] = useState('Exploration');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;

    showAdminToast(`📡 Mission "${missionTitle}" broadcasted to all active trainers!`, 'success');
    setMissionTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="text-base font-black uppercase tracking-wider">Broadcast New Mission</h3>
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
              Mission Title
            </label>
            <input
              type="text"
              required
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="e.g. S.S. Anne Port Survey"
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
                Target Region
              </label>
              <select
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="All Regions">All Regions</option>
                <option value="Kanto Valley">Kanto Valley</option>
                <option value="Cinnabar Badlands">Cinnabar Badlands</option>
                <option value="Vermilion Archipelago">Vermilion Archipelago</option>
                <option value="Indigo Plateau">Indigo Plateau</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
                Mission Type
              </label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="Exploration">🗺️ Exploration</option>
                <option value="POIScouting">📍 POI Scouting</option>
                <option value="RaidAlert">⚡ Raid Alert</option>
                <option value="CommunityEvent">🎉 Community Event</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Reward (Coins)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="50"
                max="5000"
                step="50"
                value={rewardCoins}
                onChange={(e) => setRewardCoins(Number(e.target.value))}
                className="w-32 bg-gray-50 border-2 border-black rounded-xl p-2.5 text-sm font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
              <span className="text-xs font-bold text-gray-500">🪙 Odyssey Credits</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Mission Directives / Lore
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide briefing notes for field cartographers..."
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="bg-amber-100 border-2 border-black rounded-xl p-3 flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] font-sans font-bold text-amber-900 leading-tight">
              Broadcast will dispatch high-priority push notifications across all active trainer devices.
            </p>
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
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Mission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

