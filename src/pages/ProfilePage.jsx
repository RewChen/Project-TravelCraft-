import { useState } from 'react';
import { Shield, Award, Coins, MapPin, LogOut, Check, Sparkles, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { userProfile, setUserProfile, isLoggedIn, logout, setAuthMode, navigateTo } = useApp();
  const [selectedRole, setSelectedRole] = useState(userProfile?.role || 'Cartographer');
  const [roleUpdatedMsg, setRoleUpdatedMsg] = useState(false);

  const availableRoles = [
    { name: 'Novice Traveler', badge: '🟢', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Cartographer', badge: '📜', color: 'bg-amber-100 text-amber-900' },
    { name: 'Gym Leader', badge: '🎖️', color: 'bg-indigo-100 text-indigo-900' },
    { name: 'Game Master', badge: '👑', color: 'bg-purple-100 text-purple-900' }
  ];

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    setUserProfile((prev) => ({ ...prev, role: newRole }));
    setRoleUpdatedMsg(true);
    setTimeout(() => setRoleUpdatedMsg(false), 3000);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-mono">
        <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="w-16 h-16 bg-red-100 border-4 border-black rounded-full mx-auto flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-black uppercase">Trainer Profile Locked</h2>
          <p className="text-xs text-gray-600 font-sans">
            Please log into your Trainer Account to view your role, badges, and travel statistics.
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
        <div className="flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black pb-6 md:pb-0 md:pr-6">
          <div className="w-24 h-24 bg-amber-400 border-4 border-black rounded-full flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3 overflow-hidden">
            {userProfile.avatar && userProfile.avatar.startsWith('data:image') ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userProfile.avatar || '🏃'
            )}
          </div>
          <h2 className="text-xl font-black">{userProfile.name}</h2>
          <p className="text-xs text-gray-500 font-bold mb-2">{userProfile.email}</p>
          
          {/* Active Trainer Role Badge */}
          <span className="bg-[#cc0000] text-white text-[10px] font-black px-3 py-1 border-2 border-black rounded-full uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-3 h-3 fill-white" /> {userProfile.role || 'Cartographer'}
          </span>
        </div>

        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-black uppercase mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Trainer Stats & Resources
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50 border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Coins className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <div className="text-[10px] font-bold text-gray-500 uppercase">Coins</div>
                <div className="text-sm font-black">{userProfile.coins}</div>
              </div>
              <div className="bg-emerald-50 border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <MapPin className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <div className="text-[10px] font-bold text-gray-500 uppercase">Visited</div>
                <div className="text-sm font-black">{userProfile.visitedCount} POIs</div>
              </div>
              <div className="bg-sky-50 border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Award className="w-5 h-5 mx-auto text-sky-600 mb-1" />
                <div className="text-[10px] font-bold text-gray-500 uppercase">Badges</div>
                <div className="text-sm font-black">{userProfile.badges.length}</div>
              </div>
            </div>
          </div>

          {/* Trainer Role Selector */}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => handleRoleChange(r.name)}
                  className={`p-2 border-2 border-black rounded-lg text-left text-[10px] font-black uppercase transition-all cursor-pointer flex flex-col justify-between h-14 ${
                    selectedRole === r.name ? 'bg-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs">{r.badge}</span>
                  <span className="truncate">{r.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unlocked Badges */}
          <div>
            <h4 className="text-xs font-black uppercase mb-2">Unlocked Badges</h4>
            <div className="flex gap-2">
              {userProfile.badges.map((badge, i) => (
                <span key={i} className="bg-white border-2 border-black px-3 py-1 rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  🎖️ {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2">
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
