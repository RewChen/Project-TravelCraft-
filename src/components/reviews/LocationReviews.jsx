import { useMemo, useState } from 'react';
import { Star, BadgeCheck, ThumbsUp, Flag, PenLine } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ReviewModal from './ReviewModal';
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

// บันทึกสำรวจ & รีวิวจากเพื่อนร่วมทาง — สไตล์ Community Logbook
export default function LocationReviews() {
  const { t, language, selectedLocation, reviews, reportReview, voteHelpful } = useApp();
  const [reportedIds, setReportedIds] = useState([]);
  const [votedIds, setVotedIds] = useState(loadVotes);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null); // 'approved' | 'pending' | null

  const locationKey = selectedLocation?.id || selectedLocation?.title || selectedLocation?.name;

  const approved = useMemo(() => (
    (reviews || [])
      .filter((r) => r.status === 'approved' && (r.locationId === locationKey || r.locationName === (selectedLocation?.title || selectedLocation?.name)))
      .sort((a, b) => Number(b.pinned || false) - Number(a.pinned || false) || (b.helpful || 0) - (a.helpful || 0) || (b.createdAt || 0) - (a.createdAt || 0))
  ), [reviews, locationKey, selectedLocation]);

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

  return (
    <section>
      <p className="text-[11px] font-black tracking-[0.2em] text-emerald-900 uppercase">
        {t('details.logbookEyebrow')}
      </p>
      <div className="flex items-start justify-between gap-3 mt-1">
        <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
          {t('details.logbookTitle')} {t('details.reviewsCountParen', { count: approved.length })}
        </h2>
        <button
          type="button"
          onClick={() => { setReviewStatus(null); setReviewOpen(true); }}
          className="shrink-0 bg-[#cc0000] hover:bg-red-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <PenLine className="w-4 h-4" /> {t('details.writeReview')}
        </button>
      </div>

      {reviewStatus === 'pending' && (
        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border-2 border-amber-600 rounded-lg px-3 py-2 mt-3">
          {t('details.pendingNotice')}
        </p>
      )}
      {reviewStatus === 'approved' && (
        <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-600 rounded-lg px-3 py-2 mt-3">
          {t('details.reviewLiveNotice')}
        </p>
      )}

      {approved.length === 0 ? (
        <p className="text-xs font-bold text-gray-500 text-center py-8">{t('details.noReviews')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {approved.map((review, idx) => (
            <Reveal key={review.id} delay={Math.min(idx, 5) * 70} className="h-full">
            <article className="bg-indigo-50/60 border border-indigo-100/70 rounded-2xl p-4 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {review.avatar ? (
                    <img src={review.avatar} alt={review.authorName} className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                      {(review.authorName || 'T').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-black truncate flex items-center gap-1">
                      {review.authorName}
                      {review.gpsVerified && <BadgeCheck className="w-4 h-4 text-amber-600 shrink-0" />}
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 truncate">
                      Lv.{review.authorLevel || 1} {review.authorTitle || 'Trail Walker'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{timeAgo(review.createdAt, language)}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= Math.round(review.rating) ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} strokeWidth={2} />
                  ))}
                </span>
                <span className="text-sm font-black">{Number(review.rating).toFixed(1)}</span>
              </div>

              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-white/70 border border-gray-200 rounded-full px-2.5 py-1">
                  <span className="text-gray-400 font-black">#</span> {review.locationName}
                </span>
              </div>

              {review.text && (
                <p className="text-[13px] font-sans leading-relaxed text-gray-700 mt-2.5 break-words line-clamp-4">{review.text}</p>
              )}

              {review.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                  {review.images.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} alt={`review-${idx}`} loading="lazy" className="aspect-square w-full object-cover rounded-lg" />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={() => handleHelpful(review.id)}
                  disabled={votedIds.includes(review.id)}
                  className={`text-[11px] font-bold flex items-center gap-1.5 ${votedIds.includes(review.id) ? 'text-emerald-700 cursor-default' : 'text-gray-500 hover:text-emerald-700 cursor-pointer'}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${votedIds.includes(review.id) ? 'fill-emerald-200' : ''}`} />
                  {t('details.helpful')} ({review.helpful || 0})
                </button>
                {review.gpsVerified ? (
                  <span className="text-[10px] font-black tracking-widest text-amber-700 uppercase">Verified check-in</span>
                ) : (
                  reportedIds.includes(review.id) ? (
                    <span className="text-[10px] font-bold text-gray-400">{t('details.reportedReview')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { reportReview(review.id); setReportedIds((prev) => [...prev, review.id]); }}
                      className="text-[10px] font-bold text-gray-300 hover:text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Flag className="w-3 h-3" /> {t('details.reportReview')}
                    </button>
                  )
                )}
              </div>
            </article>
            </Reveal>
          ))}
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
