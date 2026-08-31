import { Compass, Bell, Settings, User, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, isAdminLoggedIn, logout, setAuthMode, activeCommunityMap, userProfile, themeMode, toggleTheme } = useApp();
  const avatar = userProfile?.avatar || '🏃';
  const isDark = themeMode === 'dark';

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-full p-3 px-5 mb-6 shadow-none flex items-center justify-between sticky top-4 z-50 transition-colors duration-200 backdrop-blur-sm">
      <div 
        onClick={() => navigateTo('home')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 bg-[#cc0000] rounded-full border-2 border-black flex items-center justify-center">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-lg tracking-wider text-[#cc0000] uppercase hidden sm:block">
          POCKET ODYSSEY
        </span>
      </div>

      <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 text-sm font-bold dark:text-slate-200">
        <button 
          onClick={() => navigateTo('home')}
          className={`${currentPage === 'home' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          Home
        </button>

        <button 
          onClick={() => navigateTo('community')}
          className={`${currentPage === 'community' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          Community Discoveries
        </button>

        {/* World Map — shown when a map is being tracked */}
        {activeCommunityMap && (
          <button 
            onClick={() => navigateTo('map')}
            className={`${currentPage === 'map' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
          >
            🗺️ World Map
          </button>
        )}

        <button 
          onClick={() => navigateTo('mymaps')}
          className={`${currentPage === 'mymaps' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          My Maps
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
            <span>🛡️ Admin</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse"></span>
          </button>
        )}

        {/* Profile */}
        <button 
          onClick={() => navigateTo('profile')}
          className={`${currentPage === 'profile' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 dark:text-slate-200 hover:text-black dark:hover:text-white border-2 border-transparent px-2'}`}
        >
          Profile
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 shadow-none cursor-pointer transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-black" />}
        </button>
        <button className="w-9 h-9 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 shadow-none cursor-pointer">
          <Bell className="w-4 h-4 text-black dark:text-slate-200" />
        </button>
        {/* Settings (Profile shortcut) — only for logged-in users */}
        {isLoggedIn && (
          <button 
            onClick={() => navigateTo('profile')}
            className="w-9 h-9 border border-slate-200 dark:border-slate-600 rounded-full items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 shadow-none hidden sm:flex cursor-pointer"
          >
            <Settings className="w-4 h-4 text-black dark:text-slate-200" />
          </button>
        )}
        {isLoggedIn ? (
          <div 
            onClick={() => navigateTo('profile')} 
            className="w-9 h-9 bg-amber-400 border border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-300 shadow-none overflow-hidden" 
            title="Go to Profile"
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
