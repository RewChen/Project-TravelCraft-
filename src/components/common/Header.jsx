import { Compass, Search, Bell, Settings, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { currentPage, navigateTo, isLoggedIn, logout, setAuthMode, activeCommunityMap, userProfile } = useApp();

  return (
    <header className="bg-white border-4 border-black rounded-2xl p-3 px-5 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between sticky top-4 z-50">
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

      <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 text-sm font-bold">
        <button 
          onClick={() => navigateTo('home')}
          className={`${currentPage === 'home' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          Home
        </button>

        <button 
          onClick={() => navigateTo('community')}
          className={`${currentPage === 'community' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          Community Discoveries
        </button>

        {/* Show World Map option only if user has tracked/selected a map or active map is set */}
        {activeCommunityMap && (
          <button 
            onClick={() => navigateTo('map')}
            className={`${currentPage === 'map' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
          >
            🗺️ World Map
          </button>
        )}

        <button 
          onClick={() => navigateTo('mymaps')}
          className={`${currentPage === 'mymaps' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          My Maps
        </button>

        <button 
          onClick={() => navigateTo('profile')}
          className={`${currentPage === 'profile' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          Profile
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex relative items-center">
          <Search className="w-4 h-4 absolute left-2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search region..." 
            className="pl-8 pr-3 py-1.5 border-2 border-black rounded text-xs font-bold w-40 focus:outline-none focus:bg-amber-50"
          />
        </div>
        <button className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
          <Bell className="w-4 h-4 text-black" />
        </button>
        <button 
          onClick={() => navigateTo('profile')}
          className="w-9 h-9 border-2 border-black rounded-lg items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden sm:flex cursor-pointer"
        >
          <Settings className="w-4 h-4 text-black" />
        </button>
        {isLoggedIn ? (
          <div 
            onClick={logout} 
            className="w-9 h-9 bg-amber-400 border-2 border-black rounded-lg flex items-center justify-center cursor-pointer hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden" 
            title="Click to Logout"
          >
            {userProfile.avatar && userProfile.avatar.startsWith('data:image') ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black">{userProfile.avatar || '🏃'}</span>
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
