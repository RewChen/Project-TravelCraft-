import { useState } from 'react';
import { Save, ShieldAlert, Award, MapPin } from 'lucide-react';
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
    <div className="space-y-6 font-thai">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-brand-dark flex items-center gap-2">
            <span>{t('admin.globalMapSettings')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-brand-dark/50 font-medium mt-1">
            {t('admin.configureRegional')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="self-start sm:self-center bg-[#cc0000] hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.25)]"
        >
          <Save className="w-4 h-4" />
          <span>{t('admin.saveSettings')}</span>
        </button>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Cartography & Quota Controls */}
        <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-5 space-y-4">
          <div className="border-b border-brand-dark/[0.06] pb-2 flex items-center gap-2 text-brand-dark">
            <MapPin className="w-5 h-5 text-brand-dark/60" />
            <h3 className="font-bold text-sm uppercase">{t('admin.cartographyPolicies')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-brand-dark/50">
                {t('admin.maxPinsPerMap')}
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={settings.maxPinsPerMap}
                onChange={(e) => handleChange('maxPinsPerMap', Number(e.target.value))}
                className="w-full bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-2xl">
              <div>
                <div className="text-xs font-semibold uppercase text-brand-dark">{t('admin.autoApprove')}</div>
                <div className="text-[10px] text-brand-dark/50 font-sans">
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

            <div className="flex items-center justify-between p-3 bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-2xl">
              <div>
                <div className="text-xs font-semibold uppercase text-brand-dark">{t('admin.fastTravel')}</div>
                <div className="text-[10px] text-brand-dark/50 font-sans">
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
        <div className="bg-white rounded-3xl ring-1 ring-brand-dark/[0.06] shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] p-5 space-y-4">
          <div className="border-b border-brand-dark/[0.06] pb-2 flex items-center gap-2 text-brand-dark">
            <Award className="w-5 h-5 text-brand-dark/60" />
            <h3 className="font-bold text-sm uppercase">{t('admin.economyRules')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-brand-dark/50">
                {t('admin.coinMultiplier')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={settings.coinMultiplier}
                onChange={(e) => handleChange('coinMultiplier', Number(e.target.value))}
                className="w-full bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-brand-dark/50">
                {t('admin.autoBanThreshold')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.autoBanStrikeThreshold}
                onChange={(e) => handleChange('autoBanStrikeThreshold', Number(e.target.value))}
                className="w-full bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 ring-1 ring-red-200 rounded-2xl">
              <div>
                <div className="text-xs font-semibold uppercase text-red-900 flex items-center gap-1">
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

