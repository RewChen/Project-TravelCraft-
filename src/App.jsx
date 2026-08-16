import React, { useState } from 'react';
import { 
  Mail, Key, UserPlus, Play, ChevronRight, Bell, User, MapPin, 
  Search, Footprints, ArrowUp, Compass, Map, LogOut, Settings 
} from 'lucide-react';

export default function App() {
  // Navigation State: 'home' = หน้า Main Landing Page, 'auth' = หน้า Game Boy Login
  const [currentPage, setCurrentPage] = useState('home');
  const [isLogin, setIsLogin] = useState(true);
  const [selectedSprite, setSelectedSprite] = useState(0);

  // User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Ash K.',
    email: 'ash@pallet.town',
    coins: 1245,
    level: 1
  });

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: 'ash@pallet.town',
    password: '••••••••'
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    name: '',
    region: 'Kanto (North America)',
    email: '',
    password: ''
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setUserProfile((prev) => ({
      ...prev,
      email: loginData.email,
      name: loginData.email.split('@')[0]
    }));
    setCurrentPage('home');
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setUserProfile((prev) => ({
      ...prev,
      name: registerData.name || 'New Trainer',
      email: registerData.email
    }));
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('auth');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-[#e8ecef] text-gray-900 font-mono antialiased">
      {/* ========================================================= */}
      {/* 1. MAIN LANDING PAGE VIEW                                */}
      {/* ========================================================= */}
      {currentPage === 'home' && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          
          {/* --- TOP NAVBAR --- */}
          <header className="bg-white border-4 border-black rounded-2xl p-3 px-5 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            {/* Logo */}
            <div 
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 bg-[#cc0000] rounded-full border-2 border-black flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-wider text-[#cc0000] uppercase">
                POCKET ODYSSEY
              </span>
            </div>

            {/* Nav Menu Items */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
              <button className="text-red-600 underline underline-offset-4 decoration-2">Home</button>
              <button className="text-gray-700 hover:text-black border-2 border-dashed border-gray-400 px-2 py-0.5 rounded">World Map</button>
              <button className="text-gray-700 hover:text-black border-2 border-dashed border-gray-400 px-2 py-0.5 rounded">My Maps</button>
            </nav>

            {/* Profile & Controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert("Notification: New Quest Available in Kanto Region!")}
                className="w-9 h-9 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 hover:bg-amber-100 active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Bell className="w-4 h-4 text-black" />
              </button>

              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <div 
                    onClick={handleLogout}
                    title="Click to Logout"
                    className="w-9 h-9 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="text-sm font-black">🏃</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setCurrentPage('auth');
                  }}
                  className="bg-[#cc0000] text-white px-3 py-1.5 border-2 border-black rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 active:translate-y-0.5 active:shadow-none"
                >
                  Trainer Login
                </button>
              )}
            </div>
          </header>

          {/* --- HERO BANNER SECTION --- */}
          <section className="bg-white border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-2">
            {/* Left Content Column */}
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
                  onClick={() => setCurrentPage('auth')}
                  className="w-full sm:w-auto bg-[#cc0000] hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 text-sm uppercase tracking-wider transition-all"
                >
                  <span>Start Your Adventure</span>
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>

            {/* Right Map Image Preview Column */}
            <div className="bg-[#a2d2ff] relative min-h-[260px] flex flex-col justify-between p-4 bg-[radial-gradient(#4895ef_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="self-end bg-amber-100 border-2 border-black px-2.5 py-1 rounded-md text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🪙 Coin: {userProfile.coins}
              </div>

              {/* Pixel Art Map Graphic */}
              <div className="my-auto bg-[#81c784] border-4 border-black rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="text-[10px] font-bold text-emerald-950 uppercase mb-2 flex items-center justify-between">
                  <span>WORLD MAP OVERVIEW</span>
                  <span className="animate-pulse text-red-600">● LIVE</span>
                </div>
                
                <div className="h-32 bg-[#aed581] border-2 border-black rounded relative flex items-center justify-around p-2">
                  {/* Route Paths */}
                  <div className="absolute inset-x-8 top-1/2 h-1 bg-amber-700 border-t border-b border-black"></div>
                  
                  {/* Map Nodes */}
                  <div className="relative z-10 text-center">
                    <div className="w-8 h-8 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏡</div>
                    <span className="text-[9px] font-black bg-white px-1 border border-black rounded mt-1 inline-block">Oakdale</span>
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="w-8 h-8 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🌲</div>
                    <span className="text-[9px] font-black bg-white px-1 border border-black rounded mt-1 inline-block">Forest Path</span>
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="w-8 h-8 bg-sky-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏰</div>
                    <span className="text-[9px] font-black bg-white px-1 border border-black rounded mt-1 inline-block">The Citadel</span>
                  </div>
                </div>
              </div>

              {/* Map Bottom Tabs */}
              <div className="grid grid-cols-5 gap-1 pt-2 border-t-2 border-black bg-white rounded-lg p-1 text-[10px] font-extrabold text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-sky-200 border border-black rounded py-1">Map</div>
                <div className="bg-gray-100 border border-black rounded py-1">Inventory</div>
                <div className="bg-gray-100 border border-black rounded py-1">Quests</div>
                <div className="bg-gray-100 border border-black rounded py-1">Party</div>
                <div className="bg-gray-100 border border-black rounded py-1">Settings</div>
              </div>
            </div>
          </section>

          {/* --- SECTION TITLE SEPARATOR --- */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 bg-black flex-1"></div>
            <h2 className="text-xl font-black uppercase tracking-wider text-black">
              YOUR ODYSSEY AWAITS
            </h2>
            <div className="h-1 bg-black flex-1"></div>
          </div>

          {/* --- CARDS GRID SECTION --- */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Interactive World Map */}
            <div className="md:col-span-2 bg-white border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-500 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <span className="border-2 border-black rounded-full px-3 py-0.5 text-xs font-black bg-gray-100">
                    Lv. {userProfile.level}
                  </span>
                </div>

                <h3 className="text-xl font-black text-black mb-2">Interactive World Map</h3>
                <p className="text-gray-600 text-xs font-sans leading-relaxed mb-6 font-medium">
                  Explore a constantly evolving map overlay that gamifies your city. Every corner hides a new landmark, local secret, or point of interest.
                </p>
              </div>

              {/* Map Preview Thumbnail */}
              <div className="bg-amber-100 border-2 border-black rounded-xl p-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                  <span>🗺️ REGIONAL MAP</span>
                  <span className="text-xs">Whispering Caves Route</span>
                </div>
                <div className="h-20 bg-[#aed581] border-2 border-black rounded flex items-center justify-around p-2">
                  <span className="text-xs bg-white px-2 py-0.5 border border-black rounded font-bold">Oakdale (Start)</span>
                  <span className="text-xs">➔</span>
                  <span className="text-xs bg-amber-300 px-2 py-0.5 border border-black rounded font-bold">Forest Path</span>
                  <span className="text-xs">➔</span>
                  <span className="text-xs bg-white px-2 py-0.5 border border-black rounded font-bold">Nexus Citadel</span>
                </div>
              </div>
            </div>

            {/* Card 2: Custom Maps (UGC) */}
            <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-amber-400 border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <MapPin className="w-5 h-5 text-black" />
                </div>

                <h3 className="text-xl font-black text-black mb-2">Custom Maps (UGC)</h3>
                <p className="text-gray-600 text-xs font-sans leading-relaxed mb-6 font-medium">
                  Create your own guided routes and share them with the community. Craft the perfect cafe crawl or scenic hike.
                </p>
              </div>

              {/* Community Route Badge */}
              <div className="bg-gray-100 border-2 border-black rounded-xl p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 bg-amber-400 border border-black rounded-lg flex items-center justify-center text-sm">
                  🗺️
                </div>
                <div>
                  <div className="text-xs font-black">"Hidden Gems Route"</div>
                  <div className="text-[10px] text-gray-500 font-bold">by MapMaster99</div>
                </div>
              </div>
            </div>
          </section>

          {/* --- CORE GAMEPLAY LOOP SECTION --- */}
          <section className="bg-gray-200 border-4 border-black rounded-2xl p-6 md:p-8 mb-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="text-right text-gray-400 font-bold text-xl absolute top-4 right-6">🎮</div>

            <h3 className="text-center text-2xl font-black uppercase tracking-wider mb-8">
              THE CORE GAMEPLAY LOOP
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting Line behind steps (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-1 bg-black -translate-y-1/2 z-0"></div>

              {/* Step 1 */}
              <div className="bg-white border-4 border-black rounded-xl p-5 relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <div className="absolute -top-3 left-4 bg-red-600 text-white font-black text-xs px-2.5 py-0.5 border-2 border-black rounded">
                  1
                </div>
                <div className="w-12 h-12 border-2 border-black rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                  <Search className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="font-extrabold text-base mb-1">Find</h4>
                <p className="text-[11px] text-gray-600 font-sans font-medium">
                  Locate nearby points of interest marked on your map.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white border-4 border-black rounded-xl p-5 relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <div className="absolute -top-3 left-4 bg-amber-400 text-black font-black text-xs px-2.5 py-0.5 border-2 border-black rounded">
                  2
                </div>
                <div className="w-12 h-12 border-2 border-black rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-extrabold text-base mb-1">Visit</h4>
                <p className="text-[11px] text-gray-600 font-sans font-medium">
                  Travel to the location in the real world to check-in.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white border-4 border-black rounded-xl p-5 relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <div className="absolute -top-3 left-4 bg-blue-600 text-white font-black text-xs px-2.5 py-0.5 border-2 border-black rounded">
                  3
                </div>
                <div className="w-12 h-12 border-2 border-black rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-extrabold text-base mb-1">Level Up</h4>
                <p className="text-[11px] text-gray-600 font-sans font-medium">
                  Earn XP, badges, and unlock new areas of the map.
                </p>
              </div>
            </div>
          </section>

          {/* --- FOOTER --- */}
          <footer className="text-center pt-8 border-t-2 border-black text-xs space-y-3 pb-8">
            <div className="font-black text-sm uppercase tracking-widest text-black">
              POCKET ODYSSEY
            </div>
            <div className="flex justify-center gap-6 font-bold underline text-gray-700">
              <button onClick={() => alert("Privacy Policy")} className="hover:text-black">Privacy Policy</button>
              <button onClick={() => alert("Terms of Service")} className="hover:text-black">Terms of Service</button>
              <button onClick={() => alert("Support")} className="hover:text-black">Support</button>
            </div>
            <p className="text-gray-500 font-bold text-[11px]">
              © 2026 Pocket Odyssey - Gotta Travel 'Em All
            </p>
          </footer>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. GAME BOY AUTH VIEW (LOGIN / REGISTER)                  */}
      {/* ========================================================= */}
      {currentPage === 'auth' && (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
          
          {/* Top Back to Home Button */}
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-4 text-white text-xs font-bold bg-gray-800 hover:bg-gray-700 px-4 py-2 border-2 border-white rounded-lg flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          >
            ← Back to Main Odyssey Landing
          </button>

          {/* Game Boy Device */}
          <div className="w-full max-w-sm bg-[#d8d8d8] border-4 border-black rounded-[36px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] relative">
            
            {/* Screen Bezel */}
            <div className="bg-[#111111] p-3 rounded-t-2xl rounded-b-xl border-4 border-black mb-5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
              <div className="bg-white border-4 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                
                {/* Screen Header Banner */}
                <div className="bg-[#cc0000] text-white py-2.5 px-3 border-b-4 border-black text-center font-black tracking-wider text-sm uppercase flex items-center justify-center gap-2">
                  {!isLogin && <span className="text-xs">🎮</span>}
                  <span>{isLogin ? 'POCKET ODYSSEY' : 'TRAINER REGISTRATION'}</span>
                </div>

                {/* Form Body */}
                <div className="p-4 sm:p-5">
                  {isLogin ? (
                    /* --- LOGIN FORM --- */
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
                              className="w-full pl-9 pr-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                              className="w-full pl-9 pr-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs font-semibold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              required
                            />
                          </div>
                        </div>

                        <div className="text-left pt-0.5">
                          <button 
                            type="button" 
                            onClick={() => alert('Password reset key transmitted!')}
                            className="text-[11px] font-bold underline text-gray-800 hover:text-black"
                          >
                            Forgot Pass?
                          </button>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-2 bg-[#cc0000] hover:bg-[#b30000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                        >
                          <span>Start Adventure</span>
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* --- REGISTER FORM --- */
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
                                className={`h-11 border-2 border-black rounded flex items-center justify-center bg-gray-100 ${
                                  selectedSprite === idx 
                                    ? 'bg-amber-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'hover:bg-gray-200'
                                }`}
                              >
                                <span className="text-base">
                                  {idx === 0 ? '🚶' : idx === 1 ? '🏃' : '🚴'}
                                </span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => alert('Custom sprite unlocked at Lv. 10!')}
                              className="h-11 border-2 border-black rounded flex items-center justify-center bg-gray-100 text-base font-bold text-gray-700 hover:bg-gray-200"
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
                          className="w-full bg-[#cc0000] hover:bg-[#b30000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wider text-xs mt-2"
                        >
                          START ADVENTURE
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Device Bottom Controls */}
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
                  className="w-10 h-10 bg-amber-400 hover:bg-amber-300 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  title="Toggle Form"
                >
                  <UserPlus className="w-5 h-5 text-black" />
                </button>
                <span className="text-[9px] font-black text-gray-700 mt-1 uppercase">SELECT</span>
              </div>
            </div>

            {/* Bottom Form Toggle Link */}
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
      )}
    </div>
  );
}