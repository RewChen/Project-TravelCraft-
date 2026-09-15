import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import WorldMapPage from './pages/WorldMapPage';
import DetailsPage from './pages/DetailsPage';
import MyMapsPage from './pages/MyMapsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import MapEditor from './pages/MapEditor';
import AdminDashboard from './pages/AdminDashboard';
import GlobalToast from './components/common/GlobalToast';

function AppContent() {
  const { currentPage, isAuthLoading, isLoggedIn, isAdminLoggedIn, globalSettings, navigateTo, setAuthMode, themeMode, t } = useApp();
  const isDarkMode = themeMode === 'dark';

  // Show loading screen while Supabase checks session
  if (isAuthLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-[#e8ecef]'} flex items-center justify-center font-mono`}>
        <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-4xl mb-4 animate-bounce">🗺️</div>
          <p className="font-black text-sm uppercase tracking-widest">Loading Save Data...</p>
          <div className="mt-3 flex justify-center gap-1">
            <span className="w-2 h-2 bg-[#cc0000] rounded-full animate-bounce [animation-delay:0ms]"></span>
            <span className="w-2 h-2 bg-[#cc0000] rounded-full animate-bounce [animation-delay:150ms]"></span>
            <span className="w-2 h-2 bg-[#cc0000] rounded-full animate-bounce [animation-delay:300ms]"></span>
          </div>
        </div>
      </div>
    );
  }

  // Maintenance gate: block non-admin users from accessing the app
  if (!isAuthLoading && isLoggedIn && !isAdminLoggedIn && globalSettings?.maintenanceMode && currentPage !== 'admin') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#e8ecef] text-gray-900'} flex items-center justify-center font-mono p-4`}>
        <div className={`w-full max-w-md ${isDarkMode ? 'bg-slate-900' : 'bg-white'} border-4 border-black rounded-2xl p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-4`}>
          <div className="text-4xl">🛠️</div>
          <h2 className="text-xl font-black uppercase">{t('maintenance.title')}</h2>
          <p className="text-xs text-gray-600 font-sans font-bold leading-relaxed">
            {t('maintenance.message')}
          </p>
          <button
            onClick={() => navigateTo('auth')}
            className="bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer"
          >
            {t('admin.logOutSystem')}
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'auth') {
    return (
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#e8ecef] text-gray-900'} font-mono antialiased transition-colors duration-200`}>
        <AuthPage />
      </div>
    );
  }

  if (currentPage === 'admin') {
    return (
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#e8ecef] text-gray-900'} font-mono antialiased transition-colors duration-200`}>
        <AdminDashboard />
      </div>
    );
  }

  if (currentPage === 'editor') {
    // Map creation/production requires a real account — redirect guests to login.
    if (!isLoggedIn) {
      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#e8ecef] text-gray-900'} flex items-center justify-center font-mono p-4`}>
          <div className={`w-full max-w-md ${isDarkMode ? 'bg-slate-900' : 'bg-white'} border-4 border-black rounded-2xl p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-4`}>
            <div className="text-4xl">🗺️</div>
            <h2 className="text-xl font-black uppercase">{t('myMaps.loginRequired')}</h2>
            <button
              onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
              className="bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer"
            >
              {t('auth.submitLogin')}
            </button>
          </div>
        </div>
      );
    }
    return (
      <>
        <MapEditor onBack={() => navigateTo('mymaps')} />
        <GlobalToast />
      </>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#e8ecef] text-gray-900'} font-mono antialiased relative selection:bg-red-200 flex flex-col justify-between transition-colors duration-200`}>
      <div className={isDarkMode ? 'bg-slate-950' : 'bg-[#e8ecef]'}>
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <Header />
        </div>

        <main>
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'community' && <CommunityPage />}
          {currentPage === 'map' && <WorldMapPage />}
          {currentPage === 'details' && <DetailsPage />}
          {currentPage === 'mymaps' && <MyMapsPage />}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'settings' && <SettingsPage />}
          {!['home', 'community', 'map', 'details', 'mymaps', 'profile', 'settings'].includes(currentPage) && <HomePage />}
        </main>
      </div>

      <Footer />
      <GlobalToast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}