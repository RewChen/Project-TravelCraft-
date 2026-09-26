import { useState } from 'react';
import LocationHero from '../components/details/LocationHero';
import LocationLore from '../components/details/LocationLore';
import TravelerLogs from '../components/details/TravelerLogs';
import LocationReviews from '../components/reviews/LocationReviews';
import LocationStats from '../components/details/LocationStats';
import OtherMaps from '../components/details/OtherMaps';
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
    <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-10 pb-12 space-y-6 font-thai text-brand-dark dark:text-slate-100">
      <button
        onClick={() => navigateTo('map')}
        className="text-xs font-semibold bg-white hover:bg-brand-light text-brand-dark rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]"
      >
        <ArrowLeft className="w-4 h-4" /> {t('details.backToMap')}
      </button>

      {/* Top Hero Banner (รูป+วิดีโอสลับในปกเดียว) */}
      <Reveal>
        <LocationHero key={selectedLocation?.id || selectedLocation?.title || 'location'} />
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
            <OtherMaps />
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
        className="fixed bottom-6 right-6 z-50 bg-[#cc0000] hover:bg-[#b30000] text-white font-semibold px-5 py-3 rounded-full text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]"
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