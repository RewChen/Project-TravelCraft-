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
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} flex items-center justify-center font-thai`}>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-[0_10px_30px_-14px_rgba(45,58,46,0.18)] border border-brand-dark/10">
          <div className="text-4xl mb-4 animate-bounce">🗺️</div>
          <p className="font-bold text-sm uppercase tracking-widest">Loading Save Data...</p>
          <div className="mt-3 flex justify-center gap-1">
            <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce [animation-delay:0ms]"></span>
            <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce [animation-delay:150ms]"></span>
            <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce [animation-delay:300ms]"></span>
          </div>
        </div>
      </div>
    );
  }

  // Maintenance gate: block non-admin users from accessing the app
  if (!isAuthLoading && isLoggedIn && !isAdminLoggedIn && globalSettings?.maintenanceMode && currentPage !== 'admin') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} flex items-center justify-center font-thai p-4`}>
        <div className={`w-full max-w-md ${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-3xl p-8 shadow-[0_10px_30px_-14px_rgba(45,58,46,0.18)] border border-brand-dark/10 text-center space-y-4`}>
          <div className="text-4xl">🛠️</div>
          <h2 className="text-xl font-bold uppercase">{t('maintenance.title')}</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('maintenance.message')}
          </p>
          <button
            onClick={() => navigateTo('auth')}
            className="bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 px-5 rounded-full text-xs uppercase cursor-pointer transition-colors"
          >
            {t('admin.logOutSystem')}
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'auth') {
    return (
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} font-thai antialiased transition-colors duration-200`}>
        <AuthPage />
      </div>
    );
  }

  if (currentPage === 'admin') {
    return (
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} font-thai antialiased transition-colors duration-200`}>
        <AdminDashboard />
      </div>
    );
  }

  if (currentPage === 'editor') {
    // Map creation/production requires a real account — redirect guests to login.
    if (!isLoggedIn) {
      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} flex items-center justify-center font-thai p-4`}>
          <div className={`w-full max-w-md ${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-3xl p-8 shadow-[0_10px_30px_-14px_rgba(45,58,46,0.18)] border border-brand-dark/10 text-center space-y-4`}>
            <div className="text-4xl">🗺️</div>
            <h2 className="text-xl font-bold uppercase">{t('myMaps.loginRequired')}</h2>
            <button
              onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
              className="bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 px-5 rounded-full text-xs uppercase cursor-pointer transition-colors"
            >
              {t('auth.submitLogin')}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={`${isDarkMode ? 'dark' : ''} h-screen`}>
        <MapEditor onBack={() => navigateTo('mymaps')} />
        <GlobalToast />
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} font-thai antialiased relative flex flex-col justify-between transition-colors duration-200`}>
      <div className={isDarkMode ? 'bg-slate-950' : 'bg-brand-cream'}>
        <Header />

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