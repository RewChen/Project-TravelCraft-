import { Check, Moon, Sun, Languages, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { language, setLanguage, languages, themeMode, setThemeMode, t } = useApp();
  const isDark = themeMode === 'dark';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 md:pt-10 pb-12 font-thai text-brand-dark dark:text-slate-100">
      {/* Header */}
      <div className="text-center mb-8 space-y-1">
        <div className="mx-auto w-12 h-12 bg-brand-dark rounded-2xl flex items-center justify-center text-white mb-3 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.3)]">
          <Palette className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">{t('settings.title')}</h1>
        <p className="text-sm font-medium text-brand-dark/60">{t('settings.subtitle')}</p>
      </div>

      {/* Settings Panel (Language + Theme) */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06]">
        {/* Language Selector */}
        <div className="p-6 border-b border-brand-dark/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Languages className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-bold uppercase text-brand-dark">{t('settings.language')}</h2>
          </div>
          <p className="text-xs text-brand-dark/60 mb-4">{t('settings.languageDesc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-amber-400 text-brand-dark shadow-[0_4px_14px_-6px_rgba(217,119,6,0.5)]'
                      : 'bg-brand-light/40 hover:bg-brand-light/80 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span>
                      <span className={`block text-sm font-semibold uppercase ${!isActive ? 'text-brand-dark dark:text-brand-cream' : ''}`}>{lang.native}</span>
                      <span className="block text-[10px] text-brand-dark/50 dark:text-brand-cream/70 font-medium">{lang.name}</span>
                    </span>
                  </span>
                  {isActive && <Check className="w-5 h-5 text-brand-dark stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Selector */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-brand-green" />
            <h2 className="text-base font-bold uppercase text-brand-dark">{t('settings.theme')}</h2>
          </div>
          <p className="text-xs text-brand-dark/60 mb-4">{t('settings.themeDesc')}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all cursor-pointer font-semibold text-xs uppercase ${
                !isDark
                  ? 'bg-amber-400 text-brand-dark shadow-[0_4px_14px_-6px_rgba(217,119,6,0.5)]'
                  : 'bg-brand-light/40 hover:bg-brand-light/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-brand-cream'
              }`}
            >
              <Sun className="w-4 h-4" /> {t('settings.light')}
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all cursor-pointer font-semibold text-xs uppercase ${
                isDark
                  ? 'bg-amber-400 text-brand-dark shadow-[0_4px_14px_-6px_rgba(217,119,6,0.5)]'
                  : 'bg-brand-light/40 hover:bg-brand-light/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-brand-cream'
              }`}
            >
              <Moon className="w-4 h-4" /> {t('settings.dark')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}