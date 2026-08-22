import React, { useState } from 'react';
import { 
  Mail, Key, UserPlus, Play, ChevronRight, Bell, User, MapPin, 
  Search, Footprints, ArrowUp, Compass, Map, LogOut, Settings,
  X, Heart, Share2, BookOpen, BarChart2, Camera, Calendar, ImageIcon, Check
} from 'lucide-react';

export default function App() {
  // Navigation State: 'home', 'map', 'details', 'auth'
  const [currentPage, setCurrentPage] = useState('home');
  
  // Auth Sub-State: 'login', 'register', 'forgot', 'restored'
  const [authMode, setAuthMode] = useState('login');
  const [selectedSprite, setSelectedSprite] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  // User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Ash K.',
    email: 'ash@pallet.town',
    coins: 1245,
    level: 1
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode('login');
    setCurrentPage('auth');
  };

  // ==========================================
  // SHARED HEADER COMPONENT
  // ==========================================
  const Header = () => (
    <header className="bg-white border-4 border-black rounded-2xl p-3 px-5 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between sticky top-4 z-50">
      <div 
        onClick={() => setCurrentPage('home')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 bg-[#cc0000] rounded-full border-2 border-black flex items-center justify-center">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-lg tracking-wider text-[#cc0000] uppercase hidden sm:block">
          POCKET ODYSSEY
        </span>
      </div>

      <nav className="flex items-center gap-4 sm:gap-6 text-sm font-bold">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`${currentPage === 'home' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          [Home]
        </button>
        <button 
          onClick={() => setCurrentPage('map')}
          className={`${currentPage === 'map' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          [World Map]
        </button>
        <button className="text-gray-700 hover:text-black border-2 border-transparent px-2 hidden md:block">[My Maps]</button>
        <button className="text-gray-700 hover:text-black border-2 border-transparent px-2 hidden md:block">[Profile]</button>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex relative items-center">
          <Search className="w-4 h-4 absolute left-2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search region..." 
            className="pl-8 pr-3 py-1.5 border-2 border-black rounded text-xs font-bold w-40 focus:outline-none focus:bg-amber-50"
          />
        </div>
        <button className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Bell className="w-4 h-4 text-black" />
        </button>
        <button className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center bg-gray-100 hover:bg-amber-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden sm:flex">
          <Settings className="w-4 h-4 text-black" />
        </button>
        {isLoggedIn ? (
          <div onClick={handleLogout} className="w-9 h-9 bg-amber-400 border-2 border-black rounded-lg flex items-center justify-center cursor-pointer hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" title="Click to Logout">
            <span className="text-sm font-black">🚶</span>
          </div>
        ) : (
          <button onClick={() => { setAuthMode('login'); setCurrentPage('auth'); }} className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center bg-[#cc0000] text-white hover:bg-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-[#e8ecef] text-gray-900 font-mono antialiased relative selection:bg-red-200">
      
      {/* Show Header unless on Auth page */}
      {currentPage !== 'auth' && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <Header />
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MAIN LANDING PAGE VIEW                                */}
      {/* ========================================================= */}
      {currentPage === 'home' && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <section className="bg-white border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 md:p-8 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-400 border-2 border-black px-3 py-1 rounded-full text-[11px] font-black uppercase mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span>★</span> NEW QUEST AVAILABLE
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight mb-4 tracking-tight">
                  Gotta <span className="text-[#cc0000]">Travel</span> 'Em All.
                </h1>
                <p className="text-gray-600 text-xs md:text-sm font-sans leading-relaxed mb-8 font-medium">
                  Turn your daily commute into an epic RPG adventure. Discover hidden spots, level up your traveler profile, and conquer the real-world map.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setCurrentPage('map')}
                  className="w-full sm:w-auto bg-[#cc0000] hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 text-sm uppercase tracking-wider transition-all"
                >
                  <span>Start Your Adventure</span>
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
            
            <div className="bg-[#a2d2ff] relative min-h-[260px] flex flex-col justify-between p-4 bg-[radial-gradient(#4895ef_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="self-end bg-amber-100 border-2 border-black px-2.5 py-1 rounded-md text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                🪙 Coin: {userProfile.coins}
              </div>
              <div className="my-auto bg-[#81c784] border-4 border-black rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="text-[10px] font-bold text-emerald-950 uppercase mb-2 flex items-center justify-between">
                  <span>WORLD MAP OVERVIEW</span>
                  <span className="animate-pulse text-red-600">● LIVE</span>
                </div>
                <div className="h-32 bg-[#aed581] border-2 border-black rounded relative flex items-center justify-around p-2">
                  <div className="absolute inset-x-8 top-1/2 h-1 bg-amber-700 border-t border-b border-black"></div>
                  <div className="relative z-10 text-center cursor-pointer">
                    <div className="w-8 h-8 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏡</div>
                  </div>
                  <div className="relative z-10 text-center cursor-pointer">
                    <div className="w-8 h-8 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🌲</div>
                  </div>
                  <div onClick={() => setCurrentPage('details')} className="relative z-10 text-center cursor-pointer animate-bounce">
                    <div className="w-8 h-8 bg-sky-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏰</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-200 border-4 border-black rounded-2xl p-6 md:p-8 mb-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-center text-2xl font-black uppercase tracking-wider mb-8">THE CORE GAMEPLAY LOOP</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-1 bg-black -translate-y-1/2 z-0"></div>
              {[
                { step: 1, color: 'bg-red-600', icon: Search, title: 'Find', desc: 'Locate nearby POIs on your map.' },
                { step: 2, color: 'bg-amber-400', icon: Footprints, title: 'Visit', desc: 'Travel to the location to check-in.' },
                { step: 3, color: 'bg-blue-600', icon: ArrowUp, title: 'Level Up', desc: 'Earn XP, badges, and unlock areas.' }
              ].map((item) => (
                <div key={item.step} className="bg-white border-4 border-black rounded-xl p-5 relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                  <div className={`absolute -top-3 left-4 ${item.color} ${item.step === 2 ? 'text-black' : 'text-white'} font-black text-xs px-2.5 py-0.5 border-2 border-black rounded`}>
                    {item.step}
                  </div>
                  <div className="w-12 h-12 border-2 border-black rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.step === 1 ? 'text-red-600' : item.step === 2 ? 'text-amber-600' : 'text-blue-600'}`} />
                  </div>
                  <h4 className="font-extrabold text-base mb-1">{item.title}</h4>
                  <p className="text-[11px] text-gray-600 font-sans font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. WORLD MAP VIEW                                          */}
      {/* ========================================================= */}
      {currentPage === 'map' && (
        <div className="max-w-6xl mx-auto px-4 pb-12 h-[80vh]">
          <div className="w-full h-full border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative bg-[#e2f0d9]">
            <div className="absolute top-1/3 left-0 w-full h-2 bg-blue-200/50"></div>
            <div className="absolute left-1/3 top-0 h-full w-2 bg-gray-300/50"></div>
            
            <div className="absolute top-4 left-4 w-56 bg-white border-4 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
              <div className="bg-[#cc0000] text-white p-2 border-b-4 border-black font-black text-sm uppercase flex justify-between">
                <span>Key Items</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="p-3 space-y-3 text-xs font-bold">
                <label className="flex items-center justify-between cursor-pointer"><span className="text-blue-600">⛩️ Temples</span><input type="checkbox" defaultChecked className="w-4 h-4 border-2 border-black" /></label>
                <label className="flex items-center justify-between cursor-pointer"><span className="text-amber-700">☕ Cafes</span><input type="checkbox" defaultChecked className="w-4 h-4 border-2 border-black" /></label>
              </div>
            </div>

            <div className="absolute top-1/3 left-1/3 z-10">
              <div onClick={() => setShowPopup(true)} className="w-10 h-10 bg-indigo-50 border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-110 animate-bounce">
                <span className="text-lg">⛩️</span>
              </div>
              {showPopup && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 p-4">
                  <div className="flex justify-between items-center mb-2 border-b pb-1">
                    <h4 className="font-black text-sm uppercase">Ancient Shrine</h4>
                    <button onClick={() => setShowPopup(false)} className="text-red-600 font-bold"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 font-sans">A forgotten shrine hidden deep within the bamboo forest.</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setCurrentPage('details')} className="bg-[#cc0000] text-white text-xs px-3 py-1 border-2 border-black font-bold uppercase">Go to Details</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LOCATION DETAILS VIEW                                   */}
      {/* ========================================================= */}
      {currentPage === 'details' && (
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">
          <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="h-48 bg-slate-900 flex items-center justify-center text-white/40 font-bold">
              <ImageIcon className="w-12 h-12 mr-2" /> Eiffel Tower Preview
            </div>
            <div className="bg-[#cc0000] text-white p-5 border-t-4 border-black flex justify-between items-center">
              <h1 className="text-3xl font-black">Eiffel Tower</h1>
              <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black">★ Landmark</span>
            </div>
          </div>
          <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black mb-3">Lore & Data</h3>
            <p className="text-sm text-gray-700 font-sans mb-4">Constructed from 1887 to 1889 as the entrance to the 1889 World's Fair...</p>
            <button onClick={() => setCurrentPage('home')} className="bg-black text-white text-xs font-bold px-4 py-2 border-2 border-black">← Back Home</button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. GAME BOY AUTH VIEW (4 Screen Modes)                    */}
      {/* ========================================================= */}
      {currentPage === 'auth' && (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-mono">
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-4 text-white text-xs font-bold bg-gray-800 hover:bg-gray-700 px-4 py-2 border-2 border-white rounded-lg flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          >
            ← Back to Main Page
          </button>
          
          <div className="w-full max-w-sm bg-[#d8d8d8] border-4 border-black rounded-[36px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] relative">
            <div className="bg-[#111111] p-3 rounded-t-2xl rounded-b-xl border-4 border-black mb-5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
              <div className="bg-white border-4 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                
                {/* Red Header Banner */}
                <div className="bg-[#cc0000] text-white py-2.5 px-3 border-b-4 border-black text-center font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2">
                  <span>{authMode === 'login' && 'POCKET ODYSSEY'}</span>
                  <span>{authMode === 'register' && 'TRAINER REGISTRATION'}</span>
                  <span>{authMode === 'forgot' && 'SYSTEM RECOVERY'}</span>
                  <span>{authMode === 'restored' && 'SYSTEM RESTORED'}</span>
                </div>
                
                <div className="p-4 sm:p-5">
                  {/* --- SCREEN 1: LOGIN --- */}
                  {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-3">
                      <div className="text-center text-[10px] text-gray-500 font-bold uppercase">System Boot... OK.</div>
                      <h2 className="text-center text-lg font-extrabold text-black mb-2">Trainer Login</h2>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">Trainer Email</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
                          <input type="email" defaultValue="ash@pallet.town" className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">Secret Key</label>
                        <div className="relative">
                          <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
                          <input type="password" defaultValue="••••••••" className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" required />
                        </div>
                      </div>
                      <div className="text-left">
                        <button type="button" onClick={() => setAuthMode('forgot')} className="text-[11px] font-bold underline text-gray-800 hover:text-black">
                          Forgot Pass?
                        </button>
                      </div>
                      <button type="submit" className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs uppercase flex items-center justify-center gap-2">
                        Start Adventure <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                      <div className="text-center pt-2">
                        <button type="button" onClick={() => setAuthMode('register')} className="text-xs font-bold underline text-black">
                          New Trainer? Register
                        </button>
                      </div>
                    </form>
                  )}

                  {/* --- SCREEN 2: REGISTER --- */}
                  {authMode === 'register' && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-600 leading-tight">Welcome to Pocket Odyssey! Create your trainer profile.</p>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">Choose Your Sprite</label>
                        <div className="grid grid-cols-4 gap-1">
                          {[0, 1, 2].map((idx) => (
                            <button key={idx} type="button" onClick={() => setSelectedSprite(idx)} className={`h-10 border-2 border-black rounded flex items-center justify-center bg-gray-100 ${selectedSprite === idx ? 'bg-amber-400' : ''}`}>🏃</button>
                          ))}
                          <div className="h-10 border-2 border-black rounded flex items-center justify-center bg-gray-100 font-bold">+</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-0.5">Trainer Name</label>
                        <input type="text" placeholder="e.g. Ash K." className="w-full px-2 py-1 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-0.5">Pokédex Link (Email)</label>
                        <input type="email" placeholder="trainer@pallettown.com" className="w-full px-2 py-1 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                      </div>
                      <button onClick={handleLoginSubmit} className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase mt-1">
                        START ADVENTURE
                      </button>
                      <div className="text-center pt-1">
                        <button type="button" onClick={() => setAuthMode('login')} className="text-xs font-bold underline text-black">
                          Already registered? Log In →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- SCREEN 3: FORGOT PASSWORD (SYSTEM RECOVERY) --- */}
                  {authMode === 'forgot' && (
                    <div className="space-y-4 py-2">
                      <div className="text-center">
                        <div className="inline-block text-red-600 font-bold text-lg mb-1">🔑 SYSTEM RECOVERY</div>
                        <p className="text-[11px] text-gray-600 font-sans">Enter your Trainer Email to receive a Secret Key reset link.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">Trainer Email</label>
                        <input type="email" defaultValue="ash@pallet.town" className="w-full px-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                      </div>
                      <button onClick={() => setAuthMode('restored')} className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2">
                        SEND RESET LINK <Play className="w-3 h-3 fill-white" />
                      </button>
                      <div className="text-center space-y-1 pt-2">
                        <button onClick={() => setAuthMode('login')} className="block w-full text-xs font-bold underline text-black">← Back to Login</button>
                        <button onClick={() => setAuthMode('register')} className="block w-full text-xs font-bold underline text-black">← New Trainer? Register</button>
                      </div>
                    </div>
                  )}

                  {/* --- SCREEN 4: SYSTEM RESTORED --- */}
                  {authMode === 'restored' && (
                    <div className="space-y-4 text-center py-2">
                      <div className="w-12 h-12 bg-red-600 border-2 border-black rounded-lg mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Check className="w-6 h-6 text-white stroke-[3]" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-wider">SYSTEM RESTORED</h3>
                      <p className="text-[10px] text-gray-600 font-sans leading-tight">
                        Your Trainer Secret Key has been successfully updated. You can now log back into the system.
                      </p>
                      <button onClick={() => setAuthMode('login')} className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase">
                        BACK TO LOGIN
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Game Boy Buttons */}
            <div className="flex items-center justify-between px-3 pt-1 pb-2">
              <div className="relative w-14 h-14">
                <div className="absolute top-0 left-4 w-5 h-14 bg-black rounded-sm"></div>
                <div className="absolute top-4 left-0 w-14 h-5 bg-black rounded-sm"></div>
                <div className="absolute top-4 left-4 w-5 h-5 bg-[#222222] rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
                <div className="w-6 h-6 bg-amber-400 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
              </div>
            </div>

          </div>

          <footer className="text-center text-xs text-white/60 mt-6 space-y-1 font-sans">
            <div className="flex justify-center gap-4 font-bold underline">
              <button>Legal</button>
              <button>Support</button>
              <button>Trainer Club</button>
            </div>
            <p className="text-[10px]">© 2026 Pocket Odyssey - Gotta Explore 'Em All</p>
          </footer>
        </div>
      )}

    </div>
  );
}