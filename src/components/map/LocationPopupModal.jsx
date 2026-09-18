import { useState } from 'react';
import { X, Heart, Trash2, Camera, Clock3, Ticket, Sun, MapPin, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ReportLocationModal from '../report/ReportLocationModal';

export default function LocationPopupModal({ pin, onClose }) {
  const { t, navigateTo, favorites, toggleFavorite, deleteCustomPin } = useApp();
  const [showReport, setShowReport] = useState(false);

  if (!pin) return null;

  const isFav = favorites.includes(pin.title);
  // Photo shows only when the user really uploaded one.
  const previewImage = pin.isUserUploaded ? (pin.previewUrl || pin.imageUrl) : null;
  const pinHours = pin.hours || (pin.openTime && pin.closeTime ? `${pin.openTime} - ${pin.closeTime}` : null);

  const detailFields = [
    { icon: Clock3, label: t('details.hours'), value: pinHours },
    { icon: Ticket, label: t('details.fee'), value: pin.fee },
    { icon: Sun, label: t('details.bestTime'), value: pin.bestTime },
    { icon: MapPin, label: t('details.travel'), value: pin.travel },
  ].filter((field) => field.value);

  const handleDelete = () => {
    deleteCustomPin(pin.id);
    onClose();
  };

  return (
    <>
      <div className="absolute top-12 left-0 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 p-4 rounded-xl font-mono animate-in fade-in duration-150">

        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b-2 border-black mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 border-2 border-black rounded-lg flex items-center justify-center text-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              {pin.icon || '📍'}
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-xs uppercase tracking-wider leading-tight break-words">{pin.title}</h4>
              <span className="inline-block text-[9px] bg-amber-400 border border-black px-1.5 py-0.5 rounded font-extrabold uppercase">
                {pin.tag || pin.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-red-100 border-2 border-black text-red-600 rounded-md flex items-center justify-center text-xs font-bold hover:bg-red-200 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Uploaded Photo — only when the user really uploaded one */}
        {previewImage && (
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
        )}

        {/* Description */}
        <p className="text-[11px] text-gray-700 font-sans leading-relaxed mb-4 border border-black p-2 bg-gray-50 rounded break-all">
          {pin.lore || t('map.defaultLore')}
        </p>

        {/* Hours / Entry Fee / Best Time / Travel */}
        {detailFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {detailFields.map((field) => (
              <div key={field.label} className="border-2 border-black rounded-lg p-2 bg-white min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <field.icon className="w-3 h-3 text-red-600 shrink-0" />
                  <span className="text-[9px] font-black uppercase text-red-600 truncate">{field.label}</span>
                </div>
                <div className="text-[11px] font-black leading-snug break-words">{field.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t-2 border-black">
          <div className="flex gap-1.5">
            <button
              onClick={() => toggleFavorite(pin.title)}
              className={`flex-1 text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${isFav ? 'bg-red-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            >
              <Heart className={`w-3 h-3 ${isFav ? 'fill-white' : ''}`} /> {isFav ? t('map.fav') : t('map.unfav')}
            </button>
            <button
              onClick={() => navigateTo('details', pin)}
              className="flex-1 bg-[#cc0000] hover:bg-red-700 text-white text-[10px] font-black px-2.5 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              {t('common.details')} →
            </button>
          </div>
          <div className="flex items-center gap-2">
            {pin.isUserUploaded ? (
              <button
                onClick={handleDelete}
                className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> {t('common.delete')}
              </button>
            ) : null}
            <button
              onClick={() => setShowReport(true)}
              className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3" /> {t('map.reportLocationTitle')}
            </button>
          </div>
        </div>

        <ReportLocationModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          locationName={pin.title}
          mapId={pin.id || null}
        />
      </div>
    </>
  );
}