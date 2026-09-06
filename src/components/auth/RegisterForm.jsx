import { useState, useRef } from 'react';
import { Plus, Key, Mail, User as UserIcon, AlertCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

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

    const chosenAvatar = selectedSprite < defaultSprites.length 
      ? defaultSprites[selectedSprite] 
      : (customSprite || '🏃');

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
        login(); // Context login function sets isLoggedIn and moves to home
      }
    } catch (err) {
      setErrorMsg(t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-2.5 font-mono">
      <p className="text-[10px] text-gray-600 leading-tight">
        {t('auth.registerDesc')}
      </p>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-100 border-2 border-black text-emerald-800 p-2 rounded text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {successMsg}
        </div>
      )}

      {/* Choose / Upload Your Sprite */}
      <div>
        <label className="block text-xs font-black text-black mb-1 uppercase flex justify-between items-center">
          <span>{t('auth.chooseSprite')}</span>
          <span className="text-[9px] text-gray-500 font-sans">{t('auth.clickUpload')}</span>
        </label>
        
        <div className="grid grid-cols-5 gap-1.5">
          {defaultSprites.map((sprite, idx) => (
            <button 
              key={idx} 
              type="button" 
              onClick={() => setSelectedSprite(idx)} 
              className={`h-10 border-2 border-black rounded-lg flex items-center justify-center text-lg bg-gray-50 transition-all cursor-pointer relative ${
                selectedSprite === idx ? 'bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black scale-105' : 'hover:bg-gray-100'
              }`}
              title={`${t('auth.presetSprite')} ${idx + 1}`}
            >
              {sprite}
              {selectedSprite === idx && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 border border-black rounded-full flex items-center justify-center text-white text-[8px]">
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
            className={`h-10 border-2 border-black rounded-lg flex items-center justify-center bg-gray-50 transition-all cursor-pointer relative overflow-hidden ${
              selectedSprite === defaultSprites.length ? 'bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105' : 'hover:bg-amber-100'
            }`}
            title={t('auth.uploadCustomSprite')}
          >
            {customSprite ? (
              <img src={customSprite} alt={t('auth.uploadCustomSprite')} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-black">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
            )}
            
            {selectedSprite === defaultSprites.length && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 border border-black rounded-full flex items-center justify-center text-white text-[8px] z-10">
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
        <label className="block text-xs font-black text-black mb-0.5 uppercase flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> {t('auth.selectRole')}
        </label>
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{t(r.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Trainer Name */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">{t('auth.trainerName')}</label>
        <div className="relative">
          <UserIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="text" 
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            placeholder={t('auth.trainerNamePh')} 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">{t('auth.trainerEmail')}</label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="email" 
            value={trainerEmail}
            onChange={(e) => setTrainerEmail(e.target.value)}
            placeholder={t('auth.trainerEmailPh')} 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Secret Key Password */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">{t('auth.secretKey')}</label>
        <div className="relative">
          <Key className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Confirm Secret Key Password */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">{t('auth.confirmSecret')}</label>
        <div className="relative">
          <Key className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••" 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-black py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase mt-2 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('auth.registering') : t('auth.startAdventure')}
      </button>

      <div className="text-center pt-0.5">
        <button 
          type="button" 
          onClick={() => setAuthMode('login')} 
          className="text-xs font-bold underline text-black cursor-pointer"
        >
          {t('auth.alreadyRegistered')}
        </button>
      </div>
    </form>
  );
}
