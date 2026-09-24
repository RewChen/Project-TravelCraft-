import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Eye,
  Info,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { fetchMapById } from '../../../lib/supabaseMaps';

export default function ReportedLocationsTab() {
  const {
    reportedLocations,
    resolveReport,
    trainers,
    deleteReportedMap,
    globalSettings,
    navigateTo,
    showAdminToast,
    t
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [deleteMapInfo, setDeleteMapInfo] = useState({ loading: false, title: '', owner: '', hasMap: false });
  const [viewItem, setViewItem] = useState(null);

  const pendingReports = useMemo(() => (reportedLocations || []).filter((r) => r.status === 'pending'), [reportedLocations]);
  const resolvedReports = useMemo(() => (reportedLocations || []).filter((r) => r.status === 'resolved'), [reportedLocations]);

  const topOffenders = useMemo(() => {
    const counts = {};
    for (const r of pendingReports) {
      if (!r.creator) continue;
      counts[r.creator] = (counts[r.creator] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
  }, [pendingReports]);

  const handleViewReport = async (item) => {
    if (!item.mapId) {
      showAdminToast(t('admin.viewReportMissing'), 'warning');
      return;
    }
    try {
      const mapItem = await fetchMapById(item.mapId);
      if (!mapItem) {
        showAdminToast(t('admin.viewReportMissing'), 'warning');
        return;
      }
      navigateTo('details', mapItem);
    } catch (err) {
      console.warn('Report map lookup failed:', err);
      showAdminToast(t('admin.viewReportMissing'), 'warning');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return;
    const item = confirmDeleteItem;
    setConfirmDeleteItem(null);
    await deleteReportedMap(item);
  };

  const openDeleteConfirm = async (item) => {
    setConfirmDeleteItem(item);
    setDeleteMapInfo({ loading: true, title: item.locationName, owner: item.creator || '', hasMap: false });
    if (!item.mapId) return;
    try {
      const mapItem = await fetchMapById(item.mapId);
      if (!mapItem) return;
      const owner = trainers.find((tr) => tr.id === mapItem.ownerId)?.name
        || mapItem.discoveredBy
        || '';
      setDeleteMapInfo({
        loading: false,
        title: mapItem.title || item.locationName,
        owner: owner || item.creator || '',
        hasMap: true,
      });
    } catch (err) {
      console.warn('Delete confirm map lookup failed:', err);
    }
  };

  return (
    <div className="space-y-6 font-thai">
      {/* Top Banner */}
      <div className="space-y-2">
        <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-4 sm:p-5 inline-block w-full">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-brand-dark flex items-center gap-2">
            <span>{t('admin.reportedLocationsTitle')}</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-brand-dark/50 font-medium pl-1 border-l-4 border-[#cc0000]">
          {t('admin.investigateDesc')}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): REPORT QUEUE Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]">
          {/* Section Header */}
          <div className="bg-brand-light/60 text-brand-dark border-b border-brand-dark/[0.06] p-3.5 px-5 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#cc0000]" />
              <span>{t('admin.reportQueue')}</span>
            </h3>
            <span className="bg-[#cc0000] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              {t('admin.highPriority')}
            </span>
          </div>

          {/* Report Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-light/60 border-b border-brand-dark/[0.06] text-brand-dark/60 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 px-4">{t('admin.locationName')}</th>
                  <th className="p-3.5">{t('admin.creator')}</th>
                  <th className="p-3.5">{t('admin.category')}</th>
                  <th className="p-3.5 text-center">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/[0.06] font-medium">
                {pendingReports.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setViewItem(item)}
                    title={t('admin.viewReport')}
                    className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    {/* Location Name + Additional Details */}
                    <td className="p-3.5 px-4 font-black text-black">
                      <div className="flex items-center gap-2">
                        <span className={item.category === 'SPAM' ? 'text-red-600' : 'text-black'}>
                          {item.locationName}
                        </span>
                      </div>
                      {item.reason && (
                        <div
                          className="text-[10px] text-gray-500 font-bold mt-1 line-clamp-1 whitespace-normal"
                          title={item.reason}
                        >
                          <span className="text-gray-400 uppercase tracking-wide">{t('map.reportDetails')}: </span>
                          {item.reason}
                        </div>
                      )}
                    </td>

                    {/* Reporter */}
                    <td className="p-3.5 text-gray-700">{item.creator}</td>

                    {/* Category Tag */}
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                          item.category === 'SPAM'
                            ? 'bg-red-100 text-red-700 border-red-400'
                            : item.category === 'FAKE LOCATION'
                            ? 'bg-amber-100 text-amber-800 border-amber-400'
                            : 'bg-blue-100 text-blue-800 border-blue-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View / navigate to the report */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewReport(item); }}
                          title={t('admin.viewReport')}
                          className="w-7 h-7 bg-brand-light/40 hover:bg-brand-light text-indigo-600 ring-1 ring-brand-dark/10 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Resolve (no violation found) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); resolveReport(item.id); }}
                          title={t('admin.markResolved')}
                          className="w-7 h-7 bg-brand-light/40 hover:bg-brand-light text-emerald-600 ring-1 ring-brand-dark/10 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete the whole map this report is about + all its reports */}
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteConfirm(item); }}
                          title={t('admin.deleteLocation')}
                          className="w-7 h-7 bg-[#cc0000] hover:bg-red-700 text-white rounded-full flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingReports.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-xs text-gray-500 font-black uppercase tracking-wider">
                      {t('admin.noPendingReports')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="bg-brand-light/40 border-t border-brand-dark/[0.06] p-3 px-4 flex items-center justify-between text-xs text-brand-dark/60 font-medium">
            <div>{t('admin.showingRecords', { count: pendingReports.length })}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-6 h-6 bg-white hover:bg-brand-light ring-1 ring-brand-dark/10 rounded-full flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-2.5 py-0.5 bg-amber-400 rounded-full font-semibold text-brand-dark">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-6 h-6 bg-white hover:bg-brand-light ring-1 ring-brand-dark/10 rounded-full flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: REPORT MOD & SYSTEM NOTICE */}
        <div className="space-y-6">
          {/* Top Offenders (dynamic from real reports) */}
          <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)]">
            <div className="bg-brand-light/60 border-b border-brand-dark/[0.06] p-3.5 px-4 flex items-center gap-2 text-brand-dark">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Top Offenders</h3>
            </div>

            <div className="p-4 space-y-4">
              {topOffenders.length === 0 ? (
                <div className="text-xs text-brand-dark/50 font-medium text-center py-4">
                  {t('admin.noPendingReports')}
                </div>
              ) : (
                topOffenders.map(([name, count]) => (
                  <div key={name} className="rounded-2xl bg-brand-light/40 ring-1 ring-brand-dark/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase text-brand-dark/50">Offender</span>
                      <span className="bg-[#cc0000] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {count} {count === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                    <div className="font-bold text-base text-[#cc0000] truncate">{name}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
              <span className="text-brand-dark/50">Pending</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ring-1 ring-amber-200">{pendingReports.length}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
              <span className="text-brand-dark/50">Resolved</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">{resolvedReports.length}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
              <span className="text-brand-dark/50">Total</span>
              <span className="text-brand-dark font-bold">{reportedLocations?.length ?? 0}</span>
            </div>
          </div>

          {/* SYSTEM NOTICE */}
          <div className="bg-sky-50 rounded-3xl ring-1 ring-sky-200 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold uppercase text-indigo-950 mb-1">{t('admin.systemNotice')}</div>
              <p className="text-[10px] font-sans font-medium text-indigo-800 leading-relaxed">
                {t('admin.autoBanNotice', { threshold: globalSettings?.autoBanStrikeThreshold ?? 5, days: '7' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal — removes the whole reported map + its reports */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl w-full max-w-md ring-1 ring-brand-dark/[0.06] shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#cc0000] text-white p-4 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {t('admin.deleteMapTitle')}
                </h3>
              </div>
              <button
                onClick={() => setConfirmDeleteItem(null)}
                className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {deleteMapInfo.hasMap ? (
                <p className="text-xs font-semibold text-brand-dark leading-relaxed">
                  {t('admin.deleteReportMapConfirm', {
                    map: deleteMapInfo.title || confirmDeleteItem.locationName,
                    owner: deleteMapInfo.owner,
                  })}
                </p>
              ) : (
                <p className="text-xs font-semibold text-brand-dark leading-relaxed">
                  {t('admin.deleteReportConfirmNoMap', {
                    title: confirmDeleteItem.locationName,
                  })}
                </p>
              )}
              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                {t('admin.deleteMapCannotUndo')}
              </p>

              <div className="flex justify-end gap-3 border-t border-brand-dark/[0.06] pt-3">
                <button
                  onClick={() => setConfirmDeleteItem(null)}
                  className="px-4 py-2 rounded-full ring-1 ring-brand-dark/10 text-xs font-semibold hover:bg-brand-light cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-[#cc0000] text-white font-bold rounded-full hover:bg-red-700 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('admin.deleteAll')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal — full text the reporter typed */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl w-full max-w-lg ring-1 ring-brand-dark/[0.06] shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-brand-light/60 text-brand-dark p-4 border-b border-brand-dark/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#cc0000]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {t('admin.reportDetailsTitle')}
                </h3>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="w-7 h-7 bg-white text-brand-dark ring-1 ring-brand-dark/10 rounded-full flex items-center justify-center hover:bg-brand-light cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Location name */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('admin.locationName')}</div>
                <div className={`font-black text-base ${viewItem.category === 'SPAM' ? 'text-red-600' : 'text-black'}`}>
                  {viewItem.locationName}
                </div>
              </div>

              {/* Reported by + category + status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('admin.creator')}</div>
                  <div className="text-sm font-bold text-gray-800">{viewItem.creator}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('admin.category')}</div>
                  <span
                    className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                      viewItem.category === 'SPAM'
                        ? 'bg-red-100 text-red-700 border-red-400'
                        : viewItem.category === 'FAKE LOCATION'
                        ? 'bg-amber-100 text-amber-800 border-amber-400'
                        : 'bg-blue-100 text-blue-800 border-blue-400'
                    }`}
                  >
                    {viewItem.category}
                  </span>
                </div>
              </div>

              {/* Reported at */}
              {viewItem.reportedAt && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Date</div>
                  <div className="text-xs font-bold text-gray-700">
                    {new Date(viewItem.reportedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Additional details text (what the user typed) */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('map.reportDetails')}</div>
                <div className="bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl px-3 py-2 text-xs font-sans font-medium text-brand-dark whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {viewItem.reason || '—'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-brand-dark/[0.06] pt-3">
                <button
                  onClick={() => setViewItem(null)}
                  className="px-4 py-2 rounded-full ring-1 ring-brand-dark/10 text-xs font-semibold hover:bg-brand-light cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={() => { setViewItem(null); handleViewReport(viewItem); }}
                  className="px-5 py-2 bg-[#cc0000] text-white font-bold rounded-full hover:bg-red-700 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  {t('admin.viewReport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}