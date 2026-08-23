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

function AppContent() {
  const { currentPage, activeCommunityMap, navigateTo } = useApp();

  if (currentPage === 'auth') {
    return <AuthPage />;
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
          {currentPage === 'map' && (
            activeCommunityMap ? <WorldMapPage /> : <CommunityPage />
          )}
          {currentPage === 'details' && <DetailsPage />}
          {currentPage === 'mymaps' && <MyMapsPage />}
          {currentPage === 'profile' && <ProfilePage />}
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