import { useMemo, useState } from 'react';
import { Star, BadgeCheck, Heart, Flag, PenLine, BookOpen, ChevronDown, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ReviewModal from './ReviewModal';
import ReportReviewModal from './ReportReviewModal';
import DeleteReviewModal from './DeleteReviewModal';
import Reveal from '../motion/Reveal';

const timeAgo = (timestamp, language) => {
  try {
    const rtf = new Intl.RelativeTimeFormat(language || 'th', { numeric: 'auto' });
    const diffSec = Math.round(((timestamp || Date.now()) - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
    return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
  } catch {
    return '';
  }
};

const loadVotes = () => {
  try {
    const raw = localStorage.getItem('project_travelcraft_helpful_votes');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ROLE_LABEL_KEYS = {
  'Novice Traveler': 'auth.roleNovice',
  Cartographer: 'auth.roleCartographer',
  'Gym Leader': 'auth.roleGymLeader',
  'Game Master': 'auth.roleGameMaster',
};
const ADMIN_TITLES = ['Master Admin', 'System Lord'];

// Legacy reviews only carry a badge (authorTitle). Fall back to the closest
// role so old data still shows a sensible label instead of a stale Lv.X title.
const roleOf = (review) => (
  review.authorRole ||
  (ADMIN_TITLES.includes(review.authorTitle) ? 'Admin' : null) ||
  'Cartographer'
);
const roleLabel = (role, t) => (ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role || '');

// Traveler Reviews — สไตล์ Community Logbook
export default function LocationReviews() {
  const { t, language, selectedLocation, reviews, reportReview, voteHelpful, deleteReview, isAdminLoggedIn, userProfile } = useApp();
  const [reportedIds, setReportedIds] = useState([]);
  const [votedIds, setVotedIds] = useState(loadVotes);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null); // 'approved' | 'pending' | null
  const [starFilter, setStarFilter] = useState('all'); // 'all' | '1'..'5'
  const [visibleCount, setVisibleCount] = useState(9);
  const [fullReview, setFullReview] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [photoView, setPhotoView] = useState(null); // { review, idx } | null

  const locationKey = selectedLocation?.id || selectedLocation?.title || selectedLocation?.name;

  const approved = useMemo(() => (
    (reviews || [])
      .filter((r) => r.status === 'approved' && (r.locationId === locationKey || r.locationName === (selectedLocation?.title || selectedLocation?.name)))
      .sort((a, b) => Number(b.pinned || false) - Number(a.pinned || false) || (b.helpful || 0) - (a.helpful || 0) || (b.createdAt || 0) - (a.createdAt || 0))
  ), [reviews, locationKey, selectedLocation]);

  const starCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approved.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
      counts[s] += 1;
    });
    return counts;
  }, [approved]);

  const filtered = useMemo(() => {
    if (starFilter === 'all') return approved;
    const s = Number(starFilter);
    return approved.filter((r) => Math.round(Number(r.rating)) === s);
  }, [approved, starFilter]);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;
  const hasMore = visibleCount < filtered.length;

  const handleHelpful = (id) => {
    if (votedIds.includes(id)) return;
    voteHelpful(id);
    const next = [...votedIds, id];
    setVotedIds(next);
    try {
      localStorage.setItem('project_travelcraft_helpful_votes', JSON.stringify(next));
    } catch {
      // storage เต็มก็ข้ามไป คะแนนยังอยู่ใน state
    }
  };

  const handleStarFilter = (value) => {
    setStarFilter(value);
    setVisibleCount(9);
  };

  const avatarBlock = (review) => (
    review.avatar ? (
      <img src={review.avatar} alt={review.authorName} className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
    ) : (
      <span className="w-11 h-11 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-lg shrink-0">
        {(review.authorName || 'T').charAt(0).toUpperCase()}
      </span>
    )
  );

  const isOwnReview = (review) => Boolean(userProfile?.id) && review.authorId === userProfile.id;
  const canDeleteReview = (review) => isAdminLoggedIn === true || isOwnReview(review);

  const actionsBlock = (review, compact) => (
    <div className={`flex items-center justify-between ${compact ? 'mt-3 pt-2.5 border-t border-brand-dark/[0.06]' : 'mt-4 pt-3 border-t border-brand-dark/[0.06]'}`}>
<button
                  type="button"
                  onClick={() => handleHelpful(review.id)}
                  disabled={votedIds.includes(review.id)}
                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${votedIds.includes(review.id) ? 'text-[#cc0000] cursor-default' : 'text-brand-dark/50 hover:text-[#cc0000] cursor-pointer'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${votedIds.includes(review.id) ? 'fill-[#cc0000] text-[#cc0000]' : ''}`} />
                  {t('details.like')} ({review.helpful || 0})
                </button>
<div className="flex items-center gap-2 min-w-0">
        {canDeleteReview(review) && (
          <button
            type="button"
            onClick={() => setDeleting(review)}
            title={t('details.deleteReview')}
            className="text-[10px] font-semibold text-brand-dark/30 hover:text-[#cc0000] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        {review.gpsVerified ? (
          <span className="text-[10px] font-semibold tracking-widest text-amber-700 uppercase whitespace-nowrap">Verified check-in</span>
        ) : (
          reportedIds.includes(review.id) ? (
            <span className="text-[10px] font-medium text-brand-dark/40">{t('details.reportedReview')}</span>
          ) : (
            <button
              type="button"
              onClick={() => setReporting(review)}
              className="text-[10px] font-medium text-brand-dark/40 hover:text-[#cc0000] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Flag className="w-3 h-3" /> {t('details.reportReview')}
            </button>
          )
        )}
      </div>
    </div>
  );

  const starRow = (review, size) => (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`${size} ${star <= Math.round(Number(review.rating)) ? 'fill-amber-400 text-amber-500' : 'text-brand-dark/20'}`} strokeWidth={2} />
        ))}
      </span>
      <span className="text-sm font-bold">{Number(review.rating).toFixed(1)}</span>
    </div>
  );

  return (
    <section>
      <Reveal>
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
        <div className="flex items-center justify-between border-b border-brand-dark/[0.06] pb-3 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-brand-dark min-w-0">
            <BookOpen className="w-5 h-5 shrink-0" /> {t('details.reviewsTitle')} <span className="text-xs text-brand-dark/50 font-medium whitespace-nowrap">{t('details.reviewsCountParen', { count: approved.length })}</span>
          </h3>
          <button
            type="button"
            onClick={() => { setReviewStatus(null); setReviewOpen(true); }}
            className="shrink-0 bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <PenLine className="w-4 h-4" /> {t('details.writeReview')}
          </button>
        </div>

        {reviewStatus === 'approved' && (
          <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 mb-4">
            {t('details.reviewLiveNotice')}
          </p>
        )}

        {approved.length === 0 ? (
          <div className="border border-dashed border-brand-dark/25 rounded-3xl p-10 text-center space-y-4 bg-brand-light/40">
            <div className="text-5xl">📓</div>
            <p className="text-sm font-semibold uppercase text-brand-dark/50 max-w-md mx-auto">{t('details.noReviews')}</p>
            <button
              type="button"
              onClick={() => { setReviewStatus(null); setReviewOpen(true); }}
              className="inline-flex items-center gap-1.5 bg-brand-dark hover:bg-brand-green text-white font-semibold px-4 py-2.5 rounded-full text-[10px] uppercase transition-colors cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" /> {t('details.writeReview')}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-light/40 dark:bg-slate-700/40 p-3">
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => handleStarFilter(starFilter === String(stars) ? 'all' : String(stars))}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${starFilter === String(stars) ? 'bg-[#cc0000] text-white border-[#cc0000]' : 'bg-white border-brand-dark/15 hover:bg-amber-50'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${starFilter === String(stars) ? 'fill-white' : 'fill-amber-400 text-amber-500'}`} />
                    {stars} <span className="opacity-80">({starCounts[stars]})</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={starFilter}
                  onChange={(e) => handleStarFilter(e.target.value)}
                  className="appearance-none bg-white border border-brand-dark/15 rounded-full pl-3 pr-8 py-2 text-xs font-semibold cursor-pointer focus:outline-none"
                >
                  <option value="all">{t('details.allRatings')} ({approved.length})</option>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <option key={stars} value={String(stars)}>{'★'.repeat(stars)} ({starCounts[stars]})</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="border border-dashed border-brand-dark/25 rounded-3xl p-8 text-center bg-brand-light/40 mt-4">
                <p className="text-sm font-semibold uppercase text-brand-dark/50">{t('details.noReviews')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {visible.map((review, idx) => (
                  <Reveal key={review.id} delay={Math.min(idx, 5) * 70} className="h-full">
                  <article className="bg-brand-light/40 dark:bg-slate-700/40 rounded-3xl p-4 flex flex-col h-full">
                  <div>
                  <div className="flex justify-end mb-2">
                    <span className="text-[11px] font-medium text-brand-dark/50 whitespace-nowrap">{timeAgo(review.createdAt, language)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {avatarBlock(review)}
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate flex items-center gap-1">
                        {review.authorName}
                        {review.gpsVerified && <BadgeCheck className="w-4 h-4 text-amber-600 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-medium text-amber-700 truncate">
                        {roleLabel(roleOf(review), t)}
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="mt-2.5">{starRow(review, 'w-4 h-4')}</div>

                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark/60 bg-white rounded-full px-2.5 py-1">
                      <span className="text-brand-dark/40 font-bold">#</span> {review.locationName}
                    </span>
                  </div>

                  {review.text && (
                    <p
                      onClick={() => setFullReview(review)}
                      className="text-[13px] leading-relaxed text-brand-dark/75 mt-2.5 break-words line-clamp-2 cursor-pointer"
                    >
                      {review.text}
                    </p>
                  )}

                  {review.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                      {review.images.slice(0, 3).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoView({ review, idx })}
                          className="aspect-square w-full overflow-hidden rounded-xl cursor-zoom-in bg-brand-light"
                        >
                          <img src={url} alt={`review-${idx}`} loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setFullReview(review)}
                      className="inline-flex items-center gap-1.5 bg-brand-dark hover:bg-brand-green text-white text-[10px] font-semibold uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> {t('details.viewFullReview')}
                    </button>
                  </div>

                  {actionsBlock(review, true)}
                </article>
                </Reveal>
              ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 9)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-brand-light text-brand-dark font-semibold border border-brand-dark/15 rounded-full px-5 py-2.5 text-xs uppercase tracking-wide transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" /> {t('details.loadMore', { count: remaining })}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      </Reveal>

      {fullReview && (
        <div className="fixed inset-0 z-[100] bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFullReview(null)}>
          <div className="bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 border-b border-brand-dark/[0.06] pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {avatarBlock(fullReview)}
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate flex items-center gap-1">
                    {fullReview.authorName}
                    {fullReview.gpsVerified && <BadgeCheck className="w-4 h-4 text-amber-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] font-medium text-amber-700 truncate">
                    {roleLabel(roleOf(fullReview), t)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canDeleteReview(fullReview) && (
                  <button
                    type="button"
                    onClick={() => setDeleting(fullReview)}
                    title={t('details.deleteReview')}
                    className="bg-[#cc0000] hover:bg-[#b30000] text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFullReview(null)}
                  className="shrink-0 bg-brand-dark hover:bg-brand-green text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                >
                <X className="w-4 h-4" />
              </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3">
              <div>{starRow(fullReview, 'w-4 h-4')}</div>
              <span className="text-[11px] font-medium text-brand-dark/50 whitespace-nowrap">{timeAgo(fullReview.createdAt, language)}</span>
            </div>

            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark/60 bg-brand-light/70 rounded-full px-2.5 py-1">
                <span className="text-brand-dark/40 font-bold">#</span> {fullReview.locationName}
              </span>
            </div>

            {fullReview.text && (
              <p className="text-[14px] leading-relaxed text-brand-dark/80 mt-3 break-words">{fullReview.text}</p>
            )}

            {fullReview.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {fullReview.images.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoView({ review: fullReview, idx })}
                    className="aspect-square w-full overflow-hidden rounded-xl border border-brand-dark/10 cursor-zoom-in bg-brand-light"
                  >
                    <img src={url} alt={`review-${idx}`} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {actionsBlock(fullReview, false)}
          </div>
        </div>
      )}

      {reporting && (
        <ReportReviewModal
          review={reporting}
          onClose={(reason) => {
            if (reason) {
              reportReview(reporting.id);
              setReportedIds((prev) => [...prev, reporting.id]);
            }
            setReporting(null);
          }}
        />
      )}

      {deleting && (
        <DeleteReviewModal
          review={deleting}
          isAdmin={isAdminLoggedIn === true}
          onConfirm={(reason) => {
            deleteReview(deleting.id, reason);
            if (fullReview?.id === deleting.id) setFullReview(null);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      {photoView && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" onClick={() => setPhotoView(null)}>
          <button
            type="button"
            onClick={() => setPhotoView(null)}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
          {photoView.idx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPhotoView({ ...photoView, idx: photoView.idx - 1 }); }}
              className="absolute left-3 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {photoView.idx < photoView.review.images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPhotoView({ ...photoView, idx: photoView.idx + 1 }); }}
              className="absolute right-3 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <img
            src={photoView.review.images[photoView.idx]}
            alt="review-gallery"
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 bg-black/60 text-white text-xs font-black px-3 py-1.5 rounded-full">
            {photoView.idx + 1} / {photoView.review.images.length}
          </span>
        </div>
      )}

      {reviewOpen && (
        <ReviewModal
          location={selectedLocation}
          onClose={(review) => { setReviewOpen(false); if (review) setReviewStatus(review.status); }}
        />
      )}
    </section>
  );
}