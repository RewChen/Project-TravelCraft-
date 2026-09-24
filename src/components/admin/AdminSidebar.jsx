import {
  LayoutGrid,
  Map as MapIcon,
  Users,
  AlertTriangle,
  Star,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AdminSidebar() {
  const { adminActiveTab, setAdminActiveTab, userProfile, navigateTo, adminLogout, reportedLocations, reviews, t } = useApp();

  const pendingReportsCount = reportedLocations?.filter((r) => r.status === 'pending').length || 0;
  // Reviews publish instantly now; the badge shows how many still need an admin
  // to confirm they've checked them (admin_checked), incl. legacy pending rows.
  const pendingReviewsCount = (reviews || []).filter((r) => !r.adminChecked && r.status !== 'hidden').length || 0;

  const navItems = [
    { id: 'overview', label: t('admin.overview'), icon: LayoutGrid },
    { id: 'basemaps', label: t('admin.baseMaps'), icon: MapIcon },
    { id: 'users', label: t('admin.userManagement'), icon: Users },
    {
      id: 'reviews',
      label: t('admin.reviews'),
      icon: Star,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : null
    },
    {
      id: 'reports',
      label: t('admin.reportedLocations'),
      icon: AlertTriangle,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null
    },
  ];

  return (
    <aside className="w-full md:w-64 md:min-h-screen p-4 flex flex-col justify-between shrink-0 select-none bg-brand-light/40 dark:bg-slate-900 md:border-r md:border-brand-dark/[0.06] dark:md:border-slate-700">
      <div>
        {/* Command Center Title Header */}
        <div className="mb-5 pb-3 border-b border-brand-dark/[0.06] dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="TravelCraft Logo" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-brand-dark dark:text-slate-100 uppercase leading-tight">
                  Admin
                </h1>
                <p className="text-[10px] text-brand-dark/50 dark:text-slate-400 font-semibold uppercase leading-tight">
                  {t('admin.adminUser')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('home')}
              title={t('admin.returnToApp')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-brand-dark/60 hover:text-brand-dark hover:bg-white dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAdminActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left text-xs font-semibold uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-brand-dark shadow-[0_4px_20px_-10px_rgba(45,58,46,0.18)] ring-1 ring-brand-dark/[0.06]'
                    : 'text-brand-dark/60 hover:text-brand-dark hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#cc0000]' : 'text-brand-dark/50 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#cc0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Bottom Widget */}
      <div className="pt-6 mt-6 border-t border-brand-dark/[0.06] dark:border-slate-700 space-y-3">
        <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-dark text-white rounded-full flex items-center justify-center font-bold text-sm">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate text-brand-dark dark:text-slate-100">{userProfile?.name || 'Admin'}</div>
              <div className="text-[9px] text-brand-dark/50 dark:text-slate-400 font-semibold uppercase tracking-wider">{userProfile?.role || 'SUPERUSER'}</div>
            </div>
          </div>

          <button
            onClick={() => navigateTo('home')}
            title={t('admin.exit')}
            className="w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/50 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={adminLogout}
          className="w-full text-[10px] text-red-600 hover:text-red-800 font-semibold uppercase text-center py-1 cursor-pointer flex items-center justify-center gap-1"
        >
          <LogOut className="w-3 h-3" />
          <span>{t('admin.logOutSystem')}</span>
        </button>
      </div>
    </aside>
  );
}