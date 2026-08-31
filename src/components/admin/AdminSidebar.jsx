import { useState } from 'react';
import {
  LayoutGrid,
  Map as MapIcon,
  Globe,
  Users,
  AlertTriangle,
  Plus,
  LogOut,
  ArrowLeft,
  Shield,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AdminSidebar({ onOpenNewMission }) {
  const { adminActiveTab, setAdminActiveTab, userProfile, navigateTo, logout, reportedLocations } = useApp();
  const { adminActiveTab, setAdminActiveTab, adminUser, navigateTo, adminLogout, reportedLocations } = useApp();

  const pendingReportsCount = reportedLocations?.filter((r) => r.status === 'pending').length || 0;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'basemaps', label: 'Base Maps', icon: MapIcon },
    { id: 'settings', label: 'Global Map Settings', icon: Globe },
    { id: 'users', label: 'User Management', icon: Users },
    {
      id: 'reports',
      label: 'Reported Locations',
      icon: AlertTriangle,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#f0f2f5] md:min-h-screen border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex flex-col justify-between shrink-0 font-mono select-none">
      <div>
        {/* Command Center Title Header */}
        <div className="mb-5 pb-3 border-b-2 border-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
              <h1 className="text-xl font-black tracking-tight text-[#cc0000] uppercase leading-none">
                COMMAND<br />CENTER
              </h1>
            </div>
            <button
              onClick={() => navigateTo('home')}
              title="Return to Trainer App"
              className="px-2 py-1 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>App</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">ADMIN USER</p>
        </div>

        {/* + New Mission Action Button */}
        <button
          onClick={onOpenNewMission}
          className="w-full mb-6 bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 px-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Mission</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-black text-left text-xs font-black uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-[1.02]'
                    : 'bg-white hover:bg-amber-50 text-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#cc0000] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-black animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Bottom Widget */}
      <div className="pt-6 mt-6 border-t-2 border-black/20 space-y-3">
        <div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#cc0000] text-white border-2 border-black rounded-lg flex items-center justify-center font-black text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              A1
              {adminUser?.badge || 'A1'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black truncate">{userProfile?.name || 'Admin_01'}</div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">SUPERUSER</div>
              <div className="text-xs font-black truncate">{adminUser?.name || 'Admin_01'}</div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{adminUser?.role || 'SUPERUSER'}</div>
            </div>
          </div>

          <button
            onClick={() => navigateTo('home')}
            title="Exit to World Map"
            className="w-7 h-7 bg-gray-100 hover:bg-red-50 border-2 border-black rounded-lg flex items-center justify-center text-gray-700 hover:text-red-600 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={logout}
          onClick={adminLogout}
          className="w-full text-[10px] text-red-600 hover:text-red-800 font-black uppercase text-center py-1 cursor-pointer flex items-center justify-center gap-1"
        >
          <LogOut className="w-3 h-3" />
          <span>Log Out System</span>
        </button>
      </div>
    </aside>
  );
}

