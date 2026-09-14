import { X, Heart, Trash2, Camera, Clock3, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LocationPopupModal({ pin, onClose }) {
  const { t, navigateTo, favorites, toggleFavorite, deleteCustomPin } = useApp();

  if (!pin) return null;

  const isFav = favorites.includes(pin.title);
  const previewImage = pin.previewUrl || pin.imageUrl;
  const pinHours = pin.hours || (pin.openTime && pin.closeTime ? `${pin.openTime} - ${pin.closeTime}` : null);

  const handleDelete = () => {
    deleteCustomPin(pin.id);
    onClose();
  };

  return (
    <div className="absolute top-12 left-0 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 p-4 rounded-xl font-mono animate-in fade-in duration-150">

      {/* Header */}
      <div className="flex items-start justify-between pb-2 border-b-2 border-black mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 border-2 border-black rounded-lg flex items-center justify-center text-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {pin.icon || '📍'}
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider leading-tight">{pin.title}</h4>
            <span className="text-[9px] bg-amber-400 border border-black px-1.5 py-0.2 rounded font-extrabold uppercase">
              {pin.tag || pin.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 bg-red-100 border border-black text-red-600 flex items-center justify-center text-xs font-bold hover:bg-red-200 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Uploaded Photo / Editor Element Image Preview */}
      {previewImage ? (
        <div className="mb-3 relative rounded-lg border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-slate-900">
          <img
            src={previewImage}
            alt={pin.title}
            className="w-full h-32 object-cover"
          />
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded border border-white/40 flex items-center gap-1 font-sans">
            <Camera className="w-3 h-3" /> {t('map.travelerUpload')}
          </div>
        </div>
      ) : null}

      {/* Lore / Description */}
      <p className="text-[11px] text-gray-700 font-sans leading-relaxed mb-4 border border-black p-2 bg-gray-50 rounded">
        {pin.lore || t('map.defaultLore')}
      </p>

      {/* Opening Hours (filled in the editor) */}
      {pinHours && (
        <div className="mb-4 flex items-center gap-2 border border-black rounded-lg p-2 bg-emerald-50">
          <Clock3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="text-[11px] font-black text-emerald-800">{pinHours}</span>
        </div>
      )}

      {/* YouTube video (filled in the editor) */}
      {pin.videoUrl && (
        <div className="mb-4 rounded-lg border-2 border-black overflow-hidden bg-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <iframe
            src={pin.videoUrl}
            title={pin.title}
            className="w-full aspect-video border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
      {!pin.videoUrl && pin.youtubeUrl && (
        <a
          href={pin.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 border border-black rounded-lg p-2 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] font-black">{t('map.viewYoutube')}</span>
        </a>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-1 border-t-2 border-black">
        {pin.isUserUploaded ? (
          <button
            onClick={handleDelete}
            className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-1 cursor-pointer"
            title={t('map.deletePin')}
          >
            <Trash2 className="w-3 h-3" /> {t('common.delete')}
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            onClick={() => toggleFavorite(pin.title)}
            className={`${
              isFav ? 'bg-red-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'
            } text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-1 transition-all cursor-pointer`}
          >
            <Heart className={`w-3 h-3 ${isFav ? 'fill-white' : ''}`} /> {isFav ? t('map.fav') : t('map.unfav')}
          </button>
          <button
            onClick={() => navigateTo('details', pin)}
            className="bg-[#cc0000] hover:bg-red-700 text-white text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-1 cursor-pointer"
          >
            {t('common.details')} →
          </button>
        </div>
      </div>

    </div>
  );
}