import { useMemo, useState } from 'react';
import { Play, Search, Footprints, ArrowUp, Eye, MapPin, ArrowRight, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMapById } from '../lib/supabaseMaps';
import Reveal from '../components/motion/Reveal';
import { resolveCardBackground, isDefaultCover } from '../lib/imageUtils';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260820_010308_b1636845-4c15-4ab6-b0c9-9a29bfb0c6e3.mp4';

// Khun Korn Waterfall rows are hidden from the Home hero + featured strip (owner requested).
const HIDDEN_FEATURED = ['น้ำตกขุนกรณ์', 'khun korn waterfall'];

// Kartes whose card is shown but must NOT offer world-map navigation buttons (owner requested).
const NON_NAVIGABLE = ['อุทยานแห่งชาติแจ้ซ้อน', 'jae sawn national park', 'jae sawn', 'jae sorn'];

// Khun Korn Waterfall rows are hidden from the Home hero + featured strip (owner requested).
// Jae Sawn National Park stays visible but its navigation ("Track on Map") buttons are suppressed.
const isHiddenMap = (m) => HIDDEN_FEATURED.some((k) => (m.title || m.name || '').toLowerCase().includes(k));
const isNonNavigableMap = (m) => NON_NAVIGABLE.some((k) => (m.title || m.name || '').toLowerCase().includes(k));

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

  // Khun Korn Waterfall rows are hidden from the Home hero + featured strip (owner requested).
  const featuredMaps = useMemo(
    () =>
      publicMaps.filter(
        (m) => !isHiddenMap(m)
      ).slice(0, 3),
    [publicMaps]
  );
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
    { color: 'bg-brand-dark', icon: Search, titleKey: 'home.discoverTitle', descKey: 'home.discoverDesc' },
    { color: 'bg-[#cc0000]', icon: Footprints, titleKey: 'home.trackTitle', descKey: 'home.trackDesc' },
    { color: 'bg-amber-400', icon: ArrowUp, iconColor: 'text-amber-700', titleKey: 'home.levelTitle', descKey: 'home.levelDesc' }
  ];

  return (
    <div className="font-thai antialiased">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative w-full h-screen min-h-[760px] overflow-hidden bg-brand-cream">

        {/* Video layer */}
        <div className="absolute inset-0">
          <video
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-bottom"
          />
          {/* Left gradient so text doesn't get blocked */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cream/85 via-brand-cream/45 to-transparent" />
          {/* Top gradient for nav readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/60 via-transparent to-transparent" />
        </div>

        {/* Content column */}
        <div className="relative z-10 flex flex-col items-start max-w-7xl mx-auto pt-28 md:pt-36 px-6 lg:px-8">

          {/* Headline */}
          <h1 className="text-left text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-brand-dark leading-[1.02] tracking-tight max-w-4xl font-helvetica-neue font-bold animate-fade-up stagger-2">
            Gotta <span className="text-[#cc0000]">{t('home.titlePart')}</span> <span className="font-helvetica-neue">'Em All.</span>
          </h1>

          <p className="text-left text-brand-dark/70 text-base md:text-lg leading-relaxed max-w-xl mt-5 font-thai font-medium animate-fade-up stagger-3">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 mt-8 animate-fade-up stagger-4">
            <button
              onClick={() => navigateTo('community')}
              className="inline-flex items-center justify-center gap-3 bg-brand-dark hover:bg-brand-green text-white font-semibold py-3.5 px-7 rounded-full text-sm uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>{t('home.exploreBtn')}</span>
              <Play className="w-4 h-4 fill-white" />
            </button>
            <button
              onClick={() => navigateTo('mymaps')}
              className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white border border-brand-dark/15 text-brand-dark font-semibold py-3.5 px-7 rounded-full text-sm uppercase tracking-wider transition-colors backdrop-blur-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('home.createBtn')}</span>
            </button>
          </div>

          {/* Featured map live card */}
          <div className="w-full max-w-2xl mt-10 md:mt-12 animate-fade-up stagger-5">
            {heroMap ? (
              <div className="bg-white/85 backdrop-blur-md border border-brand-dark/10 rounded-3xl shadow-[0_20px_50px_-25px_rgba(45,58,46,0.35)] p-4 flex items-center gap-4">
                <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 relative">
                  {heroMap.imageUrl && !isDefaultCover(heroMap.imageUrl) ? (
                    <img src={heroMap.imageUrl} alt={heroMap.title} className="w-full h-full object-cover" />
                  ) : resolveCardBackground(heroMap) ? (
                    <div className="w-full h-full" style={resolveCardBackground(heroMap)} />
                  ) : (
                    <div className="w-full h-full bg-brand-light flex items-center justify-center text-2xl">🗺️</div>
                  )}
                  {featuredMaps.length > 1 && (
                    <>
                      <button
                        onClick={() => stepMap(-1)}
                        aria-label={t('home.prevMap')}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-brand-dark" />
                      </button>
                      <button
                        onClick={() => stepMap(1)}
                        aria-label={t('home.nextMap')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-brand-dark" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-1">
                    <span>★</span> {t('home.featured')}
                  </span>
                  <h3 className="text-brand-dark font-bold text-base sm:text-lg leading-snug truncate" title={heroMap.title}>
                    {heroMap.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-brand-dark/50 font-medium truncate">
                      {t('community.discoveredBy')} {heroMap.discoveredBy}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${heroMap.rarityColor || 'bg-brand-light text-brand-dark/60'}`}>
                      {heroMap.rarity}
                    </span>
                  </div>
                </div>

                {!isNonNavigableMap(heroMap) && (
                <button
                  onClick={() => trackMapOnWorldMap(heroMap)}
                  className="shrink-0 hidden sm:inline-flex items-center gap-2 bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 px-4 rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{t('home.trackNow')}</span>
                </button>
                )}
              </div>
            ) : (
              <div className="bg-white/85 backdrop-blur-md border border-dashed border-brand-dark/20 rounded-3xl p-6 flex items-center gap-3">
                <div className="text-3xl">🗺️</div>
                <div>
                  <div className="text-brand-dark font-bold">{t('home.featuredEmpty')}</div>
                  <p className="text-xs text-brand-dark/50">{t('home.featuredEmptyHint')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <section className="bg-brand-cream py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: MapPin, label: t('home.statMaps'), value: stats.maps, tint: 'bg-brand-dark text-white' },
            { icon: Users, label: t('home.statTrainers'), value: stats.trainers, tint: 'bg-[#cc0000] text-white' }
          ].map((stat, idx) => (
            <Reveal key={stat.label} delay={idx * 100} className="h-full">
              <div className="bg-white border border-brand-dark/10 rounded-3xl p-6 flex items-center gap-5 h-full shadow-[0_10px_30px_-20px_rgba(45,58,46,0.25)]">
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${stat.tint}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-3xl font-bold leading-none text-brand-dark">{stat.value}</div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-brand-dark/50 mt-1">{stat.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════ CORE GAMEPLAY LOOP ═══════════ */}
      <section className="bg-brand-light/60 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <h3 className="text-center text-2xl md:text-3xl font-bold tracking-tight text-brand-dark mb-2">{t('home.loopTitle')}</h3>
            <p className="text-center text-sm text-brand-dark/50 mb-10 md:mb-14">{t('home.subtitle')}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {steps.map((item, idx) => (
              <Reveal key={item.titleKey} delay={idx * 100} className="h-full">
                <div className="relative bg-white border border-brand-dark/10 rounded-3xl p-8 h-full text-center shadow-[0_10px_30px_-22px_rgba(45,58,46,0.3)]">
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${item.color} text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow`}>
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-lg text-brand-dark mt-2 mb-2">{t(item.titleKey)}</h4>
                  <div className="w-12 h-12 rounded-full bg-brand-light mx-auto mb-4 flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.iconColor || 'text-brand-green'}`} />
                  </div>
                  <p className="text-[13px] text-brand-dark/60 leading-relaxed font-medium">{t(item.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED COMMUNITY MAPS ═══════════ */}
      <section id="featured-maps" className="bg-brand-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-green font-semibold mb-2">{t('home.featured')}</p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-dark">{t('home.featuredTitle')}</h2>
              </div>
              {featuredMaps.length > 0 && (
                <button
                  onClick={() => navigateTo('community')}
                  className="inline-flex items-center gap-2 bg-white hover:bg-brand-light border border-brand-dark/10 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-dark transition-colors cursor-pointer"
                >
                  {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </Reveal>

          {featuredMaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredMaps.map((mapItem, idx) => (
                <Reveal key={mapItem.id} delay={Math.min(idx, 5) * 90} className="h-full">
                  <div className="bg-white border border-brand-dark/10 rounded-3xl overflow-hidden shadow-[0_10px_30px_-22px_rgba(45,58,46,0.3)] flex flex-col justify-between hover:-translate-y-1 transition-transform h-full">
                    <div
                      onClick={() => { if (!isNonNavigableMap(mapItem)) trackMapOnWorldMap(mapItem); }}
                      className={`relative h-44 border-b border-brand-dark/10 overflow-hidden flex items-center justify-center group ${isNonNavigableMap(mapItem) ? 'cursor-default' : 'cursor-pointer'}`}
                      title={isNonNavigableMap(mapItem) ? undefined : t('community.trackTooltip')}
                    >
                      {mapItem.imageUrl && !isDefaultCover(mapItem.imageUrl) ? (
                        <img src={mapItem.imageUrl} alt={mapItem.title} loading="lazy" decoding="async" className={`w-full h-full object-cover transition-transform duration-300 ${isNonNavigableMap(mapItem) ? '' : 'group-hover:scale-105'}`} />
                      ) : resolveCardBackground(mapItem) ? (
                        <div className={`w-full h-full transition-transform duration-300 ${isNonNavigableMap(mapItem) ? '' : 'group-hover:scale-105'}`} style={resolveCardBackground(mapItem)} />
                      ) : (
                        <div className="w-full h-full bg-brand-light flex items-center justify-center text-4xl">🗺️</div>
                      )}
                      {!isNonNavigableMap(mapItem) && (
                      <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-amber-400 px-4 py-1.5 text-xs font-bold text-brand-dark uppercase rounded-full shadow">
                          {t('home.trackNow')}
                        </span>
                      </div>
                      )}
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase shadow ${mapItem.rarityColor || 'bg-white/90 text-brand-dark/60'}`}>
                        {mapItem.rarity}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-brand-dark leading-snug line-clamp-2 mb-2" title={mapItem.title}>
                          {mapItem.title}
                        </h3>
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-brand-dark/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${mapItem.authorBadgeColor || 'bg-brand-green'}`}></div>
                            <div className="truncate">
                              <strong className="font-bold text-brand-dark">{mapItem.discoveredBy}</strong>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-brand-light rounded-full text-brand-dark/50 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                            <MapPin className="w-2.5 h-2.5" /> {mapItem.pinCount || 0}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => openDetails(mapItem)}
                          className="w-full bg-brand-dark hover:bg-brand-green text-white font-semibold py-2.5 px-4 rounded-full text-xs uppercase transition-colors cursor-pointer"
                        >
                          {t('community.viewDetails')}
                        </button>
                        {!isNonNavigableMap(mapItem) && (
                        <button
                          onClick={() => trackMapOnWorldMap(mapItem)}
                          className="w-full bg-white hover:bg-brand-light border border-brand-dark/15 text-brand-dark font-semibold py-2.5 px-4 rounded-full text-xs uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> {t('community.trackOnMap')}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white border border-dashed border-brand-dark/20 rounded-3xl py-16 px-6 space-y-3">
              <div className="text-5xl">🗺️</div>
              <div className="text-xl font-bold text-brand-dark">{t('home.featuredEmpty')}</div>
              <p className="text-sm font-medium text-brand-dark/50">{t('home.featuredEmptyHint')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ CREATE CTA ═══════════ */}
      <section className="bg-brand-cream pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="bg-brand-dark text-white rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-green/30 blur-3xl" aria-hidden="true"></div>
              <div className="max-w-xl relative">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t('home.createCtaTitle')}</h2>
                <p className="text-sm text-white/70 leading-relaxed font-medium">{t('home.createCtaDesc')}</p>
              </div>
              <button
                onClick={() => navigateTo('mymaps')}
                className="shrink-0 relative inline-flex items-center gap-3 bg-white text-brand-dark font-bold py-3.5 px-8 rounded-full text-sm uppercase tracking-wider hover:bg-brand-light transition-colors cursor-pointer"
              >
                <span>{t('home.createCtaBtn')}</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}