import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, User, X, CheckCheck, Trash2, ChevronRight, Map as MapIcon, ExternalLink, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAvatarImage } from '../../lib/imageUtils';

const activeNav = 'bg-[#fce4c7] text-amber-800 px-3.5 py-1.5 rounded-full dark:bg-amber-900/30 dark:text-amber-200';
const inactiveNav = 'text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-full hover:bg-white/60 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10 transition-colors';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, isAdminLoggedIn, setAuthMode, userProfile, t, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications, communityMaps, language, setLanguage } = useApp();
  const avatar = userProfile?.avatar || '🏃';
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [easterEggCount, setEasterEggCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const notifRef = useRef(null);

  const getNotificationTitle = (n) => {
    if (!n) return '';
    const args = n.titleParam ? { title: n.titleParam, name: n.messageParam } : n.titleArgs || (n.titleParam ? { title: n.titleParam } : undefined);
    const txt = n.titleKey ? t(n.titleKey, args) : '';
    return txt !== n.titleKey ? txt : (n.title || n.titleKey || '');
  };

  const getNotificationMessage = (n) => {
    if (!n) return '';
    const args = n.messageParam ? { name: n.messageParam, title: n.titleParam } : n.messageArgs;
    const txt = n.messageKey ? t(n.messageKey, args) : '';
    return txt !== n.messageKey ? txt : (n.message || '');
  };

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setSelectedNotification({ ...n, read: true });
  };

  const resolveNotificationDestination = (n) => {
    if (!n) return { page: 'community', labelKey: 'nav.community' };
    if (n.data?.page) {
      const page = n.data.page;
      if (n.data.mapId) {
        const map = communityMaps?.find((m) => m.id === n.data.mapId);
        if (map) return { page: 'details', location: map, labelKey: 'nav.community' };
      }
      return { page, labelKey: pageLabelKey(page) };
    }
    if (n.data?.mapId) {
      const map = communityMaps?.find((m) => m.id === n.data.mapId);
      if (map) return { page: 'details', location: map, labelKey: 'nav.community' };
      return { page: 'community', labelKey: 'nav.community' };
    }
    const findMapByTitle = (titleParam) => {
      if (!titleParam || !communityMaps?.length) return null;
      const needle = String(titleParam).trim().toLowerCase();
      return communityMaps.find((m) => String(m.title || '').toLowerCase() === needle)
        || communityMaps.find((m) => String(m.title || '').toLowerCase().includes(needle));
    };
    switch (n.titleKey) {
      case 'notifications.publishedTitle':
      case 'notifications.newMapTitle':
      case 'notifications.mapUpdatedTitle': {
        const hit = findMapByTitle(n.titleParam);
        if (hit) return { page: 'details', location: hit, labelKey: 'nav.community' };
        return { page: 'community', labelKey: 'nav.community' };
      }
      case 'notifications.mapDeletedTitle':
        return { page: 'community', labelKey: 'nav.community' };
      case 'notifications.newUserTitle':
        return isAdminLoggedIn
          ? { page: 'admin', labelKey: 'nav.admin' }
          : { page: 'community', labelKey: 'nav.community' };
      case 'notifications.demo1Title':
        return { page: 'community', labelKey: 'nav.community' };
      case 'notifications.demo2Title':
        return { page: 'mymaps', labelKey: 'nav.myMaps' };
      case 'notifications.demo3Title':
        return { page: 'home', labelKey: 'nav.home' };
      default:
        return { page: 'community', labelKey: 'nav.community' };
    }
  };

  const pageLabelKey = (page) => {
    switch (page) {
      case 'home': return 'nav.home';
      case 'community': return 'nav.community';
      case 'map': return 'nav.worldMap';
      case 'mymaps': return 'nav.myMaps';
      case 'admin': return 'nav.admin';
      case 'profile': return 'nav.profile';
      case 'settings': return 'nav.settings';
      case 'details': return 'nav.community';
      default: return 'nav.community';
    }
  };

  const getDestinationLabel = (n) => {
    const dest = resolveNotificationDestination(n);
    try {
      const txt = t(dest.labelKey);
      if (txt && txt !== dest.labelKey) return txt;
    } catch { /* fallback below */ }
    return dest.page;
  };

  const handleGoToDestination = (n) => {
    const target = n || selectedNotification;
    if (!target) return;
    const dest = resolveNotificationDestination(target);
    if (dest.page === 'admin' && !(isLoggedIn && isAdminLoggedIn)) {
      navigateTo('community');
    } else if (dest.location) {
      navigateTo(dest.page, dest.location);
    } else {
      navigateTo(dest.page);
    }
    setSelectedNotification(null);
    setShowNotifications(false);
  };

  useEffect(() => {
    if (!showNotifications && !selectedNotification) return;
    const onClickOutside = (e) => {
      if (selectedNotification) return;
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        if (selectedNotification) setSelectedNotification(null);
        else setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showNotifications, selectedNotification]);

  return (
    <header className="font-thai bg-[#f0f1f3] dark:bg-slate-800 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-40 rounded-2xl mb-6">
      {/* ── Brand ── */}
      <div
        onClick={() => {
          navigateTo('home');
          const nextCount = easterEggCount + 1;
          if (nextCount >= 10) {
            setShowEasterEgg(true);
            setEasterEggCount(0);
          } else {
            setEasterEggCount(nextCount);
          }
        }}
        className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
      >
        <img src="/logo.png" alt="TravelCraft Logo" className="w-9 h-9 object-contain" />
        <span className="font-extrabold text-[15px] tracking-wide text-[#9b1c1c] dark:text-red-400 hidden sm:block">TRAVELCRAFT</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex items-center gap-1 text-[13px] font-semibold">
        <button
          onClick={() => navigateTo('home')}
          className={currentPage === 'home' ? activeNav : inactiveNav}
        >
          {t('nav.home')}
        </button>

        <button
          onClick={() => navigateTo('community')}
          className={currentPage === 'community' ? activeNav : inactiveNav}
        >
          {t('nav.community')}
        </button>

        <button
          onClick={() => navigateTo('mymaps')}
          className={currentPage === 'mymaps' ? activeNav : inactiveNav}
        >
          {t('nav.myMaps')}
        </button>

        {isLoggedIn && isAdminLoggedIn && (
          <button
            onClick={() => navigateTo('admin')}
            className="ml-1 bg-[#cc0000] text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-[#b30000] transition-colors text-[13px] font-bold"
          >
            <Shield className="w-3.5 h-3.5" />
            {t('nav.admin')}
          </button>
        )}


      </nav>

      {/* ── Right Icons ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            title={t('notifications.title')}
            aria-label={t('notifications.title')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer relative"
          >
            <Bell className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#cc0000] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-lg overflow-hidden z-[60] font-mono">
              <div className="bg-[#cc0000] text-white px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
                <span className="text-xs font-black uppercase flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> {t('notifications.title')} {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                <button onClick={() => setShowNotifications(false)} className="w-6 h-6 bg-white/20 hover:bg-white/40 text-white border-0 rounded flex items-center justify-center"><X className="w-3 h-3" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-2xl mb-2">🔕</div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('notifications.empty')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        role="button"
                        tabIndex={0}
                        title={getNotificationTitle(n)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); } }}
                        className={`p-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer group ${!n.read ? 'bg-orange-50/60 dark:bg-slate-700/50' : 'bg-white dark:bg-slate-800'}`}
                      >
                        <div className="w-8 h-8 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">{n.icon || '🔔'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black leading-tight truncate dark:text-slate-100">
                            {getNotificationTitle(n)}
                          </p>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 font-sans leading-tight line-clamp-2">
                            {getNotificationMessage(n)}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 flex items-center gap-1">
                            <span>{n.time}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-[#cc0000] dark:text-red-400 flex items-center gap-0.5 group-hover:underline">
                              <ExternalLink className="w-2.5 h-2.5" /> {getDestinationLabel(n)}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-start gap-1.5 shrink-0">
                          {!n.read && <span className="w-2 h-2 bg-[#cc0000] rounded-full mt-1.5" />}
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                  <button onClick={markAllNotificationsRead} className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"><CheckCheck className="w-3 h-3" /> {t('notifications.markAllRead')}</button>
                  <button onClick={clearNotifications} className="px-3 py-1.5 bg-[#cc0000] text-white border-0 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-[#b30000] transition-colors"><Trash2 className="w-3 h-3" /> {t('notifications.clear')}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigateTo('settings')}
          title={t('nav.settings')}
          aria-label={t('nav.settings')}
          className="w-9 h-9 rounded-full items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-colors hidden sm:flex cursor-pointer"
        >
          <Settings className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
        </button>

        {/* Profile */}
        {isLoggedIn ? (
          <div
            onClick={() => navigateTo('profile')}
            className="w-9 h-9 rounded-full border-[2.5px] border-amber-400 overflow-hidden cursor-pointer hover:border-amber-500 transition-colors shrink-0"
            title={t('nav.goToProfile')}
          >
            {isAvatarImage(avatar) ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-sm font-black">{avatar}</div>
            )}
          </div>
        ) : (
          <button
            onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-xl overflow-hidden font-mono"
          >
            <div className="bg-[#cc0000] text-white px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
              <span className="text-xs font-black uppercase flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> {t('notifications.title')}
              </span>
              <button
                onClick={() => setSelectedNotification(null)}
                aria-label={t('common.close')}
                className="w-6 h-6 bg-white/20 hover:bg-white/40 text-white rounded flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-gray-200 dark:border-slate-600 rounded-xl bg-orange-50 dark:bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                  {selectedNotification.icon || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black leading-snug break-words dark:text-slate-100">
                    {getNotificationTitle(selectedNotification)}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-1">
                    {selectedNotification.time}
                    {!selectedNotification.read && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 bg-[#cc0000] text-white text-[9px] rounded border-0 align-middle">NEW</span>
                    )}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap break-words">
                {getNotificationMessage(selectedNotification)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex gap-2">
              <button
                onClick={() => handleGoToDestination()}
                className="flex-1 py-2 bg-amber-400 border border-gray-200 dark:border-slate-600 rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-colors"
              >
                {resolveNotificationDestination(selectedNotification).page === 'details'
                  ? <MapIcon className="w-3.5 h-3.5" />
                  : <ExternalLink className="w-3.5 h-3.5" />}
                {getDestinationLabel(selectedNotification)}
              </button>
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors dark:text-slate-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowEasterEgg(false)}>
          <div
            className="relative w-full max-w-3xl bg-black border-4 border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden aspect-video flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowEasterEgg(false)} className="absolute top-4 right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-black z-10 hover:bg-gray-200 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Easter Egg Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
