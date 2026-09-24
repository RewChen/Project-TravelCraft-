import { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Triangle } from 'lucide-react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260820_010308_b1636845-4c15-4ab6-b0c9-9a29bfb0c6e3.mp4';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Navbar scroll behaviour */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="font-helvetica-neue antialiased">
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition duration-300 ${
          scrolled ? 'bg-brand-cream/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative flex items-center h-16 md:h-20">

            {/* Desktop left links */}
            <div className="hidden md:flex items-center gap-8 animate-fade-down stagger-1">
              <button className="flex items-center gap-1 text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity">
                Solutions <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <a href="#" className="text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity">
                Plans
              </a>
              <a href="#" className="text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity">
                News
              </a>
            </div>

            {/* Center logo */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 animate-fade-down stagger-2">
              <Triangle className="w-5 h-5 text-brand-dark fill-brand-dark" />
              <span className="text-xl text-brand-dark tracking-tight font-helvetica-neue">Palomar</span>
            </div>

            {/* Desktop CTA */}
            <a
              href="#"
              className="hidden md:inline-flex items-center ml-auto px-5 py-2.5 bg-brand-dark text-white text-sm tracking-wide uppercase rounded-full hover:bg-brand-green transition-colors animate-fade-down stagger-3"
            >
              Try It Free
            </a>

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-auto z-50 w-10 h-10 relative flex items-center justify-center"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((p) => !p)}
            >
              <span
                className={`absolute w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  menuOpen ? 'rotate-45 translate-y-0' : '-translate-y-[3.5px]'
                }`}
              />
              <span
                className={`absolute w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  menuOpen ? '-rotate-45 translate-y-0' : 'translate-y-[3.5px]'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ MOBILE OVERLAY ═══════════ */}
      <div
        className={`md:hidden fixed inset-0 bg-brand-cream z-40 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-100 ${
            menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          <button onClick={closeMenu} className="text-3xl text-brand-dark tracking-tight">Solutions</button>
          <a href="#" onClick={closeMenu} className="text-3xl text-brand-dark tracking-tight">Plans</a>
          <a href="#" onClick={closeMenu} className="text-3xl text-brand-dark tracking-tight">News</a>
          <a
            href="#"
            onClick={closeMenu}
            className="mt-4 inline-flex items-center px-8 py-3.5 bg-brand-dark text-white text-lg tracking-wide rounded-full"
          >
            Try It Free
          </a>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-brand-cream">

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
          {/* Left gradient so text doesn't get blocked by trees */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cream/80 via-brand-cream/40 to-transparent" />
          {/* Top gradient for nav readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/60 via-transparent to-transparent" />
        </div>

        {/* Content column */}
        <div className="relative z-10 flex flex-col items-start max-w-7xl mx-auto pt-28 md:pt-36 px-6 lg:px-8">

          {/* Announcement pill */}
          <a
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-dark/15 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors mb-5 md:mb-6 animate-fade-up stagger-3"
          >
            <span className="text-sm text-brand-dark">Live for everyone today! Offering $1MM in credits.</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-dark" />
          </a>

          {/* Headline */}
          <h1 className="text-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brand-dark leading-[1.05] tracking-tight max-w-4xl font-helvetica-neue animate-fade-up stagger-4">
            One unified system to build,<br className="hidden sm:block" />{' '}
            test, ship, and observe LLMs
          </h1>

          {/* Trusted by */}
          <div className="w-full mt-8 md:mt-10 animate-fade-up stagger-5">
            <p className="text-left text-xs tracking-[0.25em] uppercase text-brand-dark/50 mb-6 md:mb-8 font-helvetica-neue">
              Backed by
            </p>
            <div className="flex flex-wrap items-center justify-start gap-6 md:gap-12 lg:gap-16 animate-fade-up stagger-6">
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-playfair">Meridian</span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-oswald uppercase">STELLEX</span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-montserrat">Luminar</span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-roboto-slab uppercase">OVERLAND</span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-raleway">Kinetic</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}