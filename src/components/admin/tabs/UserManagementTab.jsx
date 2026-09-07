import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  Shield,
  User,
  Ban,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import TrainerMapsModal from '../modals/TrainerMapsModal';
import { supabase } from '../../../lib/supabaseClient';

export default function UserManagementTab() {
  const { showAdminToast, communityMaps, t } = useApp();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTrainer, setSearchTrainer] = useState('');
  const [selectedTrainerForMaps, setSelectedTrainerForMaps] = useState(null);
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

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
    <div className="space-y-6 font-mono">
      {/* Top Header & Search (Matching Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>{t('admin.trainerRegistry')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
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
              placeholder={t('admin.findTrainer')}
              className="pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold w-48 sm:w-56 focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <button
            onClick={() => {
              fetchTrainers();
              showAdminToast(`Filter: ${filteredTrainers.length} trainers found`, 'info');
            }}
            className="py-2 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t('admin.syncDB')}</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout (Matching Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): ACTIVE ROSTER */}
        <div className="lg:col-span-2 bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Yellow Banner Header */}
          <div className="bg-[#eab308] border-b-4 border-black p-3.5 px-5">
            <h3 className="font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
              <span>{t('admin.activeRoster')}</span>
            </h3>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b-2 border-black text-gray-700 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3.5 px-4">{t('admin.trainer')}</th>
                  <th className="p-3.5">{t('admin.role')}</th>
                  <th className="p-3.5">{t('admin.quotaMaps')}</th>
                  <th className="p-3.5 text-right">{t('admin.moderation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100 font-bold">
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
                            <div className="w-10 h-10 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {trainer.avatar || '🧢'}
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
                          className={`px-3 py-1 border border-black rounded-full text-[10px] font-black uppercase inline-block shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            trainer.role === 'Admin'
                              ? 'bg-red-100 text-red-700'
                              : isBanned
                              ? 'bg-red-100 text-red-800'
                              : trainer.role === 'Member'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
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
                            onClick={() => unbanTrainer(trainer.id)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                          >
                            {t('admin.unban')}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={trainer.role}
                              onChange={(e) => changeTrainerRole(trainer.id, e.target.value)}
                              className="bg-gray-100 border border-black rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer"
                            >
                              <option value="Member">{t('admin.roleMember')}</option>
                              <option value="Novice">{t('admin.roleNovice')}</option>
                              <option value="Admin">{t('admin.roleAdmin')}</option>
                            </select>
                            <button
                              onClick={() => banTrainer(trainer.id)}
                              title="Ban Trainer"
                              className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-700 border border-black rounded flex items-center justify-center text-[10px] font-bold cursor-pointer"
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
          {/* SYSTEM STATUS (Red Card, Image 3) — live */}
          <div className="bg-[#cc0000] text-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <h3 className="font-black text-sm uppercase tracking-wider mb-6 border-b-2 border-white/40 pb-2 flex items-center justify-between">
              <span>{t('admin.systemStatus')}</span>
              <HardDrive className="w-4 h-4" />
            </h3>

            <div className="space-y-4 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase text-white/80">{t('admin.totalTrainersLabel')}</span>
                <span className="text-2xl sm:text-3xl font-black">{trainers.length}</span>
              </div>

              <div className="flex items-baseline justify-between border-t border-white/20 pt-3">
                <span className="text-xs font-bold uppercase text-white/80">{t('admin.communityMapsLabel')}</span>
                <span className="text-2xl sm:text-3xl font-black">{communityMaps?.length ?? 0}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-white/20 pt-3">
                <span className="text-xs font-bold uppercase text-white/80">{t('admin.status')}</span>
                <span className="text-lg font-black">{t('admin.liveSynced')}</span>
              </div>
            </div>

            {/* Background silhouette icon */}
            <Users className="w-32 h-32 text-white/10 absolute -bottom-6 -right-6 pointer-events-none" />
          </div>

          {/* ROLE MATRIX (White Card, Image 3) */}
          <div className="bg-white border-4 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b-2 border-black pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-black" />
              <h3 className="font-black text-xs uppercase tracking-wider">{t('admin.roleMatrix')}</h3>
            </div>

            <div className="space-y-3">
              {/* Admin */}
              <div className="p-3 bg-gray-50 border-2 border-black rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-black">{t('admin.roleAdmin')}</span>
                  <Shield className="w-3.5 h-3.5 text-gray-700" />
                </div>
                <p className="text-[11px] text-gray-600 font-sans font-medium leading-tight">
                  {t('admin.adminRoleDesc')}
                </p>
              </div>

              {/* Member */}
              <div className="p-3 bg-gray-50 border-2 border-black rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-black">{t('admin.roleMember')}</span>
                  <User className="w-3.5 h-3.5 text-gray-700" />
                </div>
                <p className="text-[11px] text-gray-600 font-sans font-medium leading-tight">
                  {t('admin.memberRoleDesc')}
                </p>
              </div>

              {/* Banned */}
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-red-800">{t('admin.roleBanned')}</span>
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
    </div>
  );
}

