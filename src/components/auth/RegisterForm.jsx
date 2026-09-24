import { useState, useRef } from 'react';
import { Plus, Key, Mail, User as UserIcon, AlertCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import SocialAuthButtons from './SocialAuthButtons';
import { compressForUpload, fileToDataUrl } from '../../lib/imageUtils';
import { uploadAvatar } from '../../lib/supabaseAvatar';
import { dataUrlToFile } from '../../lib/supabaseUserAssets';

export default function RegisterForm() {
  const { login, setAuthMode, t } = useApp();
  
  const [selectedSprite, setSelectedSprite] = useState(0);
  const [customSprite, setCustomSprite] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Cartographer');
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const defaultSprites = ['🏃', '🧙', '🤠', '🥷'];
  const roles = [
    { id: 'Novice Traveler', labelKey: 'auth.roleNovice' },
    { id: 'Cartographer', labelKey: 'auth.roleCartographer' },
    { id: 'Gym Leader', labelKey: 'auth.roleGymLeader' },
    { id: 'Game Master', labelKey: 'auth.roleGameMaster' }
  ];

  const handleCustomSpriteUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomSprite(reader.result);
        setSelectedSprite(defaultSprites.length);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg(t('auth.passTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passMismatch'));
      return;
    }

    let spriteFile = null;
    let chosenAvatar = selectedSprite < defaultSprites.length 
      ? defaultSprites[selectedSprite] 
      : (customSprite || '🏃');

    // Custom sprite: compress up-front so we never persist a multi-MB base64.
    // Prefer uploading to Storage right after signup; keep the small data URL
    // only as a metadata fallback for the pre-confirmation window.
    if (selectedSprite >= defaultSprites.length && customSprite) {
      try {
        const raw = dataUrlToFile(customSprite, 'sprite');
        if (raw) {
          spriteFile = await compressForUpload(raw, { maxWidth: 256, quality: 0.8 }, 'webp');
          const small = await fileToDataUrl(spriteFile);
          if (small) chosenAvatar = small;
        }
      } catch (err) {
        console.warn('Sprite compression skipped:', err);
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trainerEmail.trim(),
        password,
        options: {
          data: {
            username: trainerName.trim() || t('auth.trainer'),
            avatar: chosenAvatar,
            role: selectedRole
          }
        }
      });

      if (error) {
        // Supabase may return 403 if signups are disabled
        if (error.status === 403 || error.message.includes('Signups not allowed')) {
          setErrorMsg(t('auth.signupsDisabled'));
        } else if (error.status === 429) {
          setErrorMsg(t('auth.rateLimit'));
        } else if (error.message.includes('already registered')) {
          setErrorMsg(t('auth.emailTaken'));
        } else {
          setErrorMsg(error.message);
        }
      } else {
        // Replace the metadata sprite with a tiny Storage URL when a session
        // already exists (email confirmation disabled). Otherwise the small
        // data URL is migrated on first login.
        if (spriteFile && data?.user?.id) {
          try {
            const url = await uploadAvatar(data.user.id, spriteFile);
            if (url) {
              await supabase.from('users').update({ avatar: url }).eq('id', data.user.id);
              await supabase.auth.updateUser({ data: { avatar: url } }).catch(() => {});
            }
          } catch (err) {
            console.warn('Sprite storage upload skipped:', err);
          }
        }
        login(); // Context login function sets isLoggedIn and moves to home
      }
    } catch {
      setErrorMsg(t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-2.5 font-thai text-brand-dark">
      <p className="text-[10px] text-brand-dark/60 leading-tight">
        {t('auth.registerDesc')}
      </p>

      <SocialAuthButtons mode="register" />

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-2xl text-[10px] font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-2xl text-[10px] font-semibold">
          {successMsg}
        </div>
      )}

      {/* Choose / Upload Your Sprite */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1 uppercase flex justify-between items-center">
          <span>{t('auth.chooseSprite')}</span>
          <span className="text-[9px] text-brand-dark/50">{t('auth.clickUpload')}</span>
        </label>
        
        <div className="grid grid-cols-5 gap-1.5">
          {defaultSprites.map((sprite, idx) => (
            <button 
              key={idx} 
              type="button" 
              onClick={() => setSelectedSprite(idx)} 
              className={`h-10 border border-brand-dark/15 rounded-full flex items-center justify-center text-lg bg-white transition-all cursor-pointer relative ${
                selectedSprite === idx ? 'bg-amber-400 border-amber-400 font-semibold scale-105' : 'hover:bg-brand-light/60'
              }`}
              title={`${t('auth.presetSprite')} ${idx + 1}`}
            >
              {sprite}
              {selectedSprite === idx && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-dark rounded-full flex items-center justify-center text-white text-[8px]">
                  ✓
                </span>
              )}
            </button>
          ))}

          <button 
            type="button" 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className={`h-10 border border-brand-dark/15 rounded-full flex items-center justify-center bg-white transition-all cursor-pointer relative overflow-hidden ${
              selectedSprite === defaultSprites.length ? 'bg-amber-400 border-amber-400 scale-105' : 'hover:bg-amber-100'
            }`}
            title={t('auth.uploadCustomSprite')}
          >
            {customSprite ? (
              <img src={customSprite} alt={t('auth.uploadCustomSprite')} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-brand-dark">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
            )}
            
            {selectedSprite === defaultSprites.length && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-dark rounded-full flex items-center justify-center text-white text-[8px] z-10">
                ✓
              </span>
            )}
          </button>

          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleCustomSpriteUpload} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Select Trainer Role */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> {t('auth.selectRole')}
        </label>
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{t(r.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Trainer Name */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase">{t('auth.trainerName')}</label>
        <div className="relative">
          <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input 
            type="text" 
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            placeholder={t('auth.trainerNamePh')} 
            required
            className="w-full pl-8 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase">{t('auth.trainerEmail')}</label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input 
            type="email" 
            value={trainerEmail}
            onChange={(e) => setTrainerEmail(e.target.value)}
            placeholder={t('auth.trainerEmailPh')} 
            required
            className="w-full pl-8 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
          />
        </div>
      </div>

      {/* Secret Key Password */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase">{t('auth.secretKey')}</label>
        <div className="relative">
          <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            required
            className="w-full pl-8 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
          />
        </div>
      </div>

      {/* Confirm Secret Key Password */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-1.5 uppercase">{t('auth.confirmSecret')}</label>
        <div className="relative">
          <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••" 
            required
            className="w-full pl-8 pr-3 py-2.5 border border-brand-dark/15 rounded-full bg-brand-light/40 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-semibold py-3 px-4 rounded-full text-xs uppercase mt-2 cursor-pointer hover:bg-[#b30000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-15px_rgba(204,0,0,0.6)]"
      >
        {loading ? t('auth.registering') : t('auth.startAdventure')}
      </button>

      <div className="text-center pt-0.5">
        <button 
          type="button" 
          onClick={() => setAuthMode('login')} 
          className="text-xs font-semibold underline text-brand-dark cursor-pointer"
        >
          {t('auth.alreadyRegistered')}
        </button>
      </div>
    </form>
  );
}
