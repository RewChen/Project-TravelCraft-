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
  const [showPopup, setShowPopup] = useState(true);

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
          Home
        </button>
        <button 
          onClick={() => setCurrentPage('map')}
          className={`${currentPage === 'map' ? 'text-red-600 underline underline-offset-4 decoration-2 border-dashed border-2 border-red-200 px-2' : 'text-gray-700 hover:text-black border-2 border-transparent px-2'}`}
        >
          World Map
        </button>
        <button className="text-gray-700 hover:text-black border-2 border-transparent px-2 hidden md:block">My Maps</button>
        <button className="text-gray-700 hover:text-black border-2 border-transparent px-2 hidden md:block">Profile</button>
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
      {/* 2. WORLD MAP VIEW (KYOTO)                                  */}
      {/* ========================================================= */}
      {currentPage === 'map' && (
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="w-full h-[75vh] border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative bg-[#e2f0d9]">
            
            {/* Background Grid & City Waterways */}
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-1/3 left-0 w-full h-4 bg-blue-200/60 border-y border-black/20"></div>
            <div className="absolute left-1/3 top-0 h-full w-4 bg-blue-200/60 border-x border-black/20"></div>
            
            {/* Kyoto City Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-25 pointer-events-none select-none">
              <div className="text-8xl font-black tracking-tighter">Kyoto</div>
              <div className="text-4xl font-bold">京都市</div>
            </div>

            {/* --- KEY ITEMS SIDEBAR --- */}
            <div className="absolute top-4 left-4 w-60 bg-white border-4 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
              <div className="bg-[#cc0000] text-white p-2.5 border-b-4 border-black font-black text-xs flex justify-between items-center uppercase tracking-wider">
                <span>KEY ITEMS</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="p-3 space-y-2 text-xs font-bold text-gray-800">
                <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 border-2 border-black rounded-none" />
                    <span className="text-blue-600">⛩️ Temples</span>
                  </div>
                  <span className="text-[10px] text-gray-500">x12</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 border-2 border-black rounded-none" />
                    <span className="text-amber-700">☕ Cafes</span>
                  </div>
                  <span className="text-[10px] text-gray-500">x05</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 border-2 border-black rounded-none" />
                    <span className="text-red-600">⛰️ Viewpoints</span>
                  </div>
                  <span className="text-[10px] text-gray-500">x08</span>
                </label>
              </div>
              <div className="border-t-2 border-black p-2 bg-gray-100 text-[9px] text-center font-bold text-gray-500 uppercase tracking-tighter">
                Select filters to reveal
              </div>
            </div>

            {/* --- MAP PINS --- */}
            
            {/* Player Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-8 h-10 bg-[#cc0000] border-2 border-black rounded-t-full flex items-center justify-center shadow-lg relative z-10">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="w-8 bg-white border border-black text-[8px] font-black text-center py-0.5 mt-[-2px] shadow-sm z-20">YOU</div>
            </div>

            {/* Temple Pin 1 */}
            <div className="absolute top-[38%] left-[42%] z-10">
              <div className="w-9 h-9 bg-blue-600 border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-white text-xs">⛩️</span>
              </div>
            </div>

            {/* Cafe Pin */}
            <div className="absolute bottom-[28%] right-[32%] z-10">
              <div className="w-9 h-9 bg-amber-200 border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-xs">☕</span>
              </div>
            </div>

            {/* Mountain Pin */}
            <div className="absolute top-[18%] right-[22%] z-10">
              <div className="w-9 h-9 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-red-600 font-bold text-xs">▲</span>
              </div>
            </div>

            {/* Ancient Shrine Pin + Popup Modal */}
            <div className="absolute top-[48%] left-[28%] z-20">
              <div 
                onClick={() => setShowPopup(true)}
                className="w-10 h-10 bg-indigo-500 border-4 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-110 transition-transform animate-bounce"
              >
                <span className="text-white text-base">⛩️</span>
              </div>
              
              {showPopup && (
                <div className="absolute top-12 left-0 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 p-4 rounded-sm font-mono">
                  <div className="flex items-start justify-between pb-2 border-b-2 border-black mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-600 border-2 border-black flex items-center justify-center text-white text-sm">⛩️</div>
                      <h4 className="font-black text-sm uppercase tracking-wider">Ancient Shrine</h4>
                    </div>
                    <button 
                      onClick={() => setShowPopup(false)}
                      className="w-5 h-5 bg-red-100 border border-black text-red-600 flex items-center justify-center text-xs font-bold hover:bg-red-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-700 font-sans leading-relaxed mb-4 border border-black p-2 bg-gray-50">
                    A forgotten shrine hidden deep within the pixelated bamboo forest. Legend says a rare item lies within.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-white" /> Add to Favs
                    </button>
                    <button 
                      onClick={() => setCurrentPage('details')}
                      className="bg-[#cc0000] hover:bg-red-700 text-white text-[10px] font-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-1"
                    >
                      Go To Details →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LOCATION DETAILS VIEW (EIFFEL TOWER)                    */}
      {/* ========================================================= */}
      {currentPage === 'details' && (
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">
          
          {/* Top Hero Banner */}
          <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="h-64 bg-slate-900 relative p-4 flex flex-col justify-between">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 w-fit">
                <MapPin className="w-3 h-3" /> Paris, France
              </div>
              <div className="text-white/20 font-black text-xl text-center self-center w-full select-none flex items-center justify-center">
                <ImageIcon className="w-12 h-12 mr-3" /> [Location Photo Preview]
              </div>
            </div>
            
            <div className="bg-[#cc0000] text-white p-5 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">Eiffel Tower</h1>
              <div className="flex gap-2">
                <span className="bg-amber-400 text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ★ Landmark
                </span>
                <span className="bg-white text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  📷 Scenic
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Content Column */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="bg-white border-4 border-black rounded-xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                  <BookOpen className="w-5 h-5 text-red-600" /> Lore & Data
                </h3>
                <p className="text-sm text-gray-700 font-sans leading-relaxed mb-6">
                  Constructed from 1887 to 1889 as the entrance to the 1889 World's Fair, it was initially criticized by some of France's leading artists and intellectuals for its design, but it has become a global cultural icon of France and one of the most recognizable structures in the world. It is the tallest structure in Paris.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-black rounded-lg p-3 text-xs">
                    <div className="font-bold text-red-600 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3"/> Hours</div>
                    <div className="font-black">09:30 - 23:45 (Daily)</div>
                  </div>
                  <div className="border-2 border-black rounded-lg p-3 text-xs">
                    <div className="font-bold text-red-600 flex items-center gap-1 mb-1"><BookOpen className="w-3 h-3"/> Entry Fee</div>
                    <div className="font-black">From €11.30 (Stairs)</div>
                  </div>
                  <div className="border-2 border-black rounded-lg p-3 text-xs">
                    <div className="font-bold text-red-600 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3"/> Best Time</div>
                    <div className="font-black">Sunset / Evening Sparkle</div>
                  </div>
                  <div className="border-2 border-black rounded-lg p-3 text-xs">
                    <div className="font-bold text-red-600 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3"/> Travel</div>
                    <div className="font-black">Metro: Bir-Hakeim / Trocadéro</div>
                  </div>
                </div>
              </div>

              {/* Traveler Logs */}
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                  <h3 className="text-lg font-black flex items-center gap-2 text-indigo-700">
                    <Camera className="w-5 h-5" /> Traveler Logs
                  </h3>
                  <button className="text-xs font-bold text-red-600 hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-square bg-sky-200 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold">🗼</div>
                  <div className="aspect-square bg-sky-300 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold">🌅</div>
                  <div className="aspect-square bg-sky-100 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold">✨</div>
                </div>
              </div>

            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">
              
              <div className="bg-[#e8ecef] border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-amber-700">
                  <BarChart2 className="w-5 h-5" /> Location Stats
                </h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Popularity Level</span>
                    <span className="text-red-600">Lv. 99</span>
                  </div>
                  <div className="h-3 w-full border-2 border-black rounded-full bg-white overflow-hidden">
                    <div className="h-full bg-red-600 w-[95%] border-r-2 border-black"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <User className="w-4 h-4 mx-auto text-red-600 mb-1" />
                    <div className="text-[9px] font-bold text-gray-500 uppercase">Visitors</div>
                    <div className="text-xs font-black">7M / yr</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-amber-500 text-sm block mb-1">🎖️</span>
                    <div className="text-[9px] font-bold text-gray-500 uppercase">Rarity</div>
                    <div className="text-xs font-black">Legendary</div>
                  </div>
                </div>

                <button className="w-full bg-[#cc0000] text-white font-bold py-2.5 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 mb-3 flex items-center justify-center gap-2 text-sm transition-all">
                  <Heart className="w-4 h-4 fill-white" /> Add to Favorites
                </button>
                <button className="w-full bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 text-xs transition-all">
                  <Share2 className="w-4 h-4" /> Share Location
                </button>
              </div>

              {/* Wild Encounters */}
              <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-base font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-black">
                  🗺️ Wild Encounters
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 border-2 border-black rounded flex items-center justify-center text-sm shadow-sm">🚢</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">Seine River Cruise</div>
                      <div className="text-[10px] text-gray-500">500m away</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-50">
                    <div className="w-10 h-10 bg-amber-100 border-2 border-black rounded flex items-center justify-center text-sm shadow-sm">🏛️</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">Musée du quai Branly</div>
                      <div className="text-[10px] text-gray-500">800m away</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

            </div>
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