import { useState, useRef } from 'react';
import { Plus, Key, Mail, User as UserIcon, AlertCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function RegisterForm() {
  const { login, setAuthMode, setUserProfile } = useApp();
  
  const [selectedSprite, setSelectedSprite] = useState(0);
  const [customSprite, setCustomSprite] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Cartographer');
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const defaultSprites = ['🏃', '🧙', '🤠', '🥷'];
  const roles = ['Novice Traveler', 'Cartographer', 'Gym Leader', 'Game Master'];

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

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 4) {
      setErrorMsg('Secret Key must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Secret Key and Confirm Secret Key do not match!');
      return;
    }

    const chosenAvatar = selectedSprite < defaultSprites.length 
      ? defaultSprites[selectedSprite] 
      : (customSprite || '🏃');

    setUserProfile((prev) => ({
      ...prev,
      name: trainerName.trim() || 'Ash K.',
      email: trainerEmail.trim() || 'ash@pallet.town',
      avatar: chosenAvatar,
      role: selectedRole
    }));

    login(e);
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-2.5 font-mono">
      <p className="text-[10px] text-gray-600 leading-tight">
        Create your trainer profile, select your role, set your Secret Key password, and pick your sprite avatar.
      </p>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Choose / Upload Your Sprite */}
      <div>
        <label className="block text-xs font-black text-black mb-1 uppercase flex justify-between items-center">
          <span>Choose Sprite</span>
          <span className="text-[9px] text-gray-500 font-sans">Click + to upload</span>
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
              title={`Preset Sprite ${idx + 1}`}
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
            title="Upload Custom Sprite Image"
          >
            {customSprite ? (
              <img src={customSprite} alt="Custom Sprite" className="w-full h-full object-cover" />
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
          <Shield className="w-3.5 h-3.5" /> Select Trainer Role
        </label>
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Trainer Name */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">Trainer Name</label>
        <div className="relative">
          <UserIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="text" 
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            placeholder="e.g. Ash K." 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">Trainer Email</label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-600" />
          <input 
            type="email" 
            value={trainerEmail}
            onChange={(e) => setTrainerEmail(e.target.value)}
            placeholder="trainer@pallettown.com" 
            required
            className="w-full pl-7 pr-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-white focus:outline-none" 
          />
        </div>
      </div>

      {/* Secret Key Password */}
      <div>
        <label className="block text-xs font-black text-black mb-0.5 uppercase">Secret Key (Password)</label>
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
        <label className="block text-xs font-black text-black mb-0.5 uppercase">Confirm Secret Key</label>
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
        className="w-full bg-[#cc0000] text-white font-black py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase mt-2 cursor-pointer hover:bg-red-700 transition-colors"
      >
        START ADVENTURE
      </button>

      <div className="text-center pt-0.5">
        <button 
          type="button" 
          onClick={() => setAuthMode('login')} 
          className="text-xs font-bold underline text-black cursor-pointer"
        >
          Already registered? Log In →
        </button>
      </div>
    </form>
  );
}
