import { useState } from 'react';
import { Users, Compass, AlertCircle, Search, Trash2, Eye, Loader as Loader2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { fetchMapById } from '../../../lib/supabaseMaps';

export default function SystemOverviewTab() {
  const { communityMaps, trainers, reportedLocations, adminDeleteCommunityMap, showAdminToast, navigateTo, t } = useApp();

  // Live stats derived from the same communityMaps, trainers & reports that the user UI uses.
  const totalTrainers = trainers?.length ?? 0;
  const publishedMaps = (communityMaps || []).filter((m) => m.privacy && m.privacy !== 'private').length;
  const draftMaps = (communityMaps || []).filter((m) => m.privacy === 'private').length;
  const pendingReports = (reportedLocations || []).filter((r) => r.status === 'pending').length;

  // Only maps that users actually created & published to Community Discoveries
  // (seed demo data is excluded — same rule as the Community page).
  const userCreatedMaps = (communityMaps || []).filter((m) =>
    m._summaryOnly === true ||
    m.isEditorMap === true ||
    Boolean(m.ownerId && m.privacy)
  );

  const getCreatorName = (item) => item.discoveredBy || item.ownerId || 'Traveler';
  const getRegionName = (item) => item.details?.region || item.region || 'Global Realm';

  const [searchQuery, setSearchQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('published');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const creatorOptions = [...new Set(userCreatedMaps.map(getCreatorName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const regionOptions = [...new Set(userCreatedMaps.map(getRegionName).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const filteredMaps = userCreatedMaps.filter((item) => {
    const title = (item.title || item.name || '').toLowerCase();
    const author = getCreatorName(item).toLowerCase();
    const q = searchQuery.toLowerCase();
    if (q && !(title.includes(q) || author.includes(q))) return false;
    if (creatorFilter && getCreatorName(item) !== creatorFilter) return false;
    if (regionFilter && getRegionName(item) !== regionFilter) return false;
    if (statusFilter === 'published' && (item.privacy === 'private' || item.privacy === 'unlisted')) return false;
    if (statusFilter === 'draft' && item.privacy !== 'private') return false;
    return true;
  });

  const confirmDelete = () => {
    if (!deleteTarget || !deleteReason.trim()) return;
    adminDeleteCommunityMap(deleteTarget.id, deleteReason.trim());
    showAdminToast(`Map deleted. Reason: ${deleteReason.trim()}`, 'success');
    setDeleteTarget(null);
    setDeleteReason('');
  };

  const viewDetails = async (mapItem) => {
    if (mapItem._summaryOnly) {
      try {
        const full = await fetchMapById(mapItem.id);
        if (full) { navigateTo('details', full); return; }
      } catch {
        // fall through to summary details
      }
    }
    navigateTo('details', mapItem);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>{t('admin.systemOverview')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            {t('admin.systemOverviewSubtitle')}
          </p>
        </div>
      </div>

      {/* 3 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* STAT_01: Total Trainers — live from Supabase users table */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="bg-[#4862db] text-white px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_01</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">{t('admin.totalTrainers')}</div>
            <div className="text-3xl font-black text-black">{totalTrainers.toLocaleString()}</div>
            <div className="mt-2 text-xs font-black text-emerald-600 flex items-center gap-1">
              <span>● {t('admin.liveFromRegistry')}</span>
            </div>
          </div>
        </div>

        {/* STAT_02: Active Maps — live from communityMaps (user creations) */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="bg-[#eab308] text-black px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_02</span>
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">{t('admin.activeMaps')}</div>
            <div className="text-3xl font-black text-black">{publishedMaps.toLocaleString()}</div>
            <div className="mt-2 text-xs font-black text-gray-600 flex items-center gap-1">
              <span>{draftMaps} {t('admin.drafts')} · {publishedMaps} {t('admin.published')}</span>
            </div>
          </div>
        </div>

        {/* STAT_03: Pending Reports — live from reported locations */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:8px_8px]">
          <div className="bg-[#eab308] text-black px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_03</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">{t('admin.pendingReports')}</div>
            <div className="text-3xl font-black text-black">{pendingReports.toLocaleString()}</div>
            <div className="mt-2 text-xs font-black text-gray-600 flex items-center gap-1">
              <span>{t('admin.pendingReportsDesc')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Discoveries Moderation — search & delete user-published maps */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-[#cc0000] text-white border-b-4 border-black p-3.5 px-5 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>{t('admin.communityManager')}</span>
          </h3>
          <span className="bg-white text-black text-[10px] font-black px-3 py-0.5 rounded-full border border-black">
            {filteredMaps.length}
          </span>
        </div>

        <div className="p-4 border-b-2 border-black bg-gray-50 space-y-3">
          <label className="block text-[11px] font-black uppercase mb-1.5 text-gray-700">
            {t('admin.communityMapsSearch')}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.communityMapsSearchPh')}
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Filter bar: CREATOR · Region · Status */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                {t('admin.creator')}
              </label>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border-2 border-black rounded-lg text-[11px] font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="">{t('admin.allCreators')}</option>
                {creatorOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                {t('admin.region')}
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border-2 border-black rounded-lg text-[11px] font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="">{t('admin.allRegions')}</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                {t('admin.status')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border-2 border-black rounded-lg text-[11px] font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="published">{t('admin.published')}</option>
                <option value="draft">{t('admin.drafts')}</option>
                <option value="all">{t('admin.allStatuses')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b-2 border-black text-gray-700 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3.5 px-4">{t('admin.locationName')}</th>
                <th className="p-3.5">{t('admin.creator')}</th>
                <th className="p-3.5">{t('admin.region')}</th>
                <th className="p-3.5">{t('admin.status')}</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100 font-bold">
              {filteredMaps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 text-xs">
                    {t('admin.noCommunityMaps')}
                  </td>
                </tr>
              ) : (
                filteredMaps.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/50 transition-colors">
<td className="p-3.5 px-4">
                            <span className="font-black text-black block max-w-[220px] truncate" title={m.title || m.name || 'Untitled Map'}>
                              {m.title || m.name || 'Untitled Map'}
                            </span>
                          </td>
                    <td className="p-3.5 text-gray-600">{getCreatorName(m)}</td>
                    <td className="p-3.5 text-gray-600">{getRegionName(m)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${m.privacy === 'private' ? 'bg-gray-100 text-gray-600 border-gray-400' : 'bg-emerald-100 text-emerald-800 border-emerald-400'}`}>
                        {m.privacy === 'private' ? t('admin.drafts') : t('admin.published')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewDetails(m)}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t('admin.view')}</span>
                        </button>
<button
                        onClick={() => { setDeleteReason(''); setDeleteTarget(m); }}
                        className="px-2.5 py-1 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer"
                      >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('admin.deleteMap')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredMaps.length > 0 && (
          <div className="px-4 py-2.5 bg-gray-50 border-t-2 border-black text-[10px] font-black uppercase text-gray-500">
            <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
            {t('admin.liveFromRegistry')}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#b40000] text-white p-4 border-b-4 border-black flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-black uppercase tracking-wide">{t('admin.deleteMapTitle')}</h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-bold text-gray-800">
                {t('admin.deleteMapConfirm', { title: deleteTarget.title || deleteTarget.name })} {t('admin.deleteMapCannotUndo')}
              </p>

              <div className="mt-4">
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1.5">
                  {t('community.deleteReasonLabel')}
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t('community.deleteReasonPh')}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                {!deleteReason.trim() && (
                  <p className="mt-1 text-[10px] font-black uppercase text-red-600">
                    {t('community.deleteReasonRequired')}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  disabled={!deleteReason.trim()}
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-[#b40000] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" /> {t('admin.deleteMap')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}