import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, User, X, CheckCheck, Trash2, Map as MapIcon, ExternalLink, Shield, Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAvatarImage } from '../../lib/imageUtils';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, isAdminLoggedIn, setAuthMode, userProfile, t, language, setLanguage, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications, communityMaps } = useApp();
  const avatar = userProfile?.avatar || '🏃';
  const [showNotifications, setShowNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
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
    <header className="font-thai sticky top-0 z-40 w-full bg-brand-cream/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(45,58,46,0.08),0_8px_24px_-18px_rgba(45,58,46,0.25)] dark:bg-slate-800/90 dark:shadow-none" >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center h-16 md:h-[72px]">

        {/* Desktop left links */}
        <div className="hidden md:flex items-center gap-7">
          <button
            onClick={() => navigateTo('home')}
            className={`text-sm tracking-wide uppercase transition-colors cursor-pointer ${currentPage === 'home' ? 'text-brand-dark dark:text-slate-100 font-bold' : 'text-brand-dark/70 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100'}`}
          >
            {t('nav.home')}
          </button>
          <button
            onClick={() => navigateTo('community')}
            className={`text-sm tracking-wide uppercase transition-colors cursor-pointer ${currentPage === 'community' ? 'text-brand-dark dark:text-slate-100 font-bold' : 'text-brand-dark/70 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100'}`}
          >
            {t('nav.community')}
          </button>
          <button
            onClick={() => navigateTo('mymaps')}
            className={`text-sm tracking-wide uppercase transition-colors cursor-pointer ${currentPage === 'mymaps' ? 'text-brand-dark dark:text-slate-100 font-bold' : 'text-brand-dark/70 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100'}`}
          >
            {t('nav.myMaps')}
          </button>
          {isLoggedIn && isAdminLoggedIn && (
            <button
              onClick={() => navigateTo('admin')}
              className="flex items-center gap-1.5 text-sm text-[#cc0000] tracking-wide uppercase hover:opacity-75 transition-opacity cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> {t('nav.admin')}
            </button>
          )}
        </div>

        {/* Center logo */}
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
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer select-none"
        >
          <img src="/logo.png" alt="TravelCraft Logo" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
          <span className="text-xl text-brand-dark tracking-tight font-extrabold dark:text-red-300 hidden sm:block">TRAVELCRAFT</span>
        </div>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center ml-auto gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            title={t('settings.language')}
            aria-label={t('settings.language')}
            className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold uppercase text-brand-dark/60 hover:text-brand-dark hover:bg-white/70 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Languages className="w-4 h-4" /> {language === 'en' ? 'ไทย' : 'EN'}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              title={t('notifications.title')}
              aria-label={t('notifications.title')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-brand-dark/60 hover:text-brand-dark hover:bg-white/70 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer relative"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#cc0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white dark:bg-slate-800 border border-brand-dark/10 dark:border-slate-600 rounded-2xl shadow-[0_20px_50px_-20px_rgba(45,58,46,0.3)] overflow-hidden z-[60]">
                <div className="bg-brand-dark text-white px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Bell className="w-4 h-4" /> {t('notifications.title')} {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="text-2xl mb-2">🔕</div>
                      <p className="text-xs font-medium text-brand-dark/50 dark:text-gray-400">{t('notifications.empty')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-light dark:divide-slate-700">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          role="button"
                          tabIndex={0}
                          title={getNotificationTitle(n)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); } }}
                          className={`w-full text-left p-3 flex gap-3 hover:bg-brand-light/60 dark:hover:bg-slate-700 cursor-pointer transition-colors ${!n.read ? 'bg-brand-light/50 dark:bg-slate-700/50' : 'bg-white dark:bg-slate-800'}`}
                        >
                          <div className="w-8 h-8 border border-brand-dark/10 dark:border-slate-600 rounded-lg bg-brand-light dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">{n.icon || '🔔'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate text-brand-dark dark:text-slate-100">{getNotificationTitle(n)}</p>
                            <p className="text-[11px] text-brand-dark/50 dark:text-gray-400 mt-0.5 line-clamp-2">{getNotificationMessage(n)}</p>
                            <p className="text-[10px] font-medium text-brand-dark/35 dark:text-gray-500 mt-1 flex items-center gap-1">
                              <span>{n.time}</span>
                              {getDestinationLabel(n) && (
                                <>
                                  <span className="text-brand-dark/20 dark:text-gray-600">•</span>
                                  <span className="text-[#cc0000] dark:text-red-400 flex items-center gap-0.5">
                                    <ExternalLink className="w-2.5 h-2.5" /> {getDestinationLabel(n)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-[#cc0000] rounded-full mt-2 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 bg-brand-light/60 dark:bg-slate-900 flex gap-2">
                    <button onClick={markAllNotificationsRead} className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-brand-dark/10 dark:border-slate-600 rounded-lg text-[10px] font-semibold uppercase flex items-center justify-center gap-1 hover:bg-brand-light dark:hover:bg-slate-600 transition-colors cursor-pointer"><CheckCheck className="w-3 h-3" /> {t('notifications.markAllRead')}</button>
                    <button onClick={clearNotifications} className="px-3 py-1.5 bg-[#cc0000] text-white rounded-lg text-[10px] font-semibold uppercase flex items-center justify-center gap-1 hover:bg-[#b30000] transition-colors cursor-pointer"><Trash2 className="w-3 h-3" /> {t('notifications.clear')}</button>
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-brand-dark/60 hover:text-brand-dark hover:bg-white/70 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {/* Profile */}
          {isLoggedIn ? (
            <div
              onClick={() => navigateTo('profile')}
              className="w-9 h-9 rounded-full border-2 border-brand-green overflow-hidden cursor-pointer hover:border-brand-dark transition-colors shrink-0"
              title={t('nav.goToProfile')}
            >
              {isAvatarImage(avatar) ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-light dark:bg-amber-900/40 flex items-center justify-center text-sm font-bold">{avatar}</div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-brand-dark text-white hover:bg-brand-green transition-colors cursor-pointer shrink-0"
              title={t('nav.profile')}
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto w-10 h-10 relative flex items-center justify-center cursor-pointer"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((p) => !p)}
        >
          <span className={`absolute w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${menuOpen ? 'rotate-45 translate-y-0' : '-translate-y-[3.5px]'}`} />
          <span className={`absolute w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${menuOpen ? '-rotate-45 translate-y-0' : 'translate-y-[3.5px]'}`} />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-brand-cream dark:bg-slate-900 z-40 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className={`flex flex-col items-center justify-center h-full gap-7 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-100 ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="TravelCraft Logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-extrabold text-brand-dark dark:text-red-300 tracking-tight">TRAVELCRAFT</span>
          </div>
          {[
            { page: 'home', label: t('nav.home') },
            { page: 'community', label: t('nav.community') },
            { page: 'mymaps', label: t('nav.mymaps') },
          ].map((item) => (
            <button key={item.page} onClick={() => { closeMenu(); navigateTo(item.page); }} className="text-3xl text-brand-dark dark:text-gray-200 tracking-tight hover:opacity-70 cursor-pointer">
              {item.label}
            </button>
          ))}
          {isLoggedIn && isAdminLoggedIn && (
            <button onClick={() => { closeMenu(); navigateTo('admin'); }} className="flex items-center gap-2 text-2xl text-[#cc0000] tracking-tight cursor-pointer">
              <Shield className="w-6 h-6" /> {t('nav.admin')}
            </button>
          )}
          <button
            onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold uppercase text-brand-dark/60 dark:text-gray-400 cursor-pointer"
          >
            <Languages className="w-4 h-4" /> {language === 'en' ? 'ไทย' : 'EN'}
          </button>
          <button
            onClick={() => { closeMenu(); if (!isLoggedIn) { setAuthMode('login'); navigateTo('auth'); return; } navigateTo('profile'); }}
            className="mt-2 inline-flex items-center px-8 py-3.5 bg-brand-dark text-white text-lg font-semibold tracking-wide rounded-full cursor-pointer"
          >
            {isLoggedIn ? t('nav.profile') : t('auth.submitLogin')}
          </button>
        </div>
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
            className="w-full max-w-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-3xl shadow-xl overflow-hidden font-thai"
          >
            <div className="bg-brand-dark text-white px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
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
