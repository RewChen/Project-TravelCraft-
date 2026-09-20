import { useRef, useState } from 'react';
import { Star, X, ImagePlus, Trash2, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressForUpload, fileToDataUrl } from '../../lib/imageUtils';

const MAX_PHOTOS = 4;

// ฟอร์มให้คะแนน + เขียนรีวิวสถานที่
// เปิดจากหน้า Details (ปุ่ม "เขียนรีวิว") — ส่งแล้วสถานะ pending รอ admin ตรวจสอบ
export default function ReviewModal({ location, onClose }) {
  const { t, submitReview } = useApp();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    const picked = Array.from(files || []).slice(0, MAX_PHOTOS - photos.length);
    if (!picked.length) return;
    setSending(true);
    try {
      const urls = [];
      for (const file of picked) {
        const compressed = await compressForUpload(file, { maxWidth: 1024, quality: 0.72 });
        urls.push(await fileToDataUrl(compressed));
      }
      setPhotos((prev) => [...prev, ...urls.filter(Boolean)].slice(0, MAX_PHOTOS));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!text.trim() && !rating) {
      setError(t('details.reviewNeedsText'));
      return;
    }
    const review = submitReview({
      locationId: location?.id || location?.title || location?.name,
      locationName: location?.title || location?.name || 'Unknown location',
      region: location?.region || '',
      rating,
      text,
      images: photos,
      gpsVerified: false,
    });
    onClose(review);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onClose(null)}>
      <div className="w-full max-w-lg bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="bg-amber-400 border-b-4 border-black px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-black text-sm uppercase">{t('details.writeReview')}</h3>
            <p className="text-[11px] font-bold truncate">{location?.title || location?.name}</p>
          </div>
          <button type="button" onClick={() => onClose(null)} title={t('editor.close')} className="w-7 h-7 bg-white border-2 border-black rounded-lg flex items-center justify-center hover:bg-gray-100 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-black uppercase mb-1">{t('details.yourRating')}</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer"
                  aria-label={`${star} stars`}
                >
                  <Star
                    className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-black' : 'text-gray-300'}`}
                    strokeWidth={2}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-black">{(hoverRating || rating).toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">{t('details.writeReview')}</label>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t('details.reviewPh')}
              rows={4}
              className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-sans bg-gray-50 focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">{t('details.addPhotos')}</label>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative aspect-square border-2 border-black rounded overflow-hidden group">
                  <img src={url} alt={`review-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 bg-[#cc0000] text-white border-2 border-black rounded-full hidden group-hover:flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={sending}
                  className="aspect-square border-2 border-dashed border-black rounded flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-amber-50 disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[9px] font-black">{photos.length}/{MAX_PHOTOS}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
          </div>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {t('details.submitReview')}
          </button>
        </form>
      </div>
    </div>
  );
}
