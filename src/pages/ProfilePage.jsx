

import { useRef, useState } from 'react';
import { Map, LogOut, Check, Sparkles, User as UserIcon, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { userProfile, setUserProfile, isLoggedIn, isAdminLoggedIn, logout, communityMaps, setAuthMode, navigateTo } = useApp();
  const [selectedRole, setSelectedRole] = useState(userProfile?.role || 'Novice Traveler');
  const [roleUpdatedMsg, setRoleUpdatedMsg] = useState(false);
  const fileInputRef = useRef(null);

  const availableRoles = [
    { name: 'Novice Traveler', badge: '🟢', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Cartographer',   badge: '📜', color: 'bg-amber-100 text-amber-900' },
  ];

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    setUserProfile((prev) => ({ ...prev, role: newRole }));
    setRoleUpdatedMsg(true);
    setTimeout(() => setRoleUpdatedMsg(false), 3000);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextAvatar = reader.result;
      setUserProfile((prev) => ({ ...prev, avatar: nextAvatar }));
      try {
        localStorage.setItem('pocket_odyssey_profile_avatar', JSON.stringify(nextAvatar));
      } catch (error) {
        console.warn('Unable to save avatar to localStorage', error);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Count maps published by this user
  const myPublishedMaps = communityMaps?.filter(
    (m) => m.discoveredBy === userProfile?.name
  ) ?? [];

  if (!isLoggedIn || !userProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-mono">
        <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="w-16 h-16 bg-red-100 border-4 border-black rounded-full mx-auto flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-black uppercase">Trainer Profile Locked</h2>
          <p className="text-xs text-gray-600 font-sans">
            Please log into your Trainer Account to view your profile.
          </p>
          <button
            onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
            className="w-full bg-[#cc0000] text-white font-black py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer hover:bg-red-700"
          >
            Log In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 font-mono">

      {/* Profile Card */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Avatar Column */}
        <div className="flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black pb-6 md:pb-0 md:pr-6">
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-24 h-24 bg-amber-400 border-4 border-black rounded-full flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-transform hover:scale-105"
              title="Change profile image"
            >
              {userProfile.avatar && userProfile.avatar.startsWith('data:image') ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userProfile.avatar || '🏃'
              )}
              <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <h2 className="text-xl font-black">{userProfile.name}</h2>
          <p className="text-xs text-gray-500 font-bold mb-2">{userProfile.email}</p>

          {/* Active Trainer Role Badge */}
          <span className="bg-[#cc0000] text-white text-[10px] font-black px-3 py-1 border-2 border-black rounded-full uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-3 h-3 fill-white" /> {userProfile.role || 'Novice Traveler'}
          </span>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-5">

          {/* Maps Created Stat */}
          <div>
            <h3 className="text-base font-black uppercase mb-3 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-600" /> My Created Maps
            </h3>
            <div className="bg-indigo-50 border-2 border-black rounded-xl p-4 flex items-center gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black text-indigo-700">{myPublishedMaps.length}</div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">Maps Published</div>
                <div className="text-[11px] text-gray-600 font-sans mt-0.5">
                  {myPublishedMaps.length === 0
                    ? 'You haven\'t published any maps yet.'
                    : `You've shared ${myPublishedMaps.length} map${myPublishedMaps.length > 1 ? 's' : ''} with the community!`}
                </div>
              </div>
            </div>

            {/* List of published maps */}
            {myPublishedMaps.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {myPublishedMaps.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3 py-1.5 text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    🗺️ <span>{m.title}</span>
                    <span className="ml-auto text-[10px] text-gray-400 font-normal">{m.rarity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Change Trainer Role */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" /> Change Trainer Role
              </h4>
              {roleUpdatedMsg && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Role Updated!
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => handleRoleChange(r.name)}
                  className={`p-2 border-2 border-black rounded-lg text-left text-[10px] font-black uppercase transition-all cursor-pointer flex flex-col justify-between h-14 ${
                    selectedRole === r.name
                      ? 'bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs">{r.badge}</span>
                  <span className="truncate">{r.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Command Center (Only for Admins) & Logout */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isAdminLoggedIn && (
              <button
                onClick={() => navigateTo('admin')}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black px-4 py-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs flex items-center gap-2 cursor-pointer uppercase"
              >
                🛡️ Open Command Center (Admin)
              </button>
            )}

            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-red-50 text-red-600 font-bold px-4 py-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Log Out Trainer Session
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
