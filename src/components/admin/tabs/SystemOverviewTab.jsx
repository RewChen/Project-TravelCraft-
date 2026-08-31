import { useState } from 'react';
import {
  Search,
  Filter,
  Users,
  Compass,
  MapPin,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function SystemOverviewTab({ onOpenDeployModal }) {
  const { mapPins, communityMaps, baseMaps, trainers, reportedLocations, showAdminToast, trackMapOnWorldMap } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtered Pins / Locations from current network
  const allNetworkLocations = [
    ...mapPins.map((p) => ({ ...p, status: 'Active', source: 'World Pins' })),
    ...communityMaps.map((c) => ({
      id: c.id,
      title: c.title,
      region: c.details?.region || 'Global Realm',
      category: c.category || 'landmarks',
      visitors: c.details?.visitors || '100K / yr',
      popularity: c.popularityLv || 85,
      status: 'Active',
      source: 'Community Map',
      rawItem: c
    }))
  ];

  const filteredLocations = allNetworkLocations.filter((item) => {
    const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.region?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header & Deploy Update Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>System Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            Current status of the Odyssey Network.
          </p>
        </div>

        <button
          onClick={onOpenDeployModal}
          className="self-start sm:self-center bg-[#cc0000] hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Deploy Update</span>
        </button>
      </div>

      {/* Filter / Search Bar Card */}
      <div className="bg-white border-4 border-black rounded-2xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Search Locations */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-black uppercase mb-1.5 text-gray-700">
              Search Locations
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location name..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-black uppercase mb-1.5 text-gray-700">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="landmarks">Landmarks</option>
              <option value="temples">Temples & Shrines</option>
              <option value="cafes">Cafes & Shops</option>
              <option value="viewpoints">Viewpoints</option>
              <option value="nature">Nature</option>
              <option value="urban">Urban</option>
            </select>
          </div>

          {/* Status */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black uppercase mb-1.5 text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          {/* Filter Button */}
          <div className="sm:col-span-2">
            <button
              onClick={() => showAdminToast(`Filter applied: ${filteredLocations.length} locations matching`, 'info')}
              className="w-full py-2 px-4 bg-[#cc0000] hover:bg-red-700 text-white font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid (Matching Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT_01: Total Trainers */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="bg-[#4862db] text-white px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_01</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">Total Trainers</div>
            <div className="text-3xl font-black text-black">42,091</div>
            <div className="mt-2 text-xs font-black text-amber-600 flex items-center gap-1">
              <span>↑ +12% this week</span>
            </div>
          </div>
        </div>

        {/* STAT_02: Active Maps */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="bg-[#eab308] text-black px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_02</span>
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">Active Maps</div>
            <div className="text-3xl font-black text-black">8,432</div>
            <div className="mt-2 text-xs font-black text-[#cc0000] flex items-center gap-1">
              <span>↓ -2% this week</span>
            </div>
          </div>
        </div>

        {/* STAT_03: Locations Found */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div className="bg-[#cc0000] text-white px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>STAT_03</span>
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">Locations Found</div>
            <div className="text-3xl font-black text-black">1.2M</div>
            {/* Milestone Progress Bar */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-gray-200 border border-black rounded-full h-2 overflow-hidden">
                <div className="bg-[#cc0000] h-full w-[85%]"></div>
              </div>
              <div className="text-[10px] font-bold text-gray-500 text-right">85% to milestone</div>
            </div>
          </div>
        </div>

        {/* SERVER_LOAD: Capacity 42% */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:8px_8px]">
          <div className="bg-gray-200 text-gray-800 px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
            <span>SERVER_LOAD</span>
            <Settings className="w-3.5 h-3.5 animate-spin [animation-duration:8s]" />
          </div>
          <div className="p-4">
            <div className="text-[11px] font-black uppercase text-gray-500 mb-1">Capacity</div>
            <div className="text-3xl font-black text-black">42%</div>
            <div className="mt-2 text-xs font-black text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network POI Registry Table */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-gray-100 border-b-4 border-black p-4 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <span>🌍 Live Odyssey Point Registry</span>
            <span className="text-[10px] bg-amber-400 border border-black px-2 py-0.5 rounded-full font-bold">
              {filteredLocations.length} Found
            </span>
          </h3>
          <span className="text-[10px] text-gray-500 font-bold hidden sm:inline">
            Status: Synchronized with Supabase Edge
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200 border-b-2 border-black text-gray-800 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3">Location Name</th>
                <th className="p-3">Region</th>
                <th className="p-3">Category</th>
                <th className="p-3">Popularity</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100 font-bold">
              {filteredLocations.slice(0, 6).map((loc, idx) => (
                <tr key={loc.id || idx} className="hover:bg-amber-50/60 transition-colors">
                  <td className="p-3 font-black text-black flex items-center gap-2">
                    <span>{loc.icon || '📍'}</span>
                    <span>{loc.title}</span>
                  </td>
                  <td className="p-3 text-gray-600">{loc.region}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 border border-black px-2 py-0.5 rounded text-[10px] uppercase">
                      {loc.category}
                    </span>
                  </td>
                  <td className="p-3 text-indigo-700">Lv. {loc.popularity || 80}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-400 px-2 py-0.5 rounded-full font-black">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{loc.status}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {loc.rawItem ? (
                      <button
                        onClick={() => trackMapOnWorldMap(loc.rawItem)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => showAdminToast(`Inspecting pin ${loc.title}`, 'info')}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

