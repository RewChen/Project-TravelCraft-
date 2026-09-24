import { useState } from 'react';
import { BarChart2, User, Heart, Share2, X, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { viewTierInfo, rarityColorForTier, rarityLabelKey } from '../../lib/mapViews';

export default function LocationStats() {
  const { selectedLocation, favorites, toggleFavorite, t, viewCountFor, effectiveRarityFor } = useApp();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const views = viewCountFor(selectedLocation);
  const tier = effectiveRarityFor(selectedLocation);
  const tierInfo = viewTierInfo(views, tier);
  const tierLabel = t(rarityLabelKey(tier));

  const isFav = favorites.includes(selectedLocation.title);
  const shareUrl = window.location.href;
  const shareText = t('details.shareText', { title: selectedLocation.title });
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
    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 pb-3 border-b border-brand-dark/[0.06] text-brand-dark">
        <BarChart2 className="w-5 h-5 text-brand-green" /> {t('details.statsTitle')}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full shadow-sm ${rarityColorForTier(tier)}`}>
            {tierLabel}
          </span>
          <span className="text-xs font-semibold text-brand-dark">
            👁 {t('details.viewsCount', { count: views })}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-brand-light overflow-hidden">
          <div 
            className="h-full bg-brand-green rounded-full transition-all duration-500" 
            style={{ width: `${Math.round(tierInfo.progress * 100)}%` }}
          ></div>
        </div>
        <p className="text-[10px] font-medium text-brand-dark/50 mt-1.5">
          {tierInfo.nextTier
            ? t('details.nextTier', { count: tierInfo.remaining, tier: t(rarityLabelKey(tierInfo.nextTier)) })
            : t('details.maxTier')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-5">
        <div className="bg-brand-light/60 dark:bg-slate-700/60 rounded-2xl p-3 text-center">
          <User className="w-4 h-4 mx-auto text-brand-green mb-1" />
          <div className="text-[9px] font-semibold text-brand-dark/50 uppercase">{t('details.visitors')}</div>
          <div className="text-xs font-bold text-brand-dark">{views}</div>
        </div>
      </div>

      <button 
        onClick={() => toggleFavorite(selectedLocation.title)}
        className={`w-full ${
          isFav ? 'bg-amber-400 text-brand-dark' : 'w-full bg-[#cc0000] text-white hover:bg-[#b30000]'
        } font-semibold py-2.5 px-4 rounded-full mb-3 flex items-center justify-center gap-2 text-sm transition-colors`}
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-brand-dark' : 'fill-white'}`} />
        {isFav ? t('details.inFavorites') : t('details.addToFavorites')}
      </button>

      <button onClick={() => setShowShare(true)} className="w-full bg-brand-light/70 dark:bg-slate-700/70 hover:bg-brand-light dark:hover:bg-slate-700/60 text-brand-dark dark:text-slate-100 font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 text-xs transition-colors">
        <Share2 className="w-4 h-4" /> {t('details.shareLocation')}
      </button>

      {showShare && <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
        <div className="w-full max-w-md bg-white text-brand-dark border border-brand-dark/10 rounded-3xl p-5 shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)]" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between pb-3">
            <h2 className="font-bold text-lg">{t('details.shareTitle')}</h2>
            <button onClick={() => setShowShare(false)} title={t('common.close')} className="w-8 h-8 hover:bg-brand-light rounded-full flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-brand-dark/60 mt-4 mb-5">{shareText}</p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="text-xs font-semibold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-2xl font-black">f</span>{t('details.facebook')}</button>
            <button onClick={() => window.open(`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')} className="text-xs font-semibold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center"><Share2 className="w-6 h-6" /></span>{t('details.messages')}</button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')} className="text-xs font-semibold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center"><Share2 className="w-6 h-6" /></span>{t('details.whatsapp')}</button>
            <button onClick={copyLink} className="text-xs font-semibold"><span className="mx-auto mb-1 w-12 h-12 rounded-full bg-brand-dark flex items-center justify-center text-white"><Copy className="w-5 h-5" /></span>{copied ? t('details.copied') : t('details.copyLink')}</button>
          </div>
          <div className="flex gap-2 bg-brand-light/60 border border-brand-dark/10 rounded-full p-1.5 pl-3">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-xs text-brand-dark outline-none" />
            <button onClick={copyLink} className="border border-brand-dark/20 rounded-full px-3 py-1 text-xs font-semibold bg-white">{copied ? t('common.copied') : t('common.copy')}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
