import { MapPin, ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rarityColorForTier, rarityLabelKey } from '../../lib/mapViews';

// รูปปก: imageUrl ก่อน, ถ้าไม่มีให้ใช้รูป template (bgThemeUrl / editorState.backgroundImage)
// กรองค่า CSS gradient / 'none' ออก เหลือเฉพาะ path รูปจริง (/templates/..., http, data:)
const isImageSrc = (value) =>
  typeof value === 'string' &&
  value.trim() !== '' &&
  value !== 'none' &&
  !value.includes('gradient');

const resolveCoverImage = (location, fallbackImage) => {
  const candidates = [
    location?.imageUrl,
    location?.bgThemeUrl,
    location?.editorState?.backgroundImage,
  ];
  return candidates.find(isImageSrc) || fallbackImage;
};

export default function LocationHero() {
  const { selectedLocation, t, effectiveRarityFor } = useApp();
  const tier = effectiveRarityFor(selectedLocation);
  // Only show the country/region badge when there is a real user-set region.
  // Older maps may carry placeholder values (never store/display those).
  const placeholderRegions = new Set([
    'Custom Traveler Realm',
    'Custom Realm',
    'Unknown Region',
    'Global Realm',
    'Custom Realms'
  ]);
  const rawRegion = selectedLocation.region ? String(selectedLocation.region) : '';
  const displayRegion = rawRegion && !rawRegion.toLowerCase().startsWith('editor.')
    && !placeholderRegions.has(rawRegion)
    ? rawRegion
    : '';
  const fallbackImage = selectedLocation.title?.toLowerCase().includes('kyoto')
    ? 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&q=85'
    : selectedLocation.title?.toLowerCase().includes('grand canyon')
      ? 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1400&q=85'
      : 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1400&q=85';
  const coverImage = resolveCoverImage(selectedLocation, fallbackImage);
  const [coverFailed, setCoverFailed] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const displayCover = coverFailed ? fallbackImage : coverImage;

  return (
    <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <button type="button" onClick={() => setCoverPreviewOpen(true)} title="ดูรูปปกขนาดใหญ่" className="h-64 bg-slate-900 relative p-4 flex flex-col justify-between overflow-hidden w-full cursor-zoom-in">
        <img src={displayCover} alt={selectedLocation.title} onError={() => setCoverFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        {displayRegion && (
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 w-fit relative">
            <MapPin className="w-3 h-3" /> {displayRegion}
          </div>
        )}
        <ImageIcon className="absolute bottom-4 right-4 w-8 h-8 text-white/70" />
      </button>
      
      <div className="bg-[#cc0000] text-white p-5 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
          {selectedLocation.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className={`border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rarityColorForTier(tier)}`}>
            ◆ {t(rarityLabelKey(tier))}
          </span>
          <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ★ {selectedLocation.type || 'Landmark'}
          </span>
          <span className="bg-white text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            📷 {selectedLocation.tag || 'Scenic'}
          </span>
        </div>
      </div>
      {selectedLocation.videoUrl && (
        <div className="border-t-4 border-black bg-black p-4">
          {selectedLocation.videoUrl.startsWith('data:video/') ? (
            <video src={selectedLocation.videoUrl} controls className="w-full max-h-105 bg-black" />
          ) : (
            <iframe
              src={selectedLocation.videoUrl}
              title={t('details.videoTitle', { title: selectedLocation.title })}
              className="w-full aspect-video border-2 border-white"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      )}
      {coverPreviewOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setCoverPreviewOpen(false)}>
          <div className="w-full max-w-3xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black">
              <h3 className="font-black text-sm uppercase truncate">{selectedLocation.title}</h3>
              <button type="button" onClick={() => setCoverPreviewOpen(false)} title={t('editor.close')} className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={displayCover} alt={selectedLocation.title} onError={() => setCoverFailed(true)} className="w-full max-h-[70vh] object-contain bg-gray-100" />
          </div>
        </div>
      )}
    </div>
  );
}
