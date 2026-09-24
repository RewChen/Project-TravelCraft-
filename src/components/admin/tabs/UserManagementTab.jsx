import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  Shield,
  User,
  Ban,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import TrainerMapsModal from '../modals/TrainerMapsModal';
import { supabase } from '../../../lib/supabaseClient';
import { isAvatarImage } from '../../../lib/imageUtils';

export default function UserManagementTab() {
  const { showAdminToast, communityMaps, t } = useApp();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTrainer, setSearchTrainer] = useState('');
  const [selectedTrainerForMaps, setSelectedTrainerForMaps] = useState(null);
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching real users:', error);
        showAdminToast('Failed to fetch real users data.', 'error');
      } else if (data) {
        const mapped = data.map(u => ({
          id: u.id,
          name: u.username || 'Anonymous',
          email: u.email || 'N/A',
          role: u.role === 'admin' ? 'Admin' : u.role || 'Member',
          avatar: u.avatar || '🧢',
          joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
          status: u.status || 'active',
        }));
        setTrainers(mapped);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount from Supabase
    fetchTrainers();
  }, []);

  const banTrainer = async (id) => {
    try {
      const { error } = await supabase.from('users').update({ status: 'banned', role: 'Banned' }).eq('id', id);
      if (!error) {
        setTrainers(prev => prev.map(t => t.id === id ? { ...t, status: 'banned', role: 'Banned' } : t));
        showAdminToast('Trainer has been BANNED in Database.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unbanTrainer = async (id) => {
    try {
      const { error } = await supabase.from('users').update({ status: 'active', role: 'Member' }).eq('id', id);
      if (!error) {
        setTrainers(prev => prev.map(t => t.id === id ? { ...t, status: 'active', role: 'Member' } : t));
        showAdminToast('Trainer unbanned & reinstated in Database.', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeTrainerRole = async (id, newRole) => {
    try {
      // If role is Admin, we might save it as 'admin' in db
      const dbRole = newRole.toLowerCase();
      const { error } = await supabase.from('users').update({ role: dbRole }).eq('id', id);
      if (!error) {
        setTrainers(prev => prev.map(t => t.id === id ? { ...t, role: newRole } : t));
        showAdminToast(`Role updated to ${newRole} in Database.`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Derive live map counts from the same communityMaps that the user UI renders — admin sees every user creation.
  const getTrainerMapCount = (trainer) => (communityMaps || []).filter((m) =>
    m.ownerId ? m.ownerId === trainer.id : m.discoveredBy === trainer.name
  ).length;

  const filteredTrainers = trainers.filter((t) =>
    t.name.toLowerCase().includes(searchTrainer.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTrainer.toLowerCase()) ||
    t.role.toLowerCase().includes(searchTrainer.toLowerCase())
  );

  const handleOpenMapsModal = (trainer) => {
    setSelectedTrainerForMaps(trainer);
    setIsMapsModalOpen(true);
  };

  return (
    <div className="space-y-6 font-thai">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/[0.06] pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-brand-dark flex items-center gap-2">
            <span>{t('admin.userManagement')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-brand-dark/50 font-medium mt-1">
            {t('admin.managePersonnel')}
          </p>
        </div>

        {/* Search & Filter Top Right */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTrainer}
              onChange={(e) => setSearchTrainer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  showAdminToast(`Search: ${filteredTrainers.length} user(s) found`, 'info');
                }
              }}
              placeholder={t('admin.findTrainer')}
              className="pl-9 pr-3 py-2 bg-white ring-1 ring-brand-dark/[0.06] rounded-full text-xs font-semibold w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]"
            />
          </div>

          <button
            onClick={() => showAdminToast(`Search: ${filteredTrainers.length} user(s) found`, 'info')}
            className="py-2 px-4 bg-amber-400 hover:bg-amber-300 text-brand-dark rounded-full text-xs font-semibold uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_4px_20px_-10px_rgba(45,58,46,0.15)]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('admin.findUser')}</span>
          </button>

          <button
            onClick={() => {
              fetchTrainers();
              showAdminToast(`Filter: ${filteredTrainers.length} trainers found`, 'info');
            }}
            className="py-2 px-4 bg-white hover:bg-brand-light text-brand-dark rounded-full text-xs font-semibold uppercase ring-1 ring-brand-dark/[0.06] flex items-center gap-1.5 cursor-pointer shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t('admin.syncDB')}</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout (Matching Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): ACTIVE ROSTER */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]">
          {/* Light Banner Header */}
          <div className="bg-brand-light/60 border-b border-brand-dark/[0.06] p-3.5 px-5 text-brand-dark">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span>{t('admin.activeRoster')}</span>
            </h3>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-light/60 border-b border-brand-dark/[0.06] text-brand-dark/60 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 px-4">{t('admin.trainer')}</th>
                  <th className="p-3.5">{t('admin.role')}</th>
                  <th className="p-3.5">{t('admin.quotaMaps')}</th>
                  <th className="p-3.5 text-right">{t('admin.moderation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/[0.06] font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500 text-xs">
                      {t('admin.loadingDb')}
                    </td>
                  </tr>
                ) : filteredTrainers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500 text-xs">
                      {t('admin.noTrainers')}
                    </td>
                  </tr>
                ) : filteredTrainers.map((trainer) => {
                  const isBanned = trainer.status === 'banned' || trainer.role === 'Banned';
                  return (
                    <tr key={trainer.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* Trainer info */}
                      <td className="p-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-brand-light/60 ring-1 ring-brand-dark/[0.06] rounded-full flex items-center justify-center text-lg overflow-hidden">
                              {isAvatarImage(trainer.avatar) ? (
                                <img src={trainer.avatar} alt={trainer.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                              ) : (
                                trainer.avatar || '🧢'
                              )}
                            </div>
                            {/* Online / Status dot */}
                            <span
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                isBanned ? 'bg-red-600' : 'bg-emerald-500'
                              }`}
                            ></span>
                          </div>

                          <div>
                            <div className="font-black text-sm text-black flex items-center gap-2">
                              <span>{trainer.name}</span>
                              {isBanned && (
                                <span className="text-[10px] text-red-600 font-black tracking-wider">
                                  {t('admin.banned')}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 font-normal">
                              {t('admin.joined')}: {trainer.joined}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="p-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase inline-block ring-1 ${
                            trainer.role === 'Admin'
                              ? 'bg-red-100 text-red-700 ring-red-200'
                              : isBanned
                              ? 'bg-red-100 text-red-800 ring-red-200'
                              : trainer.role === 'Member'
                              ? 'bg-amber-100 text-amber-900 ring-amber-200'
                              : 'bg-emerald-100 text-emerald-900 ring-emerald-200'
                          }`}
                        >
                          {trainer.role}
                        </span>
                      </td>

                      {/* Quota & View Maps — live count from user-created maps */}
                      <td className="p-3.5">
                        <div className="text-xs font-bold text-gray-800">
                          {getTrainerMapCount(trainer)} {t('admin.mapsCreated')}{' '}
                          <button
                            onClick={() => handleOpenMapsModal(trainer)}
                            className="text-[#cc0000] hover:underline font-black text-xs cursor-pointer ml-1 inline-flex items-center gap-0.5"
                          >
                            <span>{t('admin.viewMaps')}</span>
                          </button>
                        </div>
                      </td>

                      {/* Moderation Actions */}
                      <td className="p-3.5 text-right">
                        {isBanned ? (
                            <button
                            onClick={() => setConfirmAction({ type: 'unban', trainer })}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[10px] font-semibold uppercase cursor-pointer"
                          >
                            {t('admin.unban')}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={trainer.role}
                              onChange={(e) => changeTrainerRole(trainer.id, e.target.value)}
                              className="bg-white ring-1 ring-brand-dark/10 rounded-full px-2 py-1 text-[10px] font-semibold cursor-pointer"
                            >
                              <option value="Member">{t('admin.roleMember')}</option>
                              <option value="Novice">{t('admin.roleNovice')}</option>
                            </select>
                            <button
                              onClick={() => setConfirmAction({ type: 'ban', trainer })}
                              title="Ban Trainer"
                              className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-700 ring-1 ring-red-200 rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: SYSTEM STATUS & ROLE MATRIX */}
        <div className="space-y-6">
          {/* SYSTEM STATUS (live) */}
          <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-6 relative overflow-hidden">
            <h3 className="font-bold text-sm uppercase tracking-wider text-brand-dark mb-6 border-b border-brand-dark/[0.06] pb-2 flex items-center justify-between">
              <span>{t('admin.systemStatus')}</span>
              <HardDrive className="w-4 h-4 text-[#cc0000]" />
            </h3>

            <div className="space-y-4 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase text-brand-dark/50">{t('admin.totalTrainersLabel')}</span>
                <span className="text-2xl sm:text-3xl font-bold text-brand-dark">{trainers.length}</span>
              </div>

              <div className="flex items-baseline justify-between border-t border-brand-dark/[0.06] pt-3">
                <span className="text-xs font-semibold uppercase text-brand-dark/50">{t('admin.communityMapsLabel')}</span>
                <span className="text-2xl sm:text-3xl font-bold text-brand-dark">{communityMaps?.length ?? 0}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-brand-dark/[0.06] pt-3">
                <span className="text-xs font-semibold uppercase text-brand-dark/50">{t('admin.status')}</span>
                <span className="text-lg font-bold text-brand-dark">{t('admin.liveSynced')}</span>
              </div>
            </div>

            {/* Background silhouette icon */}
            <Users className="w-32 h-32 text-brand-light absolute -bottom-6 -right-6 pointer-events-none" />
          </div>

          {/* ROLE MATRIX (White Card) */}
          <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-5 space-y-4">
            <div className="border-b border-brand-dark/[0.06] pb-2 flex items-center gap-2 text-brand-dark">
              <Shield className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">{t('admin.roleMatrix')}</h3>
            </div>

            <div className="space-y-3">
              {/* Admin */}
              <div className="p-3 bg-brand-light/50 ring-1 ring-brand-dark/[0.06] rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-brand-dark">{t('admin.roleAdmin')}</span>
                  <Shield className="w-3.5 h-3.5 text-brand-dark/50" />
                </div>
                <p className="text-[11px] text-brand-dark/60 font-sans font-medium leading-tight">
                  {t('admin.adminRoleDesc')}
                </p>
              </div>

              {/* Member */}
              <div className="p-3 bg-brand-light/50 ring-1 ring-brand-dark/[0.06] rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-brand-dark">{t('admin.roleMember')}</span>
                  <User className="w-3.5 h-3.5 text-brand-dark/50" />
                </div>
                <p className="text-[11px] text-brand-dark/60 font-sans font-medium leading-tight">
                  {t('admin.memberRoleDesc')}
                </p>
              </div>

              {/* Banned */}
              <div className="p-3 bg-red-50 ring-1 ring-red-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-red-800">{t('admin.roleBanned')}</span>
                  <Ban className="w-3.5 h-3.5 text-red-600" />
                </div>
                <p className="text-[11px] text-red-700 font-sans font-medium leading-tight">
                  {t('admin.bannedRoleDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trainer Maps Modal */}
      <TrainerMapsModal
        isOpen={isMapsModalOpen}
        trainer={selectedTrainerForMaps}
        onClose={() => setIsMapsModalOpen(false)}
      />

      {/* Ban / Unban Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md ring-1 ring-brand-dark/[0.06] shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`${confirmAction.type === 'ban' ? 'bg-[#cc0000] text-white' : 'bg-emerald-500 text-white'} p-4 border-b border-white/20 flex items-center gap-2`}>
              {confirmAction.type === 'ban' ? (
                <Ban className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {confirmAction.type === 'ban' ? t('admin.confirmBan') : t('admin.confirmUnban')}
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-light/60 ring-1 ring-brand-dark/[0.06] rounded-full flex items-center justify-center text-lg overflow-hidden">
                  {isAvatarImage(confirmAction.trainer.avatar) ? (
                    <img src={confirmAction.trainer.avatar} alt={confirmAction.trainer.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    confirmAction.trainer.avatar || '🧢'
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-brand-dark">{confirmAction.trainer.name}</div>
                  <div className="text-[10px] text-brand-dark/50 font-semibold uppercase">{confirmAction.trainer.email}</div>
                </div>
              </div>

              <p className="text-xs text-brand-dark/70 font-sans font-medium leading-relaxed rounded-2xl p-3 bg-brand-light/40 ring-1 ring-brand-dark/10">
                {confirmAction.type === 'ban'
                  ? t('admin.confirmBanDesc', { name: confirmAction.trainer.name })
                  : t('admin.confirmUnbanDesc', { name: confirmAction.trainer.name })}
              </p>
            </div>

            <div className="p-4 pt-0 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-full ring-1 ring-brand-dark/10 text-xs font-semibold hover:bg-brand-light cursor-pointer"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action.type === 'ban') await banTrainer(action.trainer.id);
                  else await unbanTrainer(action.trainer.id);
                }}
                className={`px-5 py-2 text-white font-bold rounded-full text-xs uppercase cursor-pointer ${
                  confirmAction.type === 'ban'
                    ? 'bg-[#cc0000] hover:bg-red-700'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {confirmAction.type === 'ban' ? t('admin.confirmBan') : t('admin.confirmUnban')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

