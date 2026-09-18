import { useState } from 'react';
import LocationHero from '../components/details/LocationHero';
import LocationLore from '../components/details/LocationLore';
import TravelerLogs from '../components/details/TravelerLogs';
import LocationReviews from '../components/reviews/LocationReviews';
import LocationStats from '../components/details/LocationStats';
import WildEncounters from '../components/details/WildEncounters';
import Reveal from '../components/motion/Reveal';
import ReportLocationModal from '../components/report/ReportLocationModal';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function DetailsPage() {
  const { navigateTo, t, selectedLocation, trackLocationView, isLoggedIn, setAuthMode } = useApp();
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    trackLocationView(selectedLocation);
  }, [selectedLocation, trackLocationView]);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">
      <button
        onClick={() => navigateTo('map')}
        className="text-xs font-black bg-white hover:bg-gray-100 border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> {t('details.backToMap')}
      </button>

      {/* Top Hero Banner (รูป+วิดีโอสลับในปกเดียว) */}
      <Reveal>
        <LocationHero />
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Content Column */}
        <div className="md:col-span-2 space-y-6">
          <Reveal delay={80}>
            <LocationLore />
          </Reveal>
          <Reveal delay={120}>
            <TravelerLogs />
          </Reveal>
          <Reveal delay={160}>
            <LocationReviews />
          </Reveal>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          <Reveal delay={100}>
            <LocationStats />
          </Reveal>
          <Reveal delay={180}>
            <WildEncounters />
          </Reveal>
        </div>
      </div>

      {/* Report Location — floating button, bottom-right */}
      <button
        onClick={() => {
          if (!isLoggedIn) {
            setAuthMode('login');
            navigateTo('auth');
            return;
          }
          setShowReport(true);
        }}
        className="fixed bottom-6 right-6 z-50 bg-[#cc0000] hover:bg-red-700 text-white font-black px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
      >
        <AlertTriangle className="w-4 h-4" /> {t('details.reportLocation')}
      </button>

      <ReportLocationModal
        key={showReport ? 'open' : 'closed'}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        locationName={selectedLocation?.title}
        mapId={selectedLocation?.id || null}
      />
    </div>
  );
}