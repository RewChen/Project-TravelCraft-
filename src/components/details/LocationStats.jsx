import { useState } from 'react';
import { BarChart2, User, Heart, Share2, X, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationStats() {
  const { selectedLocation, favorites, toggleFavorite } = useApp();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFav = favorites.includes(selectedLocation.title);
  const shareUrl = window.location.href;
  const shareText = `Check out ${selectedLocation.title} on Pocket Odyssey`;
  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl);
      else {
        const input = document.createElement('textarea');
        input.value = shareUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-[#e8ecef] border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-amber-700">
        <BarChart2 className="w-5 h-5" /> Location Stats
      </h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>Popularity Level</span>
          <span className="text-red-600">Lv. {selectedLocation.popularity || 99}</span>
        </div>
        <div className="h-3 w-full border-2 border-black rounded-full bg-white overflow-hidden">
          <div 
            className="h-full bg-red-600 border-r-2 border-black transition-all duration-500" 
            style={{ width: `${selectedLocation.popularity || 95}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <User className="w-4 h-4 mx-auto text-red-600 mb-1" />
          <div className="text-[9px] font-bold text-gray-500 uppercase">Visitors</div>
          <div className="text-xs font-black">{selectedLocation.visitors}</div>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-amber-500 text-sm block mb-1">🎖️</span>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Rarity</div>
          <div className="text-xs font-black">{selectedLocation.rarity}</div>
        </div>
      </div>

      <button 
        onClick={() => toggleFavorite(selectedLocation.title)}
        className={`w-full ${
          isFav ? 'bg-amber-400 text-black' : 'bg-[#cc0000] text-white hover:bg-red-700'
        } font-bold py-2.5 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 mb-3 flex items-center justify-center gap-2 text-sm transition-all`}
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-black' : 'fill-white'}`} />
        {isFav ? 'In Favorites' : 'Add to Favorites'}
      </button>

      <button onClick={() => setShowShare(true)} className="w-full bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 text-xs transition-all">
        <Share2 className="w-4 h-4" /> Share Location
      </button>

      {showShare && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
        <div className="w-full max-w-md bg-[#202020] text-white border-2 border-white/70 rounded-lg p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <h2 className="font-black text-lg">แชร์สถานที่</h2>
            <button onClick={() => setShowShare(false)} title="Close" className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-gray-300 mt-4 mb-5">{shareText}</p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="text-xs font-bold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-2xl font-black">f</span>Facebook</button>
            <button onClick={() => window.open(`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')} className="text-xs font-bold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center"><Share2 className="w-6 h-6" /></span>Messages</button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')} className="text-xs font-bold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center"><Share2 className="w-6 h-6" /></span>WhatsApp</button>
            <button onClick={copyLink} className="text-xs font-bold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"><Copy className="w-5 h-5" /></span>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <div className="flex gap-2 bg-[#111] border border-white/20 rounded-lg p-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs text-gray-300 outline-none" />
            <button onClick={copyLink} className="border border-white/40 rounded-full px-3 py-1 text-xs font-bold">{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
