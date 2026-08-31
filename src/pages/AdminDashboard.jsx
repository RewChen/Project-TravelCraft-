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
import AdminAuthGate from '../components/admin/AdminAuthGate';
import { Sparkles, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function AdminDashboard() {
  const { adminActiveTab, adminToast } = useApp();
  const { adminActiveTab, adminToast, isAdminLoggedIn } = useApp();

  const [isNewMissionModalOpen, setIsNewMissionModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAddBaseMapModalOpen, setIsAddBaseMapModalOpen] = useState(false);

  // Require Admin Authentication before accessing Command Center
  if (!isAdminLoggedIn) {
    return <AdminAuthGate />;
  }

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

