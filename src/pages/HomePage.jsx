import { useMemo, useState } from 'react';
import { Play, Search, Footprints, ArrowUp, Eye, MapPin, ArrowRight, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMapById } from '../lib/supabaseMaps';
import Reveal from '../components/motion/Reveal';
import { resolveCardBackground, isDefaultCover } from '../lib/imageUtils';

export default function HomePage() {
  const { navigateTo, communityMaps, trackMapOnWorldMap, userProfile, t } = useApp();
  const [heroIndex, setHeroIndex] = useState(0);

  const publicMaps = useMemo(() => {
    // Only surface maps that really came from the database or the local editor
    // (same rule as the Community page). Public rows only.
    const isRealDbMap = (mapItem) =>
      mapItem._summaryOnly === true ||
      mapItem.isEditorMap === true ||
      Boolean(mapItem.ownerId && (
        mapItem.privacy === 'public' ||
        (userProfile?.id && mapItem.ownerId === userProfile.id)
      ));

    if (!Array.isArray(communityMaps)) return [];
    const seen = new Set();
    const list = [];
    for (const item of communityMaps) {
      if (!item?.id || seen.has(item.id)) continue;
      if (!isRealDbMap(item)) continue;
      if (item.privacy === 'unlisted' || item.privacy === 'private') continue;
      seen.add(item.id);
      list.push(item);
    }
    return list;
  }, [communityMaps, userProfile]);

  const featuredMaps = useMemo(() => publicMaps.slice(0, 3), [publicMaps]);
  const activeIndex = featuredMaps.length ? Math.min(heroIndex, featuredMaps.length - 1) : 0;
  const heroMap = featuredMaps[activeIndex];

  const stepMap = (delta) => {
    if (featuredMaps.length < 2) return;
    setHeroIndex(((activeIndex + delta) % featuredMaps.length + featuredMaps.length) % featuredMaps.length);
  };

  const stats = useMemo(() => {
    const trainers = new Set();
    for (const item of publicMaps) {
      if (item.discoveredBy) trainers.add(item.discoveredBy);
    }
    return { maps: publicMaps.length, trainers: trainers.size };
  }, [publicMaps]);

  const overlayPins = useMemo(() => {
    if (!heroMap || !Array.isArray(heroMap.pins)) return [];
    return heroMap.pins.slice(0, 3).map((pin) => {
      const rawTop = parseFloat(String(pin?.top ?? ''));
      const rawLeft = parseFloat(String(pin?.left ?? ''));
      return {
        icon: pin?.icon || '📍',
        top: Number.isFinite(rawTop) ? Math.min(88, Math.max(8, rawTop)) : 50,
        left: Number.isFinite(rawLeft) ? Math.min(92, Math.max(8, rawLeft)) : 50,
      };
    });
  }, [heroMap]);

  const openDetails = async (mapItem) => {
    // Fetch the full map so the details page has logs/selfies, not just a summary.
    if (mapItem._summaryOnly) {
      try {
        const full = await fetchMapById(mapItem.id);
        if (full) {
          navigateTo('details', full);
          return;
        }
      } catch {
        // fall through to the summary details
      }
    }
    navigateTo('details', mapItem);
  };

  const steps = [
    { color: 'bg-red-600', badgeText: 'text-white', icon: Search, iconColor: 'text-red-600', titleKey: 'home.discoverTitle', descKey: 'home.discoverDesc' },
    { color: 'bg-amber-400', badgeText: 'text-black', icon: Footprints, iconColor: 'text-amber-600', titleKey: 'home.trackTitle', descKey: 'home.trackDesc' },
    { color: 'bg-blue-600', badgeText: 'text-white', icon: ArrowUp, iconColor: 'text-blue-600', titleKey: 'home.levelTitle', descKey: 'home.levelDesc' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Hero Banner */}
      <Reveal>
      <section className="bg-white border-4 border-black rounded-2xl overflow-hidden mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 md:p-10 flex flex-col justify-center border-b-4 md:border-b-0 md:border-r-4 border-black">
          <h1 className="text-4xl lg:text-5xl font-black text-black leading-[1.08] mb-5 tracking-tight">
            Gotta <span className="text-[#cc0000]">{t('home.titlePart')}</span> 'Em All.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base font-sans leading-relaxed mb-8 font-medium max-w-md">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigateTo('community')}
              className="bg-[#cc0000] hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>{t('home.exploreBtn')}</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
            <button
              onClick={() => navigateTo('mymaps')}
              className="bg-white hover:bg-amber-100 text-black font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('home.createBtn')}</span>
            </button>
          </div>
        </div>

        {/* Live Featured Map Preview */}
        <div className="relative min-h-[320px] bg-sky-200 bg-[radial-gradient(#4895ef_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden flex flex-col">
          {heroMap ? (
            <>
              {heroMap.imageUrl && !isDefaultCover(heroMap.imageUrl) ? (
                <img src={heroMap.imageUrl} alt={heroMap.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : resolveCardBackground(heroMap) ? (
                <div role="img" aria-label={heroMap.title} className="absolute inset-0 w-full h-full" style={resolveCardBackground(heroMap)} />
              ) : null}

              {overlayPins.map((pin, idx) => (
                <div
                  key={idx}
                  className="absolute z-20 text-lg drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] animate-soft-bounce"
                  style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
                >
                  {pin.icon}
                </div>
              ))}

              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/25"></div>

              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-400 border-2 border-black px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span>★</span> {t('home.featured')}
                </span>
              </div>

              <div className={`absolute top-4 right-4 z-20 px-3 py-1 border-2 border-black font-black text-[10px] uppercase rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${heroMap.rarityColor || 'bg-gray-400 text-white'}`}>
                {heroMap.rarity}
              </div>

              {featuredMaps.length > 1 && (
                <>
                  <button
                    onClick={() => stepMap(-1)}
                    aria-label={t('home.prevMap')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-white hover:bg-amber-100 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={() => stepMap(1)}
                    aria-label={t('home.nextMap')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-white hover:bg-amber-100 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </button>
                </>
              )}

              <div className="mt-auto p-5 pb-9 relative z-20 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-white font-black text-xl uppercase font-mono leading-tight truncate" title={heroMap.title}>
                    {heroMap.title}
                  </h3>
                  <div className="text-[11px] text-white/90 font-black uppercase tracking-wide truncate">
                    {t('community.discoveredBy')} {heroMap.discoveredBy}
                  </div>
                </div>
                <button
                  onClick={() => trackMapOnWorldMap(heroMap)}
                  className="shrink-0 bg-[#cc0000] hover:bg-red-700 text-white font-black py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{t('home.trackNow')}</span>
                </button>
              </div>

              {featuredMaps.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
                  {featuredMaps.map((mapItem, idx) => (
                    <button
                      key={mapItem.id}
                      onClick={() => setHeroIndex(idx)}
                      aria-label={mapItem.title}
                      className={`h-2 rounded-full border-2 border-black transition-all cursor-pointer ${idx === activeIndex ? 'w-5 bg-amber-400' : 'w-2 bg-white/70 hover:bg-white'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="m-auto z-10 text-center p-8">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="text-sm font-black uppercase text-black">{t('home.featuredEmpty')}</p>
            </div>
          )}
        </div>
      </section>
      </Reveal>

      {/* Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: MapPin, label: t('home.statMaps'), value: stats.maps, tint: 'bg-[#cc0000] text-white' },
          { icon: Users, label: t('home.statTrainers'), value: stats.trainers, tint: 'bg-amber-400 text-black' }
        ].map((stat, idx) => (
          <Reveal key={stat.label} delay={idx * 100} className="h-full">
          <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 h-full">
            <div className={`w-12 h-12 shrink-0 border-2 border-black rounded-lg flex items-center justify-center ${stat.tint}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black leading-none text-slate-900 dark:text-slate-100">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          </div>
          </Reveal>
        ))}
      </section>

      {/* Core Gameplay Loop */}
      <Reveal>
      <section className="bg-gray-200 dark:bg-slate-800 border-4 border-black rounded-2xl p-6 md:p-8 mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-center text-2xl font-black uppercase tracking-wider mb-8 text-slate-900 dark:text-slate-100">{t('home.loopTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
          {steps.map((item, idx) => (
            <div key={item.titleKey} className="contents">
              <div className="bg-white border-4 border-black rounded-xl p-6 pt-7 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center min-w-0">
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-10 ${item.color} ${item.badgeText} w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  {idx + 1}
                </div>
                <div className="w-12 h-12 border-2 border-black rounded-full bg-gray-50 mx-auto mb-3 flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <h4 className="font-extrabold text-base mb-1 text-slate-900">{t(item.titleKey)}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans font-medium leading-relaxed">{t(item.descKey)}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden md:flex justify-center items-center">
                  <ArrowRight className="w-8 h-8 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)]" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* Featured Community Maps */}
      <section className="mb-10">
        <Reveal>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">{t('home.featuredTitle')}</h2>
          {featuredMaps.length > 0 && (
            <button
              onClick={() => navigateTo('community')}
              className="bg-white hover:bg-amber-100 border-2 border-black rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        </Reveal>

        {featuredMaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredMaps.map((mapItem, idx) => (
              <Reveal key={mapItem.id} delay={Math.min(idx, 5) * 90} className="h-full">
              <div className="bg-white border-4 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-0.5 transition-transform h-full">
                <div
                  onClick={() => trackMapOnWorldMap(mapItem)}
                  className="relative h-44 bg-sky-200 border-b-4 border-black overflow-hidden flex items-center justify-center cursor-pointer group"
                  title={t('community.trackTooltip')}
                >
                  {mapItem.imageUrl && !isDefaultCover(mapItem.imageUrl) ? (
                    <img src={mapItem.imageUrl} alt={mapItem.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : resolveCardBackground(mapItem) ? (
                    <div role="img" aria-label={mapItem.title} className="w-full h-full group-hover:scale-105 transition-transform duration-300" style={resolveCardBackground(mapItem)} />
                  ) : (
                    <div className="w-full h-full bg-sky-200 flex items-center justify-center text-4xl">🗺️</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-amber-400 border-2 border-black px-3 py-1 text-xs font-black text-black uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {t('home.trackNow')}
                    </span>
                  </div>
                  <div className={`absolute top-3 right-3 px-2.5 py-1 border-2 border-black font-black text-[10px] uppercase rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${mapItem.rarityColor || 'bg-gray-400 text-white'}`}>
                    {mapItem.rarity}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-snug line-clamp-2 mb-2" title={mapItem.title}>
                      {mapItem.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3 h-3 border border-black shrink-0 ${mapItem.authorBadgeColor}`}></div>
                        <div className="truncate">
                          <strong className="font-black text-black dark:text-white">{mapItem.discoveredBy}</strong>
                        </div>
                      </div>
                      <span className="text-[9px] bg-amber-100 border border-black px-1.5 py-0.5 rounded font-black uppercase text-amber-900 shrink-0 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {mapItem.pinCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => openDetails(mapItem)}
                      className="w-full bg-black text-white hover:bg-gray-800 font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors cursor-pointer"
                    >
                      {t('community.viewDetails')}
                    </button>
                    <button
                      onClick={() => trackMapOnWorldMap(mapItem)}
                      className="w-full bg-white hover:bg-amber-100 text-black font-black py-2.5 px-4 border-2 border-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-black" /> {t('community.trackOnMap')}
                    </button>
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white border-4 border-dashed border-black rounded-2xl py-16 px-6 space-y-3">
            <div className="text-5xl">🗺️</div>
            <div className="text-lg font-black uppercase tracking-tight text-slate-900">{t('home.featuredEmpty')}</div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('home.featuredEmptyHint')}</p>
          </div>
        )}
      </section>

      {/* Create CTA */}
      <Reveal>
      <section className="bg-black text-white border-4 border-black rounded-2xl p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black uppercase tracking-wider mb-2">{t('home.createCtaTitle')}</h2>
          <p className="text-sm font-sans font-medium text-slate-300 leading-relaxed">{t('home.createCtaDesc')}</p>
        </div>
        <button
          onClick={() => navigateTo('mymaps')}
          className="shrink-0 bg-[#cc0000] hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 text-sm uppercase tracking-wider transition-all cursor-pointer"
        >
          <span>{t('home.createCtaBtn')}</span>
          <Plus className="w-4 h-4" />
        </button>
      </section>
      </Reveal>
    </div>
  );
}