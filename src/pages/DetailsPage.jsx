import LocationHero from '../components/details/LocationHero';
import LocationLore from '../components/details/LocationLore';
import TravelerLogs from '../components/details/TravelerLogs';
import LocationStats from '../components/details/LocationStats';
import WildEncounters from '../components/details/WildEncounters';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DetailsPage() {
  const { navigateTo } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">
      <button
        onClick={() => navigateTo('map')}
        className="text-xs font-black bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to World Map
      </button>

      {/* Top Hero Banner */}
      <LocationHero />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Content Column */}
        <div className="md:col-span-2 space-y-6">
          <LocationLore />
          <TravelerLogs />
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          <LocationStats />
          <WildEncounters />
        </div>
      </div>
    </div>
  );
}
