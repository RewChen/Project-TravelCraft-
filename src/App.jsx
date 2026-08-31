import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import WorldMapPage from './pages/WorldMapPage';
import DetailsPage from './pages/DetailsPage';
import MyMapsPage from './pages/MyMapsPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import MapEditor from './pages/MapEditor';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { currentPage, activeCommunityMap, isAuthLoading, isLoggedIn, navigateTo } = useApp();

  // Show loading screen while Supabase checks session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#e8ecef] flex items-center justify-center font-mono">
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

  if (currentPage === 'auth') {
    return <AuthPage />;
  }

  if (currentPage === 'admin') {
    return <AdminDashboard />;
  }

  if (currentPage === 'editor') {
    return <MapEditor onBack={() => navigateTo('mymaps')} />;
  }

  return (
    <div className="min-h-screen bg-[#e8ecef] text-gray-900 font-mono antialiased relative selection:bg-red-200 flex flex-col justify-between">
      <div>
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
          {!['home', 'community', 'map', 'details', 'mymaps', 'profile'].includes(currentPage) && <HomePage />}
        </main>
      </div>

      <Footer />
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