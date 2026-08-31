import { useState } from 'react';
import { useApp } from '../context/AppContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import SystemOverviewTab from '../components/admin/tabs/SystemOverviewTab';
import BaseMapsTab from '../components/admin/tabs/BaseMapsTab';
import GlobalSettingsTab from '../components/admin/tabs/GlobalSettingsTab';
import UserManagementTab from '../components/admin/tabs/UserManagementTab';
import ReportedLocationsTab from '../components/admin/tabs/ReportedLocationsTab';
import NewMissionModal from '../components/admin/modals/NewMissionModal';
import DeployUpdateModal from '../components/admin/modals/DeployUpdateModal';
import AddBaseMapModal from '../components/admin/modals/AddBaseMapModal';
import AuthPage from './AuthPage';
import { Sparkles, AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function AdminDashboard() {
  const { adminActiveTab, adminToast, isLoggedIn, isAdminLoggedIn, userProfile, navigateTo, logout, setAuthMode } = useApp();

  const [isNewMissionModalOpen, setIsNewMissionModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAddBaseMapModalOpen, setIsAddBaseMapModalOpen] = useState(false);

  // 1. If not logged in at all, direct to normal login page
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  // 2. If logged in as regular player without admin role
  if (!isAdminLoggedIn && userProfile?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="min-h-screen bg-[#1a1d20] flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md bg-[#e8ecef] border-4 border-black rounded-[28px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 border-4 border-black rounded-full mx-auto flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            🔒
          </div>

          <h2 className="text-xl font-black uppercase text-black">
            RESTRICTED ACCESS
          </h2>

          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3 text-left space-y-1">
            <div className="text-[11px] font-black uppercase text-red-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Admin Clearance Required</span>
            </div>
            <p className="text-[10px] text-red-800 font-sans font-bold leading-relaxed">
              Your account <span className="font-mono font-black">"{userProfile?.name}"</span> ({userProfile?.role || 'Player'}) does not have system administration privileges.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigateTo('home')}
              className="flex-1 bg-white hover:bg-gray-100 text-black font-black py-2.5 px-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                logout();
                setAuthMode('login');
                navigateTo('auth');
              }}
              className="flex-1 bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login as Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin is logged in -> Render Command Center directly!
  return (
    <div className="min-h-screen bg-[#e8ecef] text-gray-900 font-mono antialiased flex flex-col md:flex-row relative selection:bg-red-200">
      {/* Left Sidebar */}
      <AdminSidebar onOpenNewMission={() => setIsNewMissionModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl overflow-y-auto">
        {adminActiveTab === 'overview' && (
          <SystemOverviewTab onOpenDeployModal={() => setIsDeployModalOpen(true)} />
        )}

        {adminActiveTab === 'basemaps' && (
          <BaseMapsTab onOpenAddModal={() => setIsAddBaseMapModalOpen(true)} />
        )}

        {adminActiveTab === 'settings' && (
          <GlobalSettingsTab />
        )}

        {adminActiveTab === 'users' && (
          <UserManagementTab />
        )}

        {adminActiveTab === 'reports' && (
          <ReportedLocationsTab />
        )}
      </main>

      {/* Admin Action Modals */}
      <NewMissionModal
        isOpen={isNewMissionModalOpen}
        onClose={() => setIsNewMissionModalOpen(false)}
      />

      <DeployUpdateModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      <AddBaseMapModal
        isOpen={isAddBaseMapModalOpen}
        onClose={() => setIsAddBaseMapModalOpen(false)}
      />

      {/* Retro HUD Toast Notification */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-mono text-xs font-black uppercase ${
              adminToast.type === 'error'
                ? 'bg-[#cc0000] text-white'
                : adminToast.type === 'warning'
                ? 'bg-amber-400 text-black'
                : adminToast.type === 'info'
                ? 'bg-sky-400 text-black'
                : 'bg-emerald-400 text-black'
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
