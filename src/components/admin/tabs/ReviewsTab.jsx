import { useMemo, useState } from 'react';
import {
  Star, Check, Pin, PinOff, EyeOff, Eye, MapPin, ShieldCheck, Image as ImageIcon, Trash2, CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import DeleteReviewModal from '../../reviews/DeleteReviewModal';

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

const DeleteAllConfirmModal = ({ isOpen, onClose, onConfirm, count, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden animate-in zoom-in-95 fade-in duration-150">
        <div className="bg-[#cc0000] border-b border-white/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg uppercase">{t('admin.deleteAllConfirmTitle')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-brand-dark leading-relaxed">
            {t('admin.confirmDeleteAll', { count })}
          </p>
          <div className="bg-red-50 ring-1 ring-red-200 rounded-2xl p-3">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">{t('admin.bulkDeleteWarning')}</p>
            <p className="text-[10px] text-red-700 font-sans mt-1">{t('admin.bulkDeleteDesc')}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full ring-1 ring-brand-dark/10 bg-white text-brand-dark/70 hover:bg-brand-light text-sm font-semibold uppercase transition-transform active:translate-y-0.5 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-full bg-[#cc0000] hover:bg-red-700 text-white text-sm font-semibold uppercase transition-transform active:translate-y-0.5 cursor-pointer"
            >
              {t('admin.deleteAllConfirmBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// หน้าตรวจสอบรีวิวการให้คะแนน — รีวิวเผยแพร่แล้วทันที admin แค่ตรวจยืนยันทีหลัง
export default function ReviewsTab() {
  const {
    t, language, reviews,
    approveReview, checkReview, hideReview, unhideReview, togglePinReview, deleteReview,
  } = useApp();

  const [queue, setQueue] = useState('all'); // all | unchecked | pending | approved | reported
  const [ratingFilter, setRatingFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const pendingCount = (reviews || []).filter((r) => r.status === 'pending').length;
  const approvedCount = (reviews || []).filter((r) => r.status === 'approved').length;
  const uncheckedCount = (reviews || []).filter((r) => !r.adminChecked && r.status !== 'hidden').length;
  const reportedCount = (reviews || []).filter((r) => (r.reports || 0) > 0 && r.status !== 'hidden').length;

  const locations = useMemo(() => {
    const names = new Set();
    for (const r of reviews || []) if (r.locationName) names.add(r.locationName);
    return [...names].sort();
  }, [reviews]);

  const visible = useMemo(() => {
    let list = reviews || [];
    if (queue === 'unchecked') list = list.filter((r) => !r.adminChecked && r.status !== 'hidden');
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

  const toggleSelectAll = () => {
    if (selectedIds.length === visible.length && visible.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visible.map(r => r.id));
    }
  };

  const batchApprove = () => {
    selectedIds.forEach((id) => approveReview(id));
    setSelectedIds([]);
  };
  const batchCheck = () => {
    selectedIds.forEach((id) => checkReview(id));
    setSelectedIds([]);
  };
  const batchReject = () => {
    selectedIds.forEach((id) => hideReview(id));
    setSelectedIds([]);
  };
  const handleDeleteAllClick = () => {
    if (visible.length > 0) setShowDeleteAllConfirm(true);
  };
  const confirmDeleteAll = () => {
    visible.forEach((r) => deleteReview(r.id, 'Admin bulk delete'));
    setShowDeleteAllConfirm(false);
    setSelectedIds([]);
  };

  const tabs = [
    { id: 'all', label: t('admin.allReviews'), count: (reviews || []).length, style: 'bg-emerald-600 text-white ring-emerald-800' },
    { id: 'unchecked', label: t('admin.uncheckedReviews'), count: uncheckedCount, style: 'bg-sky-400 text-brand-dark ring-sky-600' },
    { id: 'pending', label: t('admin.pendingReview'), count: pendingCount, style: 'bg-amber-400 text-brand-dark ring-amber-600' },
    { id: 'approved', label: t('admin.approvedReviews'), count: approvedCount, style: 'bg-white text-brand-dark ring-brand-dark/20' },
    { id: 'reported', label: t('admin.reportedReviews'), count: reportedCount, style: 'bg-[#cc0000] text-white ring-red-700' },
  ];

  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  return (
    <div className="space-y-4 font-thai">
      {/* Filter tabs + filters + batch ops */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setQueue(tab.id); setSelectedIds([]); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase shadow-[0_4px_20px_-10px_rgba(45,58,46,0.15)] cursor-pointer ${queue === tab.id ? tab.style + ' ring-2 ring-offset-1 ring-offset-brand-cream' : 'bg-white text-brand-dark/60 ring-1 ring-brand-dark/[0.06] hover:bg-brand-light'}`}
          >
            {tab.label} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px]">{tab.count}</span>
          </button>
        ))}

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full ring-1 ring-brand-dark/[0.06] bg-white text-xs font-semibold shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]"
        >
          <option value="all">{t('admin.ratingFilter')}: {t('admin.allRatings')}</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{'★'.repeat(s)} ({s}.0)</option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full ring-1 ring-brand-dark/[0.06] bg-white text-xs font-semibold shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] max-w-56"
        >
          <option value="all">{t('admin.locationFilter')}: {t('admin.allLocations')} ({locations.length})</option>
          {locations.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setPhotoOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] flex items-center gap-1.5 cursor-pointer ${photoOnly ? 'bg-indigo-600 text-white' : 'bg-white text-brand-dark/60 ring-1 ring-brand-dark/[0.06] hover:bg-brand-light'}`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> {t('admin.photoOnly')}
        </button>

        <div className="flex items-center gap-2 ml-auto bg-brand-light/40 p-1.5 rounded-full ring-1 ring-brand-dark/10">
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold uppercase cursor-pointer ${allSelected ? 'text-emerald-700' : 'text-brand-dark/40 hover:text-brand-dark'}`}
          >
            {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            SELECT ALL
          </button>
          <div className="w-px h-6 bg-brand-dark/10 mx-1"></div>
          <button
            type="button"
            onClick={batchApprove}
            disabled={!selectedIds.length}
            className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform active:translate-y-0.5 disabled:active:translate-y-0"
          >
            <Check className="w-4 h-4" /> {t('admin.approveSelected')} ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={batchCheck}
            disabled={!selectedIds.length}
            className="px-3 py-1.5 rounded-full bg-sky-400 hover:bg-sky-500 text-brand-dark text-xs font-semibold uppercase flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform active:translate-y-0.5 disabled:active:translate-y-0"
          >
            <ShieldCheck className="w-4 h-4" /> {t('admin.markCheckedSelected')} ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={batchReject}
            disabled={!selectedIds.length}
            className="px-3 py-1.5 rounded-full bg-red-100 hover:bg-red-200 text-[#cc0000] text-xs font-semibold uppercase flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform active:translate-y-0.5 disabled:active:translate-y-0"
          >
            <EyeOff className="w-4 h-4" /> HIDE SELECTED
          </button>
          <button
            type="button"
            onClick={handleDeleteAllClick}
            disabled={visible.length === 0}
            className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform active:translate-y-0.5 disabled:active:translate-y-0"
          >
            <Trash2 className="w-4 h-4" /> {t('admin.deleteAllVisible')} ({visible.length})
          </button>
        </div>
      </div>

      <p className="text-xs text-brand-dark/50 font-medium pl-1 border-l-4 border-emerald-500">{t('admin.reviewsDesc')}</p>

      {/* Review cards */}
      <div className="space-y-4">
        {visible.length === 0 && (
          <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-10 text-center text-sm font-semibold text-brand-dark/40">
            {t('admin.noReviewsQueue')}
          </div>
        )}

        {visible.map((review) => {
          const checked = selectedIds.includes(review.id);
          return (
            <article key={review.id} className={`bg-white rounded-3xl ring-1 ${checked ? 'ring-emerald-500 bg-emerald-50/40' : 'ring-brand-dark/[0.06]'} shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-4 sm:p-5 flex gap-4 transition-colors`}>
              {/* Select */}
              <button
                type="button"
                onClick={() => toggleSelect(review.id)}
                aria-label="select review"
                className={`w-6 h-6 rounded-lg ring-1 shrink-0 mt-1 flex items-center justify-center cursor-pointer transition-colors ${checked ? 'bg-emerald-600 ring-emerald-600 text-white' : 'bg-white ring-brand-dark/15 hover:ring-brand-dark/40'}`}
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
                  {review.status === 'approved' && (
                    <span className="text-[10px] font-black uppercase text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200 bg-emerald-50">
                      <Check className="w-3 h-3" /> APPROVED
                    </span>
                  )}
                  {review.status === 'hidden' ? (
                    <span className="text-[10px] font-black uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> UNCHECKED
                    </span>
                  ) : review.adminChecked ? (
                    <span className="text-[10px] font-black uppercase text-sky-700 px-2 py-0.5 rounded flex items-center gap-1 border border-sky-200 bg-sky-50">
                      <ShieldCheck className="w-3 h-3" /> {t('admin.checkedBadge')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase bg-sky-400 text-black px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> {t('admin.uncheckedBadge')}
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

              {/* Actions - Smart Redesign */}
              <div className="w-36 shrink-0 flex flex-col gap-2">
                {/* Primary Action (Depending on status) */}
                {review.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => approveReview(review.id)}
                    className="w-full px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_-10px_rgba(45,58,46,0.2)] transition-transform active:translate-y-0.5"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} /> {t('admin.approve')}
                  </button>
                )}

                {review.status === 'approved' && !review.adminChecked && (
                  <button
                    type="button"
                    onClick={() => checkReview(review.id)}
                    className="w-full px-3 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_-10px_rgba(45,58,46,0.2)] transition-transform active:translate-y-0.5"
                  >
                    <ShieldCheck className="w-4 h-4" strokeWidth={3} /> {t('admin.markChecked')}
                  </button>
                )}

                {review.status === 'hidden' && (
                  <button
                    type="button"
                    onClick={() => unhideReview(review.id)}
                    className="w-full px-3 py-2 rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 text-xs font-semibold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:translate-y-0.5"
                  >
                    <Eye className="w-4 h-4" /> {t('admin.unhideReview')}
                  </button>
                )}

                {/* Secondary Actions */}
                {review.status !== 'hidden' && (
                  <button
                    type="button"
                    onClick={() => hideReview(review.id)}
                    className="w-full px-3 py-2 rounded-full bg-white ring-1 ring-brand-dark/10 text-brand-dark/60 hover:bg-brand-light hover:text-brand-dark text-[10px] font-semibold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> {review.status === 'pending' ? 'Reject' : t('admin.hideReview')}
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => togglePinReview(review.id)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center cursor-pointer transition-transform active:translate-y-0.5 ${review.pinned ? 'bg-amber-400 text-brand-dark' : 'bg-white text-brand-dark/40 hover:bg-brand-light hover:text-brand-dark ring-1 ring-brand-dark/10'}`}
                    title={review.pinned ? t('admin.unpinReview') : t('admin.pinReview')}
                  >
                    {review.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(review)}
                    title="Delete"
                    className="flex-1 py-1.5 rounded-full bg-red-50 text-red-500 hover:bg-[#cc0000] hover:text-white text-xs font-semibold flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {deleting && (
        <DeleteReviewModal
          review={deleting}
          isAdmin
          onConfirm={(reason) => {
            deleteReview(deleting.id, reason);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
      <DeleteAllConfirmModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={confirmDeleteAll}
        count={visible.length}
        t={t}
      />
    </div>
  );
}

