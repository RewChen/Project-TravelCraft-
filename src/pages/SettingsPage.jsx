import { Check, Moon, Sun, Languages, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { language, setLanguage, languages, themeMode, setThemeMode, t } = useApp();
  const isDark = themeMode === 'dark';

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6 font-mono">
      {/* Header */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#cc0000] border-2 border-black rounded-lg flex items-center justify-center text-white">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">{t('settings.title')}</h1>
            <p className="text-xs text-gray-600 font-sans">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-1">
          <Languages className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-black uppercase">{t('settings.language')}</h2>
        </div>
        <p className="text-xs text-gray-600 font-sans mb-4">{t('settings.languageDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between px-4 py-3 border-2 border-black rounded-lg transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-amber-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span>
                    <span className="block text-sm font-black uppercase">{lang.native}</span>
                    <span className="block text-[10px] text-gray-600 font-bold">{lang.name}</span>
                  </span>
                </span>
                {isActive && <Check className="w-5 h-5 text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Selector */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-black uppercase">{t('settings.theme')}</h2>
        </div>
        <p className="text-xs text-gray-600 font-sans mb-4">{t('settings.themeDesc')}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-black rounded-lg transition-all cursor-pointer font-black text-xs uppercase ${
              !isDark
                ? 'bg-amber-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <Sun className="w-4 h-4" /> {t('settings.light')}
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-black rounded-lg transition-all cursor-pointer font-black text-xs uppercase ${
              isDark
                ? 'bg-amber-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <Moon className="w-4 h-4" /> {t('settings.dark')}
          </button>
        </div>
      </div>
    </div>
  );
}