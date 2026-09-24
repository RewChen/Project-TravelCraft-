import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import SystemOverviewTab from '../components/admin/tabs/SystemOverviewTab';
import BaseMapsTab from '../components/admin/tabs/BaseMapsTab';
import UserManagementTab from '../components/admin/tabs/UserManagementTab';
import ReportedLocationsTab from '../components/admin/tabs/ReportedLocationsTab';
import ReviewsTab from '../components/admin/tabs/ReviewsTab';
import AddBaseMapModal from '../components/admin/modals/AddBaseMapModal';
import AuthPage from './AuthPage';
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function AdminDashboard() {
  const { adminActiveTab, adminToast, isLoggedIn, isAdminLoggedIn, userProfile, navigateTo, logout, setAuthMode, themeMode, t } = useApp();
  const isDarkMode = themeMode === 'dark';

  const [isAddBaseMapModalOpen, setIsAddBaseMapModalOpen] = useState(false);

  // 1. If not logged in at all, direct to normal login page
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  // 2. If logged in as regular player without admin role
  if (!isAdminLoggedIn && userProfile?.role?.toLowerCase() !== 'admin') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-brand-cream'} flex flex-col items-center justify-center p-4 font-thai`}>
        <div className={`w-full max-w-md ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-brand-dark'} border ${isDarkMode ? 'border-white/10' : 'border-brand-dark/10'} rounded-[28px] p-6 shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] text-center space-y-4`}>
          <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center text-3xl">
            🔒
          </div>

          <h2 className={`text-xl font-bold uppercase ${isDarkMode ? 'text-slate-100' : 'text-brand-dark'}`}>
            {t('admin.restricted')}
          </h2>

          <div className={`${isDarkMode ? 'bg-slate-800 border-red-500' : 'bg-red-50 border-red-200'} border rounded-2xl p-3 text-left space-y-1`}>
            <div className={`text-[11px] font-semibold uppercase ${isDarkMode ? 'text-red-300' : 'text-red-800'} flex items-center gap-1.5`}>
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>{t('admin.clearanceRequired')}</span>
            </div>
            <p className={`text-[10px] ${isDarkMode ? 'text-red-200' : 'text-red-700'} font-medium leading-relaxed`}>
              {t('admin.denied', { name: userProfile?.name, role: userProfile?.role || 'Player' })}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigateTo('home')}
              className="flex-1 bg-white hover:bg-brand-light text-brand-dark font-semibold py-3 px-3 rounded-full border border-brand-dark/15 text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.home')}</span>
            </button>

            <button
              onClick={() => {
                logout();
                setAuthMode('login');
                navigateTo('auth');
              }}
              className="flex-1 bg-[#cc0000] hover:bg-[#b30000] text-white font-semibold py-3 px-3 rounded-full text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('admin.loginAsAdmin')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin is logged in -> Render Command Center directly!
  return (
    <div className={`${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-brand-cream text-brand-dark'} min-h-screen font-thai antialiased flex flex-col md:flex-row relative`}>
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl overflow-y-auto">
        {adminActiveTab === 'overview' && (
          <SystemOverviewTab />
        )}

        {adminActiveTab === 'basemaps' && (
          <BaseMapsTab onOpenAddModal={() => setIsAddBaseMapModalOpen(true)} />
        )}

        {adminActiveTab === 'users' && (
          <UserManagementTab />
        )}

        {adminActiveTab === 'reports' && (
          <ReportedLocationsTab />
        )}

        {adminActiveTab === 'reviews' && (
          <ReviewsTab />
        )}
      </main>

      {/* Admin Action Modals */}
      <AddBaseMapModal
        isOpen={isAddBaseMapModalOpen}
        onClose={() => setIsAddBaseMapModalOpen(false)}
      />

      {/* Admin Toast Notification */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`rounded-2xl p-4 shadow-[0_10px_30px_-15px_rgba(45,58,46,0.4)] flex items-center gap-3 font-thai text-xs font-semibold uppercase ${
              adminToast.type === 'error'
                ? 'bg-[#cc0000] text-white'
                : adminToast.type === 'warning'
                ? 'bg-amber-400 text-brand-dark'
                : adminToast.type === 'info'
                ? 'bg-sky-400 text-brand-dark'
                : 'bg-emerald-400 text-brand-dark'
            }`}
          >
            {adminToast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : adminToast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{adminToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
