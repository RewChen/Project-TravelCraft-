import { useEffect, useMemo, useRef } from 'react';
import { Play, Search, Footprints, ArrowUp, Eye, MapPin, ArrowRight, Users, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchMapById } from '../lib/supabaseMaps';
import Reveal from '../components/motion/Reveal';
import { resolveCardBackground, isDefaultCover } from '../lib/imageUtils';
import './HomeHero.css';

// Earth — the featured planet of the space hero (single planet, no switcher).
const EARTH_CLIP =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4';
const EARTH_STILL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png';

// Savanna approach footage — the portal window reveals this when the Explore
// pill is clicked (the TO_EARTH clip dives from space down into the savanna).
const SAVANNA_CLIP =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4';

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
  const heroRef = useRef(null);
  const heroVideoRef = useRef(null);
  const savannaVideoRef = useRef(null);
  const portalCanvasRef = useRef(null);
  const portalBusy = useRef(false);
  const portalRaf = useRef(0);
  const portalTimeout = useRef(0);
  const portalSafety = useRef(0);
  const portalTiltCleanup = useRef(() => {});

  // Entrance animation: compose the opening frame, play once, then remove itself.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let reduced = false;
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      // ignore, default to animating
    }
    if (reduced) return;
    el.classList.add('anim');

    let guard = 0;
    let cancelled = false;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      window.clearTimeout(guard);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          el.classList.add('play');
          window.setTimeout(() => {
            if (cancelled) return;
            el.classList.remove('anim', 'play');
          }, 2150);
        });
      });
    };
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(run).catch(run);
      } else {
        run();
      }
    } catch {
      run();
    }
    guard = window.setTimeout(run, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(guard);
      el.classList.remove('anim', 'play');
    };
  }, []);

  // Cancel any running portal zoom on unmount.
  useEffect(
    () => () => {
      cancelAnimationFrame(portalRaf.current);
      window.clearTimeout(portalTimeout.current);
      window.clearTimeout(portalSafety.current);
      portalTiltCleanup.current();
      document.body.classList.remove('tc-portaling');
    },
    []
  );

  const scrollToNext = () => {
    const next = document.getElementById('home-stats');
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  };

  // Fake-perspective projection used for the tilting portal window (focal 850).
  const projectPoint = (px, py, cx, cy, rotX, rotY) => {
    const ax = (rotX * Math.PI) / 180;
    const ay = (rotY * Math.PI) / 180;
    const xx = px * Math.cos(ay);
    const yy = py * Math.cos(ax);
    const z = px * Math.sin(ay) - py * Math.sin(ax);
    const p = 850 / (850 + z);
    return [cx + xx * p, cy + yy * p];
  };

  // Rounded-rect window: walk the 4 corner arcs (10 steps each, ~44 points),
  // local coords centred on the window origin — matches the portal spec.
  const tracePortal = (ctx, w, h, r, cx, cy, rotX, rotY) => {
    const rr = Math.min(r, w / 2, h / 2);
    const hw = w / 2;
    const hh = h / 2;
    const corners = [
      [hw - rr, -hh + rr, -Math.PI / 2, 0],
      [hw - rr, hh - rr, 0, Math.PI / 2],
      [-hw + rr, hh - rr, Math.PI / 2, Math.PI],
      [-hw + rr, -hh + rr, Math.PI, Math.PI * 1.5],
    ];
    ctx.beginPath();
    let started = false;
    for (const [ccx, ccy, a0, a1] of corners) {
      for (let i = 0; i <= 10; i++) {
        const a = a0 + ((a1 - a0) * i) / 10;
        const [sx, sy] = projectPoint(ccx + Math.cos(a) * rr, ccy + Math.sin(a) * rr, cx, cy, rotX, rotY);
        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
    }
    ctx.closePath();
  };

  // Bottom gradient shade over the lower half of the viewport, per spec.
  const drawShade = (ctx, W, H) => {
    const grad = ctx.createLinearGradient(0, H * 0.52, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.52, W, H * 0.48);
  };

  // Draw the savanna clip cover-scaled over the FULL viewport (screen-locked),
  // then clip by the portal window so the window moves over a stationary image.
  const portalPaint = (ctx, video, W, H) => {
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };

  // Clicking the single Explore pill: a rounded window grows from the
  // center of the screen to fill the viewport, revealing the savanna clip.
  const doPortalZoom = () => {
    const canvas = portalCanvasRef.current;
    const takeoff = heroVideoRef.current;
    const land = savannaVideoRef.current;
    if (portalBusy.current || !canvas || !takeoff || !land) {
      navigateTo('community');
      return;
    }
    let reduced = false;
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      // keep reduced = false
    }
    if (reduced) {
      navigateTo('community');
      return;
    }

    portalBusy.current = true;
    // Fly the savanna clip into the growing window at 1.3× (per the portal spec).
    // Loop is disabled so the clip can reach its 'ended' frame and the sequence
    // can land on the savanna before navigating away.
    const playSavanna = () => {
      try {
        land.loop = false;
        land.playbackRate = 1.3;
        const p = land.play();
        if (p && p.catch) p.catch(() => {});
      } catch {
        /* ignore */
      }
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.floor(window.innerWidth);
    const H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.classList.add('is-running');
    document.body.classList.add('tc-portaling');

    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Pointer tilt targets (skipped while the zoom is running in/out busy).
    const tilt = { rotX: 0, rotY: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (ev) => {
      tilt.targetY = (ev.clientX / W - 0.5) * 37.4;
      tilt.targetX = (ev.clientY / H - 0.5) * -33;
    };
    const onPointerLeave = () => {
      tilt.targetX = 0;
      tilt.targetY = 0;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    portalTiltCleanup.current = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };

    // Start the animation only when the savanna feed actually has a frame,
    // otherwise the portal would render black. Fall back to navigating after
    // a short grace period so the button never dead-ends.
    const boot = (startedAt) => {
      if (land.readyState >= 2 && land.videoWidth && land.videoHeight) {
        beginZoom();
        return;
      }
      if (performance.now() - startedAt > 2000) {
        if (!portalBusy.current) return;
        canvas.classList.remove('is-running');
        document.body.classList.remove('tc-portaling');
        portalBusy.current = false;
        navigateTo('community');
        return;
      }
      portalTimeout.current = window.setTimeout(() => requestAnimationFrame(boot.bind(null, startedAt)), 60);
    };

    const beginZoom = () => {
      const startW = Math.max(180, W * 0.22);
      const startH = startW * 0.42;
      const t0 = performance.now();
      const DUR = 1100;
      let last = t0;

      const frame = (now) => {
        const dt = Math.min(40, now - last);
        last = now;
        tilt.rotX += (tilt.targetX - tilt.rotX) * Math.min(1, dt * 0.009);
        tilt.rotY += (tilt.targetY - tilt.rotY) * Math.min(1, dt * 0.009);

        const e = easeInOutCubic(Math.min(1, (now - t0) / DUR));
        ctx.clearRect(0, 0, W, H);

        // Window morphs from its start rect toward a full-screen rect; centre
        // slides to the viewport centre as it fills.
        const cx = W / 2;
        const cy = H * 0.42 + (H / 2 - H * 0.42) * e;
        const w = startW + (W - startW) * e;
        const h = startH + (H - startH) * e;
        const r = Math.max(0, 90 * (1 - e));
        const rx = e >= 1 ? 0 : tilt.rotX * (1 - e);
        const ry = e >= 1 ? 0 : tilt.rotY * (1 - e);

        // Backdrop dims out first while the window is still small.
        ctx.fillStyle = '#030303';
        ctx.globalAlpha = 0.5 * e;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;

        ctx.save();
        tracePortal(ctx, w, h, r, cx, cy, rx, ry);
        ctx.clip();
        portalPaint(ctx, land, W, H);
        drawShade(ctx, W, H);
        ctx.restore();

        if (e < 1) {
          portalRaf.current = requestAnimationFrame(frame);
          // Once the window has swallowed the screen, keep the full-screen
          // footage playing (screen-locked) so the clip runs through the
          // clouds and lands on the savanna before we leave.
        } else if (!land.ended && land.currentTime < (land.duration || 0) - 0.1) {
          portalRaf.current = requestAnimationFrame(frame);
        } else {
          window.clearTimeout(portalSafety.current);
          portalSafety.current = 0;
          portalTimeout.current = window.setTimeout(() => {
            if (!portalBusy.current) return;
            canvas.classList.remove('is-running');
            document.body.classList.remove('tc-portaling');
            portalBusy.current = false;
            try {
              const p = land.pause();
              if (p && p.then) p.catch(() => {});
            } catch {
              /* ignore */
            }
            navigateTo('community');
          }, 320);
        }
      };
      portalRaf.current = requestAnimationFrame(frame);
      // Safety net: never let the button dead-end even if the clip errors out.
      portalSafety.current = window.setTimeout(() => {
        if (!portalBusy.current) return;
        canvas.classList.remove('is-running');
        document.body.classList.remove('tc-portaling');
        portalBusy.current = false;
        navigateTo('community');
      }, (Math.max(land.duration || 6, 3) / 1.3) * 1000 + 1100 + 1600);
    };

    try {
      if (takeoff.paused) takeoff.play().catch(() => {});
    } catch {
      /* ignore */
    }
    playSavanna();
    boot(performance.now());
  };

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
  // Jae Sawn National Park is pinned into the strip so its preview never drops
  // out just because newer rows pushed it down the recency order.
  const featuredMaps = useMemo(() => {
    const eligible = publicMaps.filter((m) => !isHiddenMap(m));
    const pinned = eligible.find(isNonNavigableMap);
    const rest = eligible.filter((m) => !isNonNavigableMap(m));
    return pinned ? [pinned, ...rest.slice(0, 2)] : rest.slice(0, 3);
  }, [publicMaps]);

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
      {/* ═══════════ HERO (Earth space cinematic) ═══════════ */}
      <section ref={heroRef} className="tc-hero w-full bg-brand-cream">

        {/* Earth clip fills the whole viewport */}
        <div
          className="tc-sky"
          style={{ backgroundImage: `url(${EARTH_STILL})` }}
        >
          <video
            ref={heroVideoRef}
            className="is-active"
            src={EARTH_CLIP}
            poster={EARTH_STILL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>

        <div className="tc-ui">
          <div className="tc-copy">
            <h1 className="tc-col tc-title">
              <span className="ent-mask">
                <span className="ent-line">
                  Gotta <span className="tc-red">{t('home.titlePart')}</span> 'Em All.
                </span>
              </span>
            </h1>
            <div className="tc-col tc-rule"><span></span></div>
            <p className="tc-col tc-lede">{t('home.subtitle')}</p>

            <div className="tc-col tc-cta">
              <a href="#" onClick={(e) => { e.preventDefault(); doPortalZoom(); }}>
                <span className="tc-cta-icon"><Play /></span>
                <span className="tc-cta-label">{t('home.exploreBtn')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Scroll control to the stats strip */}
        <button className="tc-scroll" type="button" aria-label="Scroll to next section" onClick={scrollToNext}>
          <svg viewBox="0 0 26 33" fill="none" aria-hidden="true">
            <path d="M13 1.5 V31.5 M1.9 20.4 L13 31.5 L24.1 20.4" stroke="#ffffff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
        </button>
      </section>

      {/* Portal canvas — the single Explore button zooms this over the screen */}
      <canvas ref={portalCanvasRef} className="tc-portal" aria-hidden="true" />

      {/* Savanna approach clip feed for the portal zoom (muted, JS-driven) */}
      <video
        ref={savannaVideoRef}
        className="tc-portal-feed"
        src={SAVANNA_CLIP}
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ═══════════ STATS STRIP ═══════════ */}
      <section id="home-stats" className="bg-brand-cream dark:bg-slate-950 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: MapPin, label: t('home.statMaps'), value: stats.maps, tint: 'bg-brand-dark text-white' },
            { icon: Users, label: t('home.statTrainers'), value: stats.trainers, tint: 'bg-[#cc0000] text-white' }
          ].map((stat, idx) => (
            <Reveal key={stat.label} delay={idx * 100} className="h-full">
              <div className="bg-white dark:bg-slate-800 border border-brand-dark/10 dark:border-slate-700 rounded-3xl p-6 flex items-center gap-5 h-full shadow-[0_10px_30px_-20px_rgba(45,58,46,0.25)]">
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${stat.tint}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-3xl font-bold leading-none text-brand-dark dark:text-slate-100">{stat.value}</div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-brand-dark/50 dark:text-slate-400 mt-1">{stat.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════ CORE GAMEPLAY LOOP ═══════════ */}
      <section className="bg-brand-light/60 dark:bg-slate-900/70 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <h3 className="text-center text-2xl md:text-3xl font-bold tracking-tight text-brand-dark dark:text-slate-100 mb-2">{t('home.loopTitle')}</h3>
            <p className="text-center text-sm text-brand-dark/50 dark:text-slate-400 mb-10 md:mb-14">{t('home.subtitle')}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {steps.map((item, idx) => (
              <Reveal key={item.titleKey} delay={idx * 100} className="h-full">
                <div className="relative bg-white dark:bg-slate-800 border border-brand-dark/10 dark:border-slate-700 rounded-3xl p-8 h-full text-center shadow-[0_10px_30px_-22px_rgba(45,58,46,0.3)]">
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${item.color} text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow`}>
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-lg text-brand-dark dark:text-slate-100 mt-2 mb-2">{t(item.titleKey)}</h4>
                  <div className="w-12 h-12 rounded-full bg-brand-light dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.iconColor || 'text-brand-green dark:text-emerald-400'}`} />
                  </div>
                  <p className="text-[13px] text-brand-dark/60 dark:text-slate-300 leading-relaxed font-medium">{t(item.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED COMMUNITY MAPS ═══════════ */}
      <section id="featured-maps" className="bg-brand-cream dark:bg-slate-950 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-green dark:text-emerald-400 font-semibold mb-2">{t('home.featured')}</p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-dark dark:text-slate-100">{t('home.featuredTitle')}</h2>
              </div>
              {featuredMaps.length > 0 && (
                <button
                  onClick={() => navigateTo('community')}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-brand-light dark:hover:bg-slate-700 border border-brand-dark/10 dark:border-slate-700 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-dark dark:text-slate-100 transition-colors cursor-pointer"
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
                  <div className="bg-white dark:bg-slate-800 border border-brand-dark/10 dark:border-slate-700 rounded-3xl overflow-hidden shadow-[0_10px_30px_-22px_rgba(45,58,46,0.3)] flex flex-col justify-between hover:-translate-y-1 transition-transform h-full">
                    <div
                      onClick={() => trackMapOnWorldMap(mapItem)}
                      className="relative h-44 border-b border-brand-dark/10 dark:border-slate-700 overflow-hidden flex items-center justify-center group cursor-pointer"
                      title={t('community.trackTooltip')}
                    >
                      {mapItem.imageUrl && !isDefaultCover(mapItem.imageUrl) ? (
                        <img src={mapItem.imageUrl} alt={mapItem.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : resolveCardBackground(mapItem) ? (
                        <div className="w-full h-full transition-transform duration-300 group-hover:scale-105" style={resolveCardBackground(mapItem)} />
                      ) : (
                        <div className="w-full h-full bg-brand-light dark:bg-slate-700 flex items-center justify-center text-4xl">🗺️</div>
                      )}
                      <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-amber-400 px-4 py-1.5 text-xs font-bold text-brand-dark uppercase rounded-full shadow">
                          {t('home.trackNow')}
                        </span>
                      </div>
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase shadow ${mapItem.rarityColor || 'bg-white/90 dark:bg-slate-700/90 text-brand-dark/60 dark:text-slate-200'}`}>
                        {mapItem.rarity}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-brand-dark dark:text-slate-100 leading-snug line-clamp-2 mb-2" title={mapItem.title}>
                          {mapItem.title}
                        </h3>
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-brand-dark/60 dark:text-slate-300">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${mapItem.authorBadgeColor || 'bg-brand-green'}`}></div>
                            <div className="truncate">
                              <strong className="font-bold text-brand-dark dark:text-slate-100">{mapItem.discoveredBy}</strong>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-brand-light dark:bg-slate-700 rounded-full text-brand-dark/50 dark:text-slate-300 text-[10px] font-semibold flex items-center gap-1 shrink-0">
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
                        <button
                          onClick={() => trackMapOnWorldMap(mapItem)}
                          className="w-full bg-white dark:bg-slate-800 hover:bg-brand-light dark:hover:bg-slate-700 border border-brand-dark/15 dark:border-slate-600 text-brand-dark dark:text-slate-100 font-semibold py-2.5 px-4 rounded-full text-xs uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> {t('community.trackOnMap')}
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white dark:bg-slate-800 border border-dashed border-brand-dark/20 dark:border-slate-600 rounded-3xl py-16 px-6 space-y-3">
              <div className="text-5xl">🗺️</div>
              <div className="text-xl font-bold text-brand-dark dark:text-slate-100">{t('home.featuredEmpty')}</div>
              <p className="text-sm font-medium text-brand-dark/50 dark:text-slate-400">{t('home.featuredEmptyHint')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ CREATE CTA ═══════════ */}
      <section className="bg-brand-cream dark:bg-slate-950 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="bg-brand-dark dark:bg-slate-800 text-white rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-green/30 blur-3xl" aria-hidden="true"></div>
              <div className="max-w-xl relative">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t('home.createCtaTitle')}</h2>
                <p className="text-sm text-white/70 leading-relaxed font-medium">{t('home.createCtaDesc')}</p>
              </div>
              <button
                onClick={() => navigateTo('mymaps')}
                className="shrink-0 relative inline-flex items-center gap-3 bg-[#ffffff] text-brand-dark font-bold py-3.5 px-8 rounded-full text-sm uppercase tracking-wider hover:bg-brand-light dark:hover:bg-slate-200 transition-colors cursor-pointer"
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