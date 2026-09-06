import { useState, useRef } from 'react';
import {
  X, ImagePlus, MapPin, Clock3, CircleDollarSign, Sun, Train,
  Utensils, Plane, Trees, Gamepad2, Landmark, Tag, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadMapCover } from '../../lib/supabaseUploads';

const presetTags = [
  { value: 'restaurant', labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  { value: 'travel', labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  { value: 'park', labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  { value: 'game', labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  { value: 'attraction', labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
];

const rarityTiers = [
  { value: 'common', labelKey: 'myMaps.rarityCommon', color: 'bg-gray-400 text-white', emoji: '⚪' },
  { value: 'rare', labelKey: 'myMaps.rarityRare', color: 'bg-sky-500 text-white', emoji: '🔵' },
  { value: 'epic', labelKey: 'myMaps.rarityEpic', color: 'bg-indigo-500 text-white', emoji: '🟣' },
  { value: 'legendary', labelKey: 'myMaps.rarityLegendary', color: 'bg-[#cc0000] text-white', emoji: '🔴' }
];

const privacyOptions = [
  { value: 'public', labelKey: 'myMaps.public', descKey: 'myMaps.publicDesc' },
  { value: 'unlisted', labelKey: 'myMaps.unlisted', descKey: 'myMaps.unlistedDesc' },
  { value: 'private', labelKey: 'myMaps.private', descKey: 'myMaps.privateDesc' }
];

export default function CreateMapForm({ onSubmit, onClose }) {
  const { t } = useApp();
  const fileInputRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [fields, setFields] = useState({
    locationCity: '',
    title: t('common.untitledMap'),
    description: '',
    hours: '',
    fee: '',
    bestTime: '',
    travel: '',
    tags: [],
    rarityTier: 'common',
    privacy: 'public'
  });

  const update = (field, value) => setFields((prev) => ({ ...prev, [field]: value }));

  const toggleTag = (value) => setFields((prev) => ({
    ...prev,
    tags: prev.tags.includes(value) ? prev.tags.filter((tag) => tag !== value) : [...prev.tags, value]
  }));

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (!fields.tags.includes(tag)) {
      setFields((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setCustomTagInput('');
  };

  const handleCoverSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError(t('myMaps.coverInvalidType'));
      return;
    }
    setCoverFile(file);
    setUploadError('');
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploadError('');
    const mapId = `comm-user-draft-${Date.now()}`;
    let imageUrl = '';
    if (coverFile) {
      setUploading(true);
      try {
        imageUrl = await uploadMapCover(mapId, coverFile);
      } catch (err) {
        console.warn('Cover upload failed; continuing without image:', err);
        setUploadError(t('myMaps.coverUploadFailed'));
      }
      setUploading(false);
    }
    onSubmit({
      ...fields,
      id: mapId,
      imageUrl,
      region: fields.locationCity
    });
  };

  const selectedRarity = rarityTiers.find((tier) => tier.value === fields.rarityTier) || rarityTiers[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white border-4 border-black rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-[#b40000] text-white p-4 border-b-4 border-black flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-black uppercase tracking-wide">{t('myMaps.createNewMap')}</h2>
          <button type="button" onClick={onClose} title={t('common.close')} className="w-8 h-8 bg-white text-black border-2 border-black rounded flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-6">

          {/* SECTION 1: MAP BANNER & LOCATION */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase mb-3">
              <span className="text-red-600">1.</span> {t('myMaps.coverBanner')}
            </div>

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-black rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-amber-50 transition-colors relative overflow-hidden min-h-32"
            >
              {coverPreview ? (
                <img src={coverPreview} alt={t('myMaps.coverPreviewAlt')} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-red-600" />
                  <span className="text-xs font-black uppercase">{t('myMaps.coverImage')}</span>
                  <span className="text-[9px] text-gray-500 font-bold">{t('myMaps.coverImagePh')}</span>
                </>
              )}
            </button>
            {uploadError && <p className="mt-1 text-[10px] text-red-600 font-bold">{uploadError}</p>}

            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-600" /> {t('myMaps.locationCity')} *</label>
              <input value={fields.locationCity} onChange={(event) => update('locationCity', event.target.value)} placeholder={t('myMaps.locationCityPh')} className="w-full border-2 border-black p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase mb-1.5">{t('myMaps.mapTitle')} *</label>
              <input required value={fields.title} onChange={(event) => update('title', event.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase mb-1.5">{t('myMaps.description')} *</label>
              <textarea rows="3" value={fields.description} onChange={(event) => update('description', event.target.value)} placeholder={t('myMaps.descPh')} className="w-full border-2 border-black p-2.5 text-xs font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
            </div>
          </div>

          <div className="border-t-4 border-black"></div>

          {/* SECTION 2: LOGISTICS & INFO */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase mb-3">
              <span className="text-red-600">2.</span> {t('myMaps.logisticsTitle')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                [Clock3, 'hours', 'myMaps.hours', '24/7'],
                [CircleDollarSign, 'fee', 'myMaps.fee', t('editor.freeExploration')],
                [Sun, 'bestTime', 'myMaps.bestTime', t('editor.anytime')],
                [Train, 'travel', 'myMaps.travel', t('editor.communityGateway')]
              ].map(([Icon, field, label, placeholder]) => (
                <label key={field} className="border-2 border-black p-2.5 block">
                  <span className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase"><Icon className="w-3.5 h-3.5" /> {t(label)}</span>
                  <input value={fields[field]} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} className="w-full mt-1 text-xs font-bold bg-transparent outline-none" />
                </label>
              ))}
            </div>
          </div>

          <div className="border-t-4 border-black"></div>

          {/* SECTION 3: TAGS & CATEGORIES */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase mb-3">
              <span className="text-red-600">3.</span> {t('myMaps.tagsTitle')}
              <span className="text-gray-500 font-bold normal-case ml-1">{t('myMaps.tagsHelp')}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {presetTags.map(({ value, labelKey, emoji, icon: Icon }) => {
                const active = fields.tags.includes(value);
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleTag(value)}
                    className={`px-2.5 py-1.5 border-2 border-black text-[9px] font-black uppercase flex items-center gap-1 rounded ${active ? 'bg-amber-300' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {active ? <Check className="w-3 h-3" /> : <span className="text-[11px]">+</span>} <Icon className="w-3 h-3" /> {emoji} {t(labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-1 border-2 border-black bg-gray-50 p-1.5">
                <Tag className="w-4 h-4 text-red-600 shrink-0" />
                <input
                  value={customTagInput}
                  onChange={(event) => setCustomTagInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomTag(); } }}
                  placeholder={t('myMaps.customTagPh')}
                  className="w-full text-xs font-bold bg-transparent outline-none"
                />
              </div>
              <button type="button" onClick={addCustomTag} className="shrink-0 px-4 py-2 bg-[#cc0000] text-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{t('myMaps.addTag')}</button>
            </div>

            {fields.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {fields.tags.filter((tag) => !presetTags.some((p) => p.value === tag)).map((tag) => (
                  <span key={tag} className="px-2 py-1 border-2 border-black bg-amber-100 text-[9px] font-black uppercase flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="text-red-600 font-black">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t-4 border-black"></div>

          {/* SECTION 4: RARITY & PRIVACY */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase mb-3">
              <span className="text-red-600">4.</span> {t('myMaps.settingsTitle')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1.5">{t('myMaps.rarityTier')}</label>
                <div className="relative">
                  <select
                    value={fields.rarityTier}
                    onChange={(event) => update('rarityTier', event.target.value)}
                    className="w-full border-2 border-black p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 appearance-none pr-8"
                  >
                    {rarityTiers.map((tier) => (
                      <option key={tier.value} value={tier.value}>{tier.emoji} {t(tier.labelKey)}</option>
                    ))}
                  </select>
                  <span className={`absolute right-1 top-1 bottom-1 flex items-center px-2 rounded ${selectedRarity.color}`}>{t(selectedRarity.labelKey)}</span>
                </div>
              </div>
              <fieldset>
                <legend className="text-[10px] font-black uppercase mb-2 flex items-center gap-1">{t('myMaps.visibility')}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {privacyOptions.map(({ value, labelKey, descKey }) => (
                    <label key={value} className={`border-2 border-black rounded p-2 cursor-pointer ${fields.privacy === value ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <input type="radio" name="create-privacy" value={value} checked={fields.privacy === value} onChange={() => update('privacy', value)} className="sr-only" />
                      <span className="block text-[10px] font-black uppercase">{t(labelKey)}</span>
                      <span className="block mt-1 text-[8px] leading-tight font-bold text-gray-600">{t(descKey)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-100 border-t-4 border-black flex justify-end gap-2 sticky bottom-0">
          <button type="button" onClick={onClose} disabled={uploading} className="px-5 py-2.5 bg-white border-2 border-black font-black text-xs uppercase">{t('common.cancel')}</button>
          <button type="submit" disabled={uploading} className="px-5 py-2.5 bg-[#b40000] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-2 disabled:opacity-50">
            {uploading ? t('myMaps.uploading') : `🚀 ${t('myMaps.createMap')}`}
          </button>
        </div>
      </form>
    </div>
  );
}
