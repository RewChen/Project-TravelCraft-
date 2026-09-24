import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import FooterInfoModal from './FooterInfoModal';

export default function Footer() {
  const { t } = useApp();
  const [infoSection, setInfoSection] = useState(null);

  const openInfo = (section) => (e) => {
    e.preventDefault();
    setInfoSection(section);
  };

  return (
    <footer className="text-center text-xs text-brand-dark/60 dark:text-slate-300 my-10 space-y-2 font-thai">
      <div className="flex justify-center items-center gap-2 font-semibold">
        <img src="/logo.png" alt="TravelCraft Logo" className="w-5 h-5 object-contain" />
        <span className="font-extrabold tracking-wide text-brand-dark dark:text-slate-100">TRAVELCRAFT</span>
      </div>
      <div className="flex justify-center gap-6 font-semibold">
        <button type="button" onClick={openInfo('legal')} className="hover:text-brand-green dark:hover:text-white transition-colors cursor-pointer">{t('footer.legal')}</button>
        <button type="button" onClick={openInfo('support')} className="hover:text-brand-green dark:hover:text-white transition-colors cursor-pointer">{t('footer.support')}</button>
        <button type="button" onClick={openInfo('trainerClub')} className="hover:text-brand-green dark:hover:text-white transition-colors cursor-pointer">{t('footer.trainerClub')}</button>
      </div>
      <p className="text-[11px] font-medium">{t('footer.copyright')}</p>
      <FooterInfoModal section={infoSection} onClose={() => setInfoSection(null)} />
    </footer>
  );
}