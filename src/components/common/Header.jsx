import { Compass, Bell, Settings, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, isAdminLoggedIn, setAuthMode, activeCommunityMap, userProfile, t } = useApp();
  const avatar = userProfile?.avatar || '🏃';

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
        <button className="w-9 h-9 border border-slate-200 rounded-full flex items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-none cursor-pointer">
          <Bell className="w-4 h-4 text-black" />
        </button>
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
