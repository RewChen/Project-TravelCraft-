import { useState } from 'react';
import { Globe, Save, ShieldAlert, Cpu, Database, Award, MapPin } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function GlobalSettingsTab() {
  const { globalSettings, updateGlobalSettings, t } = useApp();

  const [settings, setSettings] = useState(globalSettings);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateGlobalSettings(settings);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span>{t('admin.globalMapSettings')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            {t('admin.configureRegional')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="self-start sm:self-center bg-[#cc0000] hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{t('admin.saveSettings')}</span>
        </button>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Cartography & Quota Controls */}
        <div className="bg-white border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="border-b-2 border-black pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-sm uppercase">{t('admin.cartographyPolicies')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1 text-gray-700">
                {t('admin.maxPinsPerMap')}
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={settings.maxPinsPerMap}
                onChange={(e) => handleChange('maxPinsPerMap', Number(e.target.value))}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2 text-xs font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="text-xs font-black uppercase text-black">{t('admin.autoApprove')}</div>
                <div className="text-[10px] text-gray-500 font-sans">
                  {t('admin.autoApproveDesc')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveCommunity}
                onChange={(e) => handleChange('autoApproveCommunity', e.target.checked)}
                className="w-5 h-5 accent-[#cc0000] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="text-xs font-black uppercase text-black">{t('admin.fastTravel')}</div>
                <div className="text-[10px] text-gray-500 font-sans">
                  {t('admin.fastTravelDesc')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowFastTravel}
                onChange={(e) => handleChange('allowFastTravel', e.target.checked)}
                className="w-5 h-5 accent-[#cc0000] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Economy & Server Maintenance */}
        <div className="bg-white border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="border-b-2 border-black pb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-sm uppercase">{t('admin.economyRules')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1 text-gray-700">
                {t('admin.coinMultiplier')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={settings.coinMultiplier}
                onChange={(e) => handleChange('coinMultiplier', Number(e.target.value))}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2 text-xs font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1 text-gray-700">
                {t('admin.autoBanThreshold')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.autoBanStrikeThreshold}
                onChange={(e) => handleChange('autoBanStrikeThreshold', Number(e.target.value))}
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-2 text-xs font-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-400 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="text-xs font-black uppercase text-red-900 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>{t('admin.maintenanceMode')}</span>
                </div>
                <div className="text-[10px] text-red-700 font-sans">
                  {t('admin.maintenanceModeDesc')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-5 h-5 accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

