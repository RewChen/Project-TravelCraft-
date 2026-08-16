import React, { useState } from 'react';
import { Mail, Key, UserPlus, Play, ChevronRight } from 'lucide-react';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedSprite, setSelectedSprite] = useState(0);
  
  const [loginData, setLoginData] = useState({
    email: 'ash@pallet.town',
    password: '••••••••'
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    region: 'Kanto (North America)',
    email: '',
    password: ''
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert(`[SYSTEM BOOT] Logging in as ${loginData.email}...`);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    alert(`[SYSTEM BOOT] Welcome Trainer ${registerData.name || 'Newbie'}! Adventure Awaits.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-sm bg-[#d8d8d8] border-4 border-black rounded-[36px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] relative">
        
        {/* Screen Bezel */}
        <div className="bg-[#111111] p-3 rounded-t-2xl rounded-b-xl border-4 border-black mb-5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
          <div className="bg-white border-4 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Header Banner */}
            <div className="bg-[#cc0000] text-white py-2.5 px-3 border-b-4 border-black text-center font-black tracking-wider text-sm sm:text-base uppercase flex items-center justify-center gap-2">
              {!isLogin && <span className="text-xs">🎮</span>}
              <span>{isLogin ? 'POCKET ODYSSEY' : 'TRAINER REGISTRATION'}</span>
            </div>

            {/* Form Area */}
            <div className="p-4 sm:p-5">
              {isLogin ? (
                <div className="space-y-4">
                  <div className="text-center text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                    System Boot... OK.
                  </div>
                  
                  <h2 className="text-center text-xl font-extrabold text-black tracking-tight">
                    Trainer Login
                  </h2>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Trainer Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-gray-700" />
                        </div>
                        <input
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Secret Key</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                          <Key className="w-4 h-4 text-gray-700" />
                        </div>
                        <input
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full pl-9 pr-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="text-left pt-0.5">
                      <button 
                        type="button" 
                        onClick={() => alert('Reset link transmitted to your PokéDex!')}
                        className="text-[11px] font-bold underline text-gray-800 hover:text-black active:text-red-600"
                      >
                        Forgot Pass?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 bg-[#cc0000] hover:bg-[#b30000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all"
                    >
                      <span>Start Adventure</span>
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-600 leading-normal font-medium">
                    Welcome to Pocket Odyssey! Create your trainer profile to begin tracking your real-world quests and capturing memories.
                  </p>

                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Choose Your Sprite</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 1, 2].map((idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSprite(idx)}
                            className={`h-12 border-2 border-black rounded flex items-center justify-center bg-gray-100 transition-all ${
                              selectedSprite === idx 
                                ? 'bg-amber-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105' 
                                : 'hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-lg">
                              {idx === 0 ? '🚶' : idx === 1 ? '🏃' : '🚴'}
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => alert('Custom sprite upload feature unlocked at Lv. 10!')}
                          className="h-12 border-2 border-black rounded flex items-center justify-center bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-0.5">Trainer Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ash K."
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="w-full px-2.5 py-1 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-0.5">Starting Region</label>
                      <select
                        value={registerData.region}
                        onChange={(e) => setRegisterData({ ...registerData, region: e.target.value })}
                        className="w-full px-2 py-1 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option>Kanto (North America)</option>
                        <option>Johto (Asia)</option>
                        <option>Hoenn (Europe)</option>
                        <option>Sinnoh (Oceania)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-0.5">Pokédex Link (Email)</label>
                      <input
                        type="email"
                        placeholder="trainer@pallettown.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="w-full px-2.5 py-1 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-0.5">Secret Code (Password)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full px-2.5 py-1 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#cc0000] hover:bg-[#b30000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider text-xs mt-3 transition-all"
                    >
                      START ADVENTURE
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Boy Controls */}
        <div className="flex items-center justify-between px-3 pt-1 pb-2">
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="absolute top-0 left-5 w-6 h-16 bg-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"></div>
            <div className="absolute top-5 left-0 w-16 h-6 bg-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"></div>
            <div className="absolute top-5 left-5 w-6 h-6 bg-[#222222] rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 border border-gray-600 rounded-full"></div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-10 h-10 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Toggle Login / Register"
            >
              <UserPlus className="w-5 h-5 text-black" />
            </button>
            <span className="text-[9px] font-black text-gray-700 mt-1 uppercase">SELECT</span>
          </div>
        </div>

        {/* Footer Navigation Link */}
        <div className="text-center mt-3 pt-2 border-t border-gray-300">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-black underline hover:text-red-700 transition-colors inline-flex items-center gap-1"
          >
            {isLogin ? (
              <span>New Trainer? Register</span>
            ) : (
              <>
                <span>Already a registered trainer? Log In</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}