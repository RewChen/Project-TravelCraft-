import { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function ReportedLocationsTab() {
  const {
    reportedLocations,
    resolveReport,
    hideReportedLocation,
    deleteReportedLocation,
    warnTrainer,
    banTrainer,
    t
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner (Matching Image 4) */}
      <div className="space-y-2">
        <div className="bg-[#eab308] border-4 border-black rounded-2xl p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] inline-block w-full">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>{t('admin.reportedLocationsTitle')}</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 font-bold pl-1 border-l-4 border-[#cc0000]">
          {t('admin.investigateDesc')}
        </p>
      </div>

      {/* Two Column Layout (Matching Image 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): REPORT QUEUE Table */}
        <div className="lg:col-span-2 bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Red Header Bar with High Priority Badge */}
          <div className="bg-[#cc0000] text-white border-b-4 border-black p-3.5 px-5 flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{t('admin.reportQueue')}</span>
            </h3>
            <span className="bg-white text-black text-[10px] font-black px-3 py-0.5 rounded-full border border-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {t('admin.highPriority')}
            </span>
          </div>

          {/* Report Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b-2 border-black text-gray-800 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3.5 px-4">{t('admin.locationName')}</th>
                  <th className="p-3.5">{t('admin.creator')}</th>
                  <th className="p-3.5">{t('admin.category')}</th>
                  <th className="p-3.5">{t('admin.count')}</th>
                  <th className="p-3.5 text-center">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100 font-bold">
                {reportedLocations.map((item) => {
                  const isResolved = item.status === 'resolved';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        item.isHidden ? 'bg-gray-50 opacity-75' : ''
                      }`}
                    >
                      {/* Location Name */}
                      <td className="p-3.5 px-4 font-black text-black">
                        <div className="flex items-center gap-2">
                          <span className={item.category === 'SPAM' ? 'text-red-600' : 'text-black'}>
                            {item.locationName}
                          </span>
                          {item.isHidden && (
                            <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded border border-black uppercase">
                              {t('admin.hidden')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Creator */}
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

                      {/* Report Count */}
                      <td className="p-3.5 font-black text-red-600">{item.count}</td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        {isResolved ? (
                          <span className="px-3 py-1 bg-gray-100 border border-gray-400 text-gray-500 rounded text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{t('admin.resolved')}</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Delete (Red trash) */}
                            <button
                              onClick={() => deleteReportedLocation(item.id)}
                              title={t('admin.deleteLocation')}
                              className="w-7 h-7 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Hide (Yellow eye) */}
                            <button
                              onClick={() => hideReportedLocation(item.id)}
                              title={item.isHidden ? t('admin.unhideLocation') : t('admin.hideLocation')}
                              className="w-7 h-7 bg-[#eab308] hover:bg-amber-400 text-black border-2 border-black rounded-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                            >
                              {item.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>

                            {/* Resolve (Green check) */}
                            <button
                              onClick={() => resolveReport(item.id)}
                              title={t('admin.markResolved')}
                              className="w-7 h-7 bg-white hover:bg-gray-100 text-emerald-600 border-2 border-black rounded-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
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

          {/* Table Footer & Pagination */}
          <div className="bg-gray-100 border-t-2 border-black p-3 px-4 flex items-center justify-between text-xs text-gray-600 font-bold">
            <div>{t('admin.showingRecords', { count: reportedLocations.length })}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-6 h-6 bg-white hover:bg-gray-200 border border-black rounded flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-2 py-0.5 bg-amber-400 border border-black rounded font-black text-black">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-6 h-6 bg-white hover:bg-gray-200 border border-black rounded flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: CREATOR MOD & SYSTEM NOTICE (Matching Image 4) */}
        <div className="space-y-6">
          {/* CREATOR MOD (Yellow Header Box) */}
          <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#eab308] border-b-4 border-black p-3.5 px-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-black" />
              <h3 className="font-black text-xs uppercase tracking-wider text-black">{t('admin.creatorMod')}</h3>
            </div>

            <div className="p-4 space-y-4">
              {/* TOP OFFENDER: Grunt #42 */}
              <div className="border-2 border-dashed border-black rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-500">{t('admin.topOffender')}</span>
                  <span className="bg-[#cc0000] text-white text-[9px] font-black px-2 py-0.5 rounded border border-black uppercase">
                    24 {t('admin.strikes')}
                  </span>
                </div>
                <div className="font-black text-base text-[#cc0000]">Grunt #42</div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => warnTrainer('Grunt #42')}
                    className="py-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {t('admin.warn')}
                  </button>
                  <button
                    onClick={() => banTrainer('Grunt #42')}
                    className="py-1.5 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {t('admin.ban')}
                  </button>
                </div>
              </div>

              {/* RECENT OFFENDER: Trainer Blue */}
              <div className="border-2 border-dashed border-black rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-500">{t('admin.recentOffender')}</span>
                  <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded border border-black uppercase">
                    2 {t('admin.strikes')}
                  </span>
                </div>
                <div className="font-black text-base text-black">Trainer Blue</div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => warnTrainer('Trainer Blue')}
                    className="py-1.5 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {t('admin.warn')}
                  </button>
                  <button
                    onClick={() => banTrainer('Trainer Blue')}
                    className="py-1.5 bg-white hover:bg-red-50 text-red-600 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {t('admin.ban')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM NOTICE (Light Blue Box, Matching Image 4) */}
          <div className="bg-[#dbeafe] border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-black uppercase text-indigo-950 mb-1">{t('admin.systemNotice')}</div>
              <p className="text-[10px] font-sans font-bold text-indigo-900 leading-relaxed">
                {t('admin.autoBanNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

