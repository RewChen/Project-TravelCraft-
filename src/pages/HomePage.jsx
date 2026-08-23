import { Play, Search, Footprints, ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { navigateTo, userProfile, communityMaps, trackMapOnWorldMap } = useApp();

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Hero Banner */}
      <section className="bg-white border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 md:p-8 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-400 border-2 border-black px-3 py-1 rounded-full text-[11px] font-black uppercase mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span>★</span> NEW COMMUNITY DISCOVERIES
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black leading-tight mb-4 tracking-tight">
              Gotta <span className="text-[#cc0000]">Travel</span> 'Em All.
            </h1>
            <p className="text-gray-600 text-xs md:text-sm font-sans leading-relaxed mb-8 font-medium">
              Explore maps designed and shared by trainers worldwide. Discover hidden spots, level up your profile, and conquer community maps.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigateTo('community')}
              className="w-full sm:w-auto bg-[#cc0000] hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Explore Community Maps</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>

        <div className="bg-[#a2d2ff] relative min-h-[260px] flex flex-col justify-between p-4 bg-[radial-gradient(#4895ef_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="self-end bg-amber-100 border-2 border-black px-2.5 py-1 rounded-md text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
            <p>🪙 Coin: {userProfile?.coins ?? 0}</p>
          </div>
          <div className="my-auto bg-[#81c784] border-4 border-black rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="text-[10px] font-bold text-emerald-950 uppercase mb-2 flex items-center justify-between">
              <span>FEATURED DISCOVERY</span>
              <span className="animate-pulse text-red-600">● LIVE</span>
            </div>
            <div className="h-32 bg-[#aed581] border-2 border-black rounded relative flex items-center justify-around p-2">
              <div className="absolute inset-x-8 top-1/2 h-1 bg-amber-700 border-t border-b border-black"></div>
              <div className="relative z-10 text-center cursor-pointer hover:scale-110 transition-transform">
                <div className="w-8 h-8 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏡</div>
              </div>
              <div className="relative z-10 text-center cursor-pointer hover:scale-110 transition-transform">
                <div className="w-8 h-8 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🌲</div>
              </div>
              <div
                onClick={() => {
                  if (communityMaps && communityMaps[1]) {
                    trackMapOnWorldMap(communityMaps[1]);
                  } else {
                    navigateTo('community');
                  }
                }}
                className="relative z-10 text-center cursor-pointer animate-bounce"
              >
                <div className="w-8 h-8 bg-sky-400 border-2 border-black rounded-full flex items-center justify-center mx-auto text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">🏰</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Gameplay Loop */}
      <section className="bg-gray-200 border-4 border-black rounded-2xl p-6 md:p-8 mb-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-center text-2xl font-black uppercase tracking-wider mb-8">THE CORE GAMEPLAY LOOP</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-1/2 left-10 right-10 h-1 bg-black -translate-y-1/2 z-0"></div>
          {[
            { step: 1, color: 'bg-red-600', icon: Search, title: 'Discover', desc: 'Browse maps created by community trainers.' },
            { step: 2, color: 'bg-amber-400', icon: Footprints, title: 'Track', desc: 'Load custom maps and track POIs on World Map.' },
            { step: 3, color: 'bg-blue-600', icon: ArrowUp, title: 'Level Up', desc: 'Earn coins, badges, and share your own map.' }
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
  );
}
