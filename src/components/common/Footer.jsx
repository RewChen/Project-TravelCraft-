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
    <footer className="text-center text-xs text-gray-600 dark:text-slate-300 my-8 space-y-2 font-mono">
      <div className="flex justify-center gap-6 font-bold underline">
        <button type="button" onClick={openInfo('legal')} className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">{t('footer.legal')}</button>
        <button type="button" onClick={openInfo('support')} className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">{t('footer.support')}</button>
        <button type="button" onClick={openInfo('trainerClub')} className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">{t('footer.trainerClub')}</button>
      </div>
      <p className="text-[11px] font-medium">{t('footer.copyright')}</p>
      <FooterInfoModal section={infoSection} onClose={() => setInfoSection(null)} />
    </footer>
  );
}