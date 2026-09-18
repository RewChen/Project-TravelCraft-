import { useMemo, useState } from 'react';
import {
  Star, Check, X, Pin, PinOff, EyeOff, Eye, MapPin, ShieldCheck, Image as ImageIcon, Trash2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const timeAgo = (timestamp, language) => {
  try {
    const rtf = new Intl.RelativeTimeFormat(language || 'th', { numeric: 'auto' });
    const diffSec = Math.round(((timestamp || Date.now()) - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    return rtf.format(Math.round(diffSec / 86400), 'day');
  } catch {
    return '';
  }
};

const Stars = ({ value, size = 'w-4 h-4' }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`${size} ${star <= Math.round(value) ? 'fill-amber-500 text-amber-600' : 'text-gray-300'}`} strokeWidth={2} />
    ))}
  </span>
);

// หน้าตรวจสอบรีวิวการให้คะแนน — คิวงานผู้ดูแลก่อนเผยแพร่สู่ชุมชน
export default function ReviewsTab() {
  const {
    t, language, reviews,
    approveReview, hideReview, unhideReview, togglePinReview, deleteReview,
  } = useApp();

  const [queue, setQueue] = useState('all'); // all | pending | approved | reported
  const [ratingFilter, setRatingFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const pendingCount = (reviews || []).filter((r) => r.status === 'pending').length;
  const approvedCount = (reviews || []).filter((r) => r.status === 'approved').length;
  const reportedCount = (reviews || []).filter((r) => (r.reports || 0) > 0 && r.status !== 'hidden').length;

  const locations = useMemo(() => {
    const names = new Set();
    for (const r of reviews || []) if (r.locationName) names.add(r.locationName);
    return [...names].sort();
  }, [reviews]);

  const visible = useMemo(() => {
    let list = reviews || [];
    if (queue === 'pending') list = list.filter((r) => r.status === 'pending');
    if (queue === 'approved') list = list.filter((r) => r.status === 'approved');
    if (queue === 'reported') list = list.filter((r) => (r.reports || 0) > 0 && r.status !== 'hidden');
    if (ratingFilter !== 'all') list = list.filter((r) => Number(r.rating) === Number(ratingFilter));
    if (locationFilter !== 'all') list = list.filter((r) => r.locationName === locationFilter);
    if (photoOnly) list = list.filter((r) => r.images?.length > 0);
    return [...list].sort((a, b) =>
      Number(b.pinned || false) - Number(a.pinned || false) || (b.createdAt || 0) - (a.createdAt || 0));
  }, [reviews, queue, ratingFilter, locationFilter, photoOnly]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const batchApprove = () => {
    selectedIds.forEach((id) => approveReview(id));
    setSelectedIds([]);
  };
  const batchReject = () => {
    selectedIds.forEach((id) => hideReview(id));
    setSelectedIds([]);
  };

  const tabs = [
    { id: 'all', label: t('admin.allReviews'), count: (reviews || []).length, style: 'bg-emerald-600 text-white border-emerald-800' },
    { id: 'pending', label: t('admin.pendingReview'), count: pendingCount, style: 'bg-amber-400 text-black border-black' },
    { id: 'approved', label: t('admin.approvedReviews'), count: approvedCount, style: 'bg-white text-black border-black' },
    { id: 'reported', label: t('admin.reportedReviews'), count: reportedCount, style: 'bg-[#cc0000] text-white border-black' },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Filter tabs + filters + batch ops */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setQueue(tab.id); setSelectedIds([]); }}
            className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${queue === tab.id ? tab.style + ' ring-2 ring-offset-1 ring-black' : 'bg-white text-gray-700 border-black hover:bg-gray-50'}`}
          >
            {tab.label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/15 text-[10px]">{tab.count}</span>
          </button>
        ))}

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <option value="all">{t('admin.ratingFilter')}: {t('admin.allRatings')}</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{'★'.repeat(s)} ({s}.0)</option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-56"
        >
          <option value="all">{t('admin.locationFilter')}: {t('admin.allLocations')} ({locations.length})</option>
          {locations.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setPhotoOnly((v) => !v)}
          className={`px-2.5 py-1.5 rounded-lg border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer ${photoOnly ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> {t('admin.photoOnly')}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('admin.batchOps')}:</span>
          <button
            type="button"
            onClick={batchApprove}
            disabled={!selectedIds.length}
            className="px-3 py-1.5 rounded-lg border-2 border-black bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-4 h-4" /> {t('admin.approveSelected')} ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={batchReject}
            disabled={!selectedIds.length}
            className="px-3 py-1.5 rounded-lg border-2 border-black bg-red-100 hover:bg-red-200 text-[#cc0000] text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-4 h-4" /> {t('admin.rejectSelected')}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-bold pl-1 border-l-4 border-emerald-700">{t('admin.reviewsDesc')}</p>

      {/* Review cards */}
      <div className="space-y-4">
        {visible.length === 0 && (
          <div className="bg-white border-4 border-black rounded-2xl p-10 text-center text-sm font-black text-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {t('admin.noReviewsQueue')}
          </div>
        )}

        {visible.map((review) => {
          const checked = selectedIds.includes(review.id);
          return (
            <article key={review.id} className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex gap-4">
              {/* Select */}
              <button
                type="button"
                onClick={() => toggleSelect(review.id)}
                aria-label="select review"
                className={`w-6 h-6 rounded-md border-2 border-black shrink-0 mt-1 flex items-center justify-center cursor-pointer ${checked ? 'bg-emerald-700 text-white' : 'bg-white'}`}
              >
                {checked && <Check className="w-4 h-4" strokeWidth={4} />}
              </button>

              {/* Main */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {review.avatar ? (
                    <img src={review.avatar} alt={review.authorName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black">
                      {(review.authorName || 'T').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-black text-base">{review.authorName}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" /> {review.gpsVerified ? t('admin.gpsCheckin') : t('admin.inAppReview')}
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-gray-400">ID: #{review.id}</span>
                  {review.pinned && (
                    <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">{t('admin.pinnedBadge')}</span>
                  )}
                  {review.status === 'hidden' && (
                    <span className="text-[10px] font-black uppercase bg-gray-500 text-white px-2 py-0.5 rounded-full">{t('admin.hiddenBadge')}</span>
                  )}
                  {(review.reports || 0) > 0 && (
                    <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full">
                      ⚑ {review.reports}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {review.status === 'pending' && (
                    <span className="text-[10px] font-black uppercase bg-amber-400 text-black px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> {t('admin.pendingReview')}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-gray-400">{timeAgo(review.createdAt, language)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <Stars value={review.rating} />
                  <span className="font-black">{Number(review.rating).toFixed(1)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="inline-flex items-center gap-1 font-bold text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {review.locationName}
                  </span>
                  {review.region && <span className="text-[11px] font-bold text-gray-400">· {review.region}</span>}
                </div>

                {review.text && (
                  <p className="mt-2 text-sm font-sans leading-relaxed text-gray-800 break-words">“{review.text}”</p>
                )}

                {review.images?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                      {t('admin.evidencePhoto')} ({review.images.length} ATTACHMENTS)
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {review.images.map((url, idx) => (
                        <img key={idx} src={url} alt={`evidence-${idx}`} loading="lazy" className="w-28 h-20 object-cover rounded-lg border border-gray-200" />
                      ))}
                      <div className="w-28 h-20 rounded-lg bg-indigo-50 border border-indigo-100 p-1.5 text-indigo-950">
                        <p className="text-[9px] font-black flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SCAN {review.images.length}/{review.images.length}</p>
                        <p className="text-[8px] font-bold text-indigo-800 leading-tight mt-0.5 break-words">{review.locationName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-40 shrink-0 space-y-2">
                {review.status !== 'approved' ? (
                  <button
                    type="button"
                    onClick={() => approveReview(review.id)}
                    className="w-full px-3 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} /> {t('admin.approve')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => hideReview(review.id)}
                    className="w-full px-3 py-2 rounded-lg bg-emerald-900 text-white/40 text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-not-allowed"
                    disabled
                    title={review.id}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} /> {t('admin.approve')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => togglePinReview(review.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${review.pinned ? 'bg-amber-400 text-black' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900'}`}
                >
                  {review.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  {review.pinned ? t('admin.unpinReview') : t('admin.pinReview')}
                </button>
                {review.status === 'hidden' ? (
                  <button
                    type="button"
                    onClick={() => unhideReview(review.id)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-emerald-700 text-xs font-black uppercase flex items-center justify-center gap-1.5 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> {t('admin.unhideReview')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => hideReview(review.id)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-[#cc0000] text-xs font-black uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4" /> {t('admin.hideReview')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteReview(review.id)}
                  title={review.id}
                  className="w-full px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-600 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
