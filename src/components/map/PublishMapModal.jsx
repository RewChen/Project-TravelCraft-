import { useRef, useState } from 'react';
import { Check, X, Video, Camera, Tag, Utensils, Plane, Trees, Gamepad2, Landmark, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const getYouTubeEmbedUrl = (value) => {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace('www.', '').toLowerCase();
    let videoId = '';

    if (hostname === 'youtu.be') {
      videoId = url.pathname.slice(1);
    } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
      if (url.pathname.startsWith('/shorts/')) videoId = url.pathname.split('/')[2] || '';
      if (url.pathname.startsWith('/embed/')) videoId = url.pathname.split('/')[2] || '';
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
};

const privacyOptions = [
  { value: 'public', labelKey: 'editor.public', descKey: 'editor.publicDesc' },
  { value: 'unlisted', labelKey: 'editor.unlisted', descKey: 'editor.unlistedDesc' },
  { value: 'private', labelKey: 'editor.private', descKey: 'editor.privateDesc' }
];

const presetTags = [
  { value: 'restaurant', labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  { value: 'travel', labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  { value: 'park', labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  { value: 'game', labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  { value: 'attraction', labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
];

export default function PublishMapModal({ mapItem, onClose, onPublish }) {
  const { t } = useApp();
  const [title, setTitle] = useState(mapItem.title || mapItem.details?.title || '');
  const [description, setDescription] = useState(mapItem.description || mapItem.details?.lore || '');
  const [coverImage, setCoverImage] = useState(mapItem.imageUrl || '');
  const [coverError, setCoverError] = useState('');
  const [tags, setTags] = useState(Array.isArray(mapItem.tags) ? [...mapItem.tags] : []);
  const [customTagInput, setCustomTagInput] = useState('');
  const [privacy, setPrivacy] = useState(mapItem.privacy === 'private' ? 'private' : 'public');
  const [videoUrl, setVideoUrl] = useState(mapItem.videoUrl || mapItem.details?.videoUrl || '');
  const [videoError, setVideoError] = useState('');
  const [selfieUrls, setSelfieUrls] = useState(
    mapItem.selfieUrls || (mapItem.selfieUrl ? [mapItem.selfieUrl] : []) || []
  );
  const [selfieError, setSelfieError] = useState('');

  const coverInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const hasTag = (tag) => tags.some((existing) => existing.toLowerCase() === tag.toLowerCase());
  const toggleTag = (tag) => {
    setTags((prev) => hasTag(tag)
      ? prev.filter((existing) => existing.toLowerCase() !== tag.toLowerCase())
      : [...prev, tag]);
  };
  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (!hasTag(tag)) setTags((prev) => [...prev, tag]);
    setCustomTagInput('');
  };
  const removeTag = (tag) => {
    setTags((prev) => prev.filter((existing) => existing.toLowerCase() !== tag.toLowerCase()));
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCoverError(t('editor.onlyImage'));
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCoverError(t('editor.imageTooLarge'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result);
      setCoverError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setVideoError(t('editor.onlyVideo'));
      event.target.value = '';
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setVideoError(t('editor.videoTooLarge'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVideoUrl(reader.result);
      setVideoError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSelfieUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remainingSlots = 9 - selfieUrls.length;
    if (files.length > remainingSlots) {
      setSelfieError(t('editor.selfieTooMany', { max: 9 }));
    }
    const toProcess = files.slice(0, remainingSlots);
    let hasError = false;
    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setSelfieError(t('editor.onlyImage'));
        hasError = true;
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setSelfieError(t('editor.imageTooLarge'));
        hasError = true;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelfieUrls((prev) => {
          if (prev.length >= 9) return prev;
          return [...prev, reader.result];
        });
        setSelfieError('');
      };
      reader.readAsDataURL(file);
    });
    if (!hasError && toProcess.length) setSelfieError('');
    event.target.value = '';
  };

  const removeSelfieAt = (idx) => {
    setSelfieUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const finalVideoUrl = videoUrl.trim();
    if (finalVideoUrl && !finalVideoUrl.startsWith('data:video/')) {
      const embedUrl = getYouTubeEmbedUrl(finalVideoUrl);
      if (!embedUrl) {
        setVideoError(t('editor.videoUrlError'));
        return;
      }
    }
    onPublish({
      title: title.trim(),
      description: description.trim(),
      imageUrl: coverImage || null,
      tags: tags.map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean),
      privacy,
      videoUrl: finalVideoUrl.startsWith('data:video/') ? finalVideoUrl : (finalVideoUrl ? getYouTubeEmbedUrl(finalVideoUrl) : null),
      selfieUrl: selfieUrls[0] || null,
      selfieUrls: selfieUrls.length ? [...selfieUrls] : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); handleSubmit(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <h2 className="font-black uppercase tracking-wide">{t('editor.publishTitle')}</h2>
          <button type="button" onClick={onClose} title={t('editor.close')} className="w-7 h-7 bg-white text-black border-2 border-black rounded flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label htmlFor="publish-title" className="block text-xs font-black uppercase mb-1.5">{t('editor.mapTitle')}</label>
            <input id="publish-title" value={title} onChange={(event) => setTitle(event.target.value)} required className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50" />
          </div>
          <div>
            <label htmlFor="publish-description" className="block text-xs font-black uppercase mb-1.5">{t('editor.description')}</label>
            <textarea id="publish-description" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('editor.descriptionPh')} className="w-full border-2 border-black rounded p-2.5 text-sm font-bold bg-gray-50 focus:outline-none focus:bg-amber-50 resize-y" />
          </div>
          {/* Cover Image — used as the map cover shown in the Community feed */}
          <div>
            <label className="block text-xs font-black uppercase mb-1.5">{t('editor.mapCover')}</label>
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
            <div className="flex gap-2 items-start">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="shrink-0 border-2 border-black rounded bg-amber-400 hover:bg-amber-300 px-3 py-2.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4" /> {t('editor.uploadCover')}
              </button>
              <div className="flex-1 min-w-0">
                {coverImage ? (
                  <div className="relative border-2 border-black rounded overflow-hidden bg-gray-50">
                    <img src={coverImage} alt={t('editor.coverPreviewAlt')} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="absolute top-1 right-1 w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90 cursor-pointer"
                      title={t('editor.removeCover')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.coverHelper')}</p>
                )}
                {coverError && <p className="mt-1 text-[10px] text-red-600 font-bold">{coverError}</p>}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-[#cc0000]" /> {t('myMaps.tagsTitle')}</label>
            <p className="mb-2 text-[10px] text-gray-500 font-bold">{t('myMaps.tagsHelp')}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presetTags.map(({ value, labelKey, emoji, icon: Icon }) => {
                const active = hasTag(value);
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleTag(value)}
                    className={`px-2.5 py-1.5 border-2 border-black text-[9px] font-black uppercase flex items-center gap-1 rounded cursor-pointer ${active ? 'bg-amber-300' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {active ? <Check className="w-3 h-3" /> : <span className="text-[11px]">+</span>} <Icon className="w-3 h-3" /> {emoji} {t(labelKey)}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-1 border-2 border-black bg-gray-50 p-1.5">
                <Tag className="w-4 h-4 text-[#cc0000] shrink-0" />
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
            {tags.filter((tag) => !presetTags.some((preset) => preset.value === tag)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.filter((tag) => !presetTags.some((preset) => preset.value === tag)).map((tag) => (
                  <span key={tag} className="px-2 py-1 border-2 border-black bg-amber-100 text-[9px] font-black uppercase flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-red-600 font-black cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="publish-video" className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> {t('editor.mapVideo')}
            </label>
            <div className="flex gap-2">
              <input
                id="publish-video"
                type="url"
                value={videoUrl.startsWith('data:') ? '' : videoUrl}
                onChange={(event) => { setVideoUrl(event.target.value); setVideoError(''); }}
                placeholder={t('editor.videoYtPh')}
                className="min-w-0 flex-1 border-2 border-black rounded p-2.5 text-xs font-bold bg-gray-50 focus:outline-none focus:bg-amber-50"
              />
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              <button type="button" onClick={() => videoInputRef.current?.click()} className="shrink-0 border-2 border-black rounded bg-amber-400 px-3 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Video className="w-4 h-4 mx-auto" />
                <span className="sr-only">{t('editor.uploadVideo')}</span>
              </button>
            </div>
            {videoUrl.startsWith('data:video/') && <p className="mt-1 text-[10px] text-emerald-700 font-bold">{t('editor.videoSelected')}</p>}
            {videoError && <p className="mt-1 text-[10px] text-red-600 font-bold">{videoError}</p>}
            <p className="mt-1 text-[10px] text-gray-500 font-bold">{t('editor.videoHelper')}</p>
          </div>
          {/* Selfie attachment for Traveler Logs (บันทึกการเดินทาง) */}
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> {t('editor.selfiePhoto')}
            </label>
            <div className="flex gap-2 items-start">
              <input ref={selfieInputRef} type="file" accept="image/*" multiple onChange={handleSelfieUpload} className="hidden" />
              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                className="shrink-0 border-2 border-black rounded bg-sky-400 hover:bg-sky-300 px-3 py-2.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4" /> {t('editor.attachSelfie')} {selfieUrls.length ? `(${selfieUrls.length}/9)` : ''}
              </button>
              <div className="flex-1 min-w-0">
                {selfieUrls.length ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {selfieUrls.map((url, idx) => (
                        <div key={`${url.slice(0, 20)}-${idx}`} className="relative border-2 border-black rounded overflow-hidden bg-gray-50 group">
                          <img src={url} alt={`${t('editor.selfiePreviewAlt')} ${idx + 1}`} className="w-full h-20 object-cover" />
                          <button
                            type="button"
                            onClick={() => removeSelfieAt(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 opacity-90"
                            title={t('editor.removeSelfie')}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] font-bold text-center py-0.5">{idx + 1}/9</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold">{t('editor.selfieSelected')} · {selfieUrls.length} {t('editor.imagesAttached')}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-bold leading-tight pt-1">{t('editor.selfieHelper')}</p>
                )}
                {selfieError && <p className="mt-1 text-[10px] text-red-600 font-bold">{selfieError}</p>}
              </div>
            </div>
          </div>
          <fieldset>
            <legend className="block text-xs font-black uppercase mb-2">{t('editor.privacy')}</legend>
            <div className="grid grid-cols-3 gap-2">
              {privacyOptions.map((option) => (
                <label key={option.value} className={`border-2 border-black rounded p-2 cursor-pointer ${privacy === option.value ? 'bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="privacy" value={option.value} checked={privacy === option.value} onChange={(event) => setPrivacy(event.target.value)} className="sr-only" />
                  <span className="block text-xs font-black uppercase">{t(option.labelKey)}</span>
                  <span className="block mt-1 text-[9px] leading-tight font-bold text-gray-600">{t(option.descKey)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
            <button type="button" onClick={onClose} className="px-4 py-2 border-2 border-black rounded font-black text-xs uppercase hover:bg-gray-100">{t('editor.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-[#cc0000] text-white border-2 border-black rounded font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">{t('editor.publishMap')}</button>
          </div>
        </div>
      </form>
    </div>
  );
}