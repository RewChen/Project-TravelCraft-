import { useState, useRef, useEffect } from 'react';
import { Compass, Bell, Settings, User, X, CheckCheck, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, isAdminLoggedIn, setAuthMode, activeCommunityMap, userProfile, t, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications, communityMaps } = useApp();
  const avatar = userProfile?.avatar || '🏃';
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setShowNotifications(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showNotifications]);

  return (
    <header className="bg-white border border-slate-200 rounded-full p-3 px-5 mb-6 shadow-none flex items-center justify-between sticky top-4 z-50 transition-colors duration-200 backdrop-blur-sm">
      <div 
        onClick={() => navigateTo('home')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 bg-[#cc0000] rounded-full border-2 border-black flex items-center justify-center">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-lg tracking-wider text-[#cc0000] uppercase hidden sm:block">
          TravelCraft
        </span>
      </div>

      <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 text-sm font-bold">
        <button 
          onClick={() => navigateTo('home')}
className={`${currentPage === 'home' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          {t('nav.home')}
        </button>

        <button 
          onClick={() => navigateTo('community')}
className={`${currentPage === 'community' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          {t('nav.community')}
        </button>

        {/* World Map — shown when a map is being tracked */}
        {activeCommunityMap && (
          <button 
            onClick={() => navigateTo('map')}
className={`${currentPage === 'map' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
          >
            {t('nav.worldMap')}
          </button>
        )}

        <button 
          onClick={() => navigateTo('mymaps')}
className={`${currentPage === 'mymaps' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          {t('nav.myMaps')}
        </button>

        {/* Admin Command Center — only visible when logged in with an Admin account */}
        {isLoggedIn && isAdminLoggedIn && (
          <button 
            onClick={() => navigateTo('admin')}
            className={`${
              currentPage === 'admin' 
                ? 'bg-[#cc0000] text-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-2 border-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
            } flex items-center gap-1.5`}
          >
            <span>{t('nav.admin')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse"></span>
          </button>
        )}

      </nav>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            title={t('notifications.title')}
            aria-label={t('notifications.title')}
            className="w-9 h-9 border border-slate-200 rounded-full flex items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-none cursor-pointer relative"
          >
            <Bell className="w-4 h-4 text-black" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#cc0000] text-white text-[10px] font-black border border-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-[60] font-mono">
              <div className="bg-[#cc0000] text-white px-4 py-3 border-b-4 border-black flex items-center justify-between">
                <span className="text-xs font-black uppercase flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> {t('notifications.title')} {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                <button onClick={() => setShowNotifications(false)} className="w-6 h-6 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-100"><X className="w-3 h-3" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-2xl mb-2">🔕</div>
                    <p className="text-xs font-bold text-gray-500">{t('notifications.empty')}</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-gray-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.data?.mapId) {
                            const target = notifications.find((x) => x.id === n.id);
                            // try to navigate to that community map
                            const map = communityMaps?.find((m) => m.id === n.data.mapId);
                            if (map) { navigateTo('details', map.details); setShowNotifications(false); }
                            else { navigateTo('community'); setShowNotifications(false); }
                          }
                        }}
                        className={`p-3 flex gap-3 hover:bg-amber-50 cursor-pointer ${!n.read ? 'bg-amber-50/60' : 'bg-white'}`}
                      >
                        <div className="w-8 h-8 border-2 border-black rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">{n.icon || '🔔'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black leading-tight truncate">
                            {(() => {
                              const args = n.titleParam ? { title: n.titleParam, name: n.messageParam } : n.titleArgs || (n.titleParam ? { title: n.titleParam } : undefined);
                              const txt = n.titleKey ? t(n.titleKey, args) : '';
                              return txt !== n.titleKey ? txt : n.title || n.titleKey;
                            })()}
                          </p>
                          <p className="text-[11px] text-gray-600 font-sans leading-tight line-clamp-2">
                            {(() => {
                              const args = n.messageParam ? { name: n.messageParam, title: n.titleParam } : n.messageArgs;
                              const txt = n.messageKey ? t(n.messageKey, args) : '';
                              return txt !== n.messageKey ? txt : n.message || '';
                            })()}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">{n.time}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-[#cc0000] rounded-full mt-1.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 bg-gray-50 border-t-2 border-black flex gap-2">
                  <button onClick={markAllNotificationsRead} className="flex-1 py-1.5 bg-white border-2 border-black rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-gray-100"><CheckCheck className="w-3 h-3" /> {t('notifications.markAllRead')}</button>
                  <button onClick={clearNotifications} className="px-3 py-1.5 bg-[#cc0000] text-white border-2 border-black rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-red-700"><Trash2 className="w-3 h-3" /> {t('notifications.clear')}</button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Settings — visible for all users (including unlogged-in) */}
        <button 
          onClick={() => navigateTo('settings')}
          title={t('nav.settings')}
          aria-label={t('nav.settings')}
          className="w-9 h-9 border border-slate-200 rounded-full items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-none hidden sm:flex cursor-pointer"
        >
          <Settings className="w-4 h-4 text-black" />
        </button>
        {isLoggedIn ? (
          <div 
            onClick={() => navigateTo('profile')} 
            className="w-9 h-9 bg-amber-400 border border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-300 shadow-none overflow-hidden" 
            title={t('nav.goToProfile')}
          >
            {avatar.startsWith('data:image') ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black">{avatar}</span>
            )}
          </div>
        ) : (
          <button 
            onClick={() => { setAuthMode('login'); navigateTo('auth'); }} 
            className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center bg-[#cc0000] text-white hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
