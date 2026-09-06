import { useApp } from '../../context/AppContext';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="text-center text-xs text-gray-600 dark:text-slate-300 my-8 space-y-2 font-mono">
      <div className="flex justify-center gap-6 font-bold underline">
        <button className="hover:text-black dark:hover:text-white transition-colors">{t('footer.legal')}</button>
        <button className="hover:text-black dark:hover:text-white transition-colors">{t('footer.support')}</button>
        <button className="hover:text-black dark:hover:text-white transition-colors">{t('footer.trainerClub')}</button>
      </div>
      <p className="text-[11px] font-medium">{t('footer.copyright')}</p>
    </footer>
  );
}
