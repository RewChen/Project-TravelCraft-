import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { translations, languages } from '../i18n';
import { fetchAllMaps, upsertMap, deleteMapRow, mapRowToItem } from '../lib/supabaseMaps';
import { deleteMapAssets } from '../lib/supabaseUploads';
import { derivePinsFromElements, scaleElementPositions, scaleElementFontSizes } from '../lib/editorCanvas';

const AppContext = createContext();

const initialPins = [
  {
    id: 'shrine-1',
    title: 'Ancient Shrine',
    region: 'Kyoto, Japan',
    type: 'Shrine',
    category: 'temples',
    tag: 'Historical',
    lore: 'A forgotten shrine hidden deep within the pixelated bamboo forest. Legend says a rare item lies within.',
    hours: '06:00 - 18:00 (Daily)',
    fee: 'Free',
    bestTime: 'Early Morning',
    travel: 'Kyoto Bus Route #206',
    popularity: 88,
    visitors: '1.2M / yr',
    rarity: 'Rare',
    top: '48%',
    left: '28%',
    icon: '⛩️',
    isUserUploaded: false
  },
  {
    id: 'temple-1',
    title: 'Kiyomizu Temple',
    region: 'Kyoto, Japan',
    type: 'Temple',
    category: 'temples',
    tag: 'Scenic',
    lore: 'Iconic wooden temple offering sweeping views of cherry blossoms and maple trees.',
    hours: '06:00 - 18:00',
    fee: '¥400',
    bestTime: 'Sunset',
    travel: 'Keihan Line to Kiyomizu-Gojo',
    popularity: 96,
    visitors: '3M / yr',
    rarity: 'Legendary',
    top: '38%',
    left: '42%',
    icon: '⛩️',
    isUserUploaded: false
  },
  {
    id: 'cafe-1',
    title: 'Pixel Coffee Shop',
    region: 'Kyoto, Japan',
    type: 'Cafe',
    category: 'cafes',
    tag: 'Cozy',
    lore: 'Cozy retro coffee nook serving matcha lattes and pixel art pastries.',
    hours: '08:00 - 20:00',
    fee: '¥600',
    bestTime: 'Afternoon',
    travel: 'Sanjo Station',
    popularity: 75,
    visitors: '50K / yr',
    rarity: 'Uncommon',
    top: '72%',
    left: '68%',
    icon: '☕',
    isUserUploaded: false
  },
  {
    id: 'view-1',
    title: 'Mount Hiei Viewpoint',
    region: 'Kyoto, Japan',
    type: 'Mountain',
    category: 'viewpoints',
    tag: 'Panoramic',
    lore: 'Breathtaking summit view overlooking Kyoto basin and Lake Biwa.',
    hours: '24/7',
    fee: 'Free',
    bestTime: 'Sunrise',
    travel: 'Eizan Cable Car',
    popularity: 90,
    visitors: '500K / yr',
    rarity: 'Epic',
    top: '18%',
    left: '78%',
    icon: '⛰️',
    isUserUploaded: false
  }
];

const initialCommunityDiscoveries = [
  {
    id: 'comm-1',
    title: 'EIFFEL TOWER',
    discoveredBy: 'Trainer Red',
    authorRole: 'Cartographer',
    authorBadgeColor: 'bg-[#cc0000]',
    popularityLv: 99,
    rarity: 'Legendary',
    rarityColor: 'bg-[#cc0000] text-white',
    category: 'landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80',
    bgThemeUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    details: {
      title: 'Eiffel Tower',
      region: 'Paris, France',
      type: 'Landmark',
      tag: 'Scenic',
      lore: "Constructed from 1887 to 1889 as the entrance to the 1889 World's Fair, it has become a global cultural icon of France and one of the most recognizable structures in the world.",
      hours: '09:30 - 23:45 (Daily)',
      fee: 'From €11.30',
      bestTime: 'Sunset / Evening Sparkle',
      travel: 'Metro: Bir-Hakeim / Trocadéro',
      popularity: 99,
      visitors: '7M / yr',
      rarity: 'Legendary'
    },
    pins: [
      { id: 'et-1', title: 'Champ de Mars Garden', top: '55%', left: '45%', icon: '🌸', category: 'viewpoints', lore: 'Sprawling green park underneath the iron structure.' },
      { id: 'et-2', title: 'Le Jules Verne Restaurant', top: '35%', left: '50%', icon: '🍷', category: 'cafes', lore: 'Michelin star dining with panoramic Paris skyline views.' }
    ]
  },
  {
    id: 'comm-2',
    title: 'KYOTO SHRINE',
    discoveredBy: 'Mystic Seeker',
    authorRole: 'Gym Leader',
    authorBadgeColor: 'bg-amber-400',
    popularityLv: 75,
    rarity: 'Epic',
    rarityColor: 'bg-indigo-500 text-white',
    category: 'landmarks',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    bgThemeUrl: null,
    details: {
      title: 'Kyoto Ancient Shrine',
      region: 'Kyoto, Japan',
      type: 'Shrine',
      tag: 'Historical',
      lore: 'A forgotten shrine hidden deep within the pixelated bamboo forest. Legend says a rare item lies within.',
      hours: '06:00 - 18:00',
      fee: 'Free',
      bestTime: 'Early Morning',
      travel: 'Kyoto Bus Route #206',
      popularity: 75,
      visitors: '1.2M / yr',
      rarity: 'Epic'
    },
    pins: initialPins
  },
  {
    id: 'comm-3',
    title: 'GRAND CANYON',
    discoveredBy: 'Canyon Crawler',
    authorRole: 'Cartographer',
    authorBadgeColor: 'bg-[#2ec4b6]',
    popularityLv: 82,
    rarity: 'Rare',
    rarityColor: 'bg-sky-500 text-white',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80',
    bgThemeUrl: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1200&q=80',
    details: {
      title: 'Grand Canyon National Park',
      region: 'Arizona, USA',
      type: 'Nature',
      tag: 'Canyon',
      lore: 'Carved over millions of years by the Colorado River, featuring massive layered red rock geological formations.',
      hours: '24/7',
      fee: '$35 per vehicle',
      bestTime: 'Sunrise at Mather Point',
      travel: 'South Rim Shuttle Bus',
      popularity: 82,
      visitors: '6M / yr',
      rarity: 'Rare'
    },
    pins: [
      { id: 'gc-1', title: 'Bright Angel Trailhead', top: '40%', left: '30%', icon: '⛰️', category: 'viewpoints', lore: 'Popular hiking trail descending into the deep canyon floor.' },
      { id: 'gc-2', title: 'Desert View Watchtower', top: '25%', left: '70%', icon: '🏰', category: 'landmarks', lore: 'Historic 70-foot stone tower offering panoramic views.' }
    ]
  },
  {
    id: 'comm-4',
    title: 'AKIHABARA NEON',
    discoveredBy: 'Otaku Traveler',
    authorRole: 'Novice Traveler',
    authorBadgeColor: 'bg-emerald-400',
    popularityLv: 88,
    rarity: 'Epic',
    rarityColor: 'bg-indigo-500 text-white',
    category: 'urban',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
    bgThemeUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80',
    details: {
      title: 'Akihabara Electric Town',
      region: 'Tokyo, Japan',
      type: 'Urban',
      tag: 'Neon',
      lore: 'The vibrant heart of Japan retro gaming culture, anime shops, and maid cafes bathed in glowing neon lights.',
      hours: '10:00 - 22:00',
      fee: 'Free Walk',
      bestTime: 'Night Neon Lights',
      travel: 'JR Yamanote Line to Akihabara',
      popularity: 88,
      visitors: '10M / yr',
      rarity: 'Epic'
    },
    pins: [
      { id: 'ak-1', title: 'Super Potato Retro Gaming', top: '45%', left: '40%', icon: '🎮', category: 'cafes', lore: 'Multi-story arcade & museum of classic vintage video games.' },
      { id: 'ak-2', title: 'Radio Kaikan Tower', top: '60%', left: '60%', icon: '🏢', category: 'landmarks', lore: 'Famous 10-story hobby store building next to the station.' }
    ]
  }
];

const initialBaseMaps = [
  {
    id: 'base-1',
    name: 'Verdant Plains',
    theme: 'Plains & Forest',
    badge: 'BASE',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
    description: 'Lush green valleys, tranquil shrines, and winding riverbanks.',
    region: 'Kanto Valley',
    pinsCount: 14,
    rating: 4.9
  },
  {
    id: 'base-2',
    name: 'Scorched Wastes',
    theme: 'Desert & Volcano',
    badge: 'BASE',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
    description: 'Arid desert expanses, ancient sandstone ruins, and magma fissures.',
    region: 'Cinnabar Badlands',
    pinsCount: 8,
    rating: 4.7
  },
  {
    id: 'base-3',
    name: 'Azure Coast',
    theme: 'Ocean & Isles',
    badge: 'BASE',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    description: 'Sparkling tropical shoreline, hidden coral grottos, and lighthouses.',
    region: 'Vermilion Archipelago',
    pinsCount: 11,
    rating: 4.8
  },
  {
    id: 'base-4',
    name: 'Obsidian Peaks',
    theme: 'Mountains & Peaks',
    badge: 'BASE',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    description: 'High volcanic summits shrouded in thunderstorms and ancient glyphs.',
    region: 'Indigo Plateau',
    pinsCount: 9,
    rating: 4.9
  }
];

const initialTrainers = [
  {
    id: 'tr-1',
    name: 'Ash K.',
    avatar: '🧢',
    email: 'ash.ketchum@pallet.town',
    role: 'Member',
    status: 'active',
    joined: '1998-02-27',
    mapsCreated: 8,
    strikes: 0,
    online: true,
    maps: ['PALLET ADVENTURE', 'VIRIDIAN GYM ROUTE', 'INDIGO PLATEAU EXTREME']
  },
  {
    id: 'tr-2',
    name: 'Misty S.',
    avatar: '🌊',
    email: 'misty.water@cerulean.gym',
    role: 'Novice',
    status: 'active',
    joined: '1997-04-01',
    mapsCreated: 4,
    strikes: 0,
    online: true,
    maps: ['CERULEAN CAPE', 'SEAFOAM ISLANDS']
  },
  {
    id: 'tr-3',
    name: 'Grunt #42',
    avatar: '👤',
    email: 'grunt42@rocket.corp',
    role: 'Banned',
    status: 'banned',
    joined: '2024-01-15',
    mapsCreated: 12,
    strikes: 24,
    online: false,
    maps: ['TEAM ROCKET HIDEOUT', 'SLIPH CO LABS']
  },
  {
    id: 'tr-4',
    name: 'Brock S.',
    avatar: '🪨',
    email: 'brock.stone@pewter.gym',
    role: 'Member',
    status: 'active',
    joined: '1998-05-10',
    mapsCreated: 15,
    strikes: 0,
    online: true,
    maps: ['MT MOON EXPEDITION', 'PEWTER ROCK TRAILS']
  },
  {
    id: 'tr-5',
    name: 'Trainer Blue',
    avatar: '⚡',
    email: 'gary.oak@champion.league',
    role: 'Novice',
    status: 'active',
    joined: '1998-03-01',
    mapsCreated: 9,
    strikes: 2,
    online: false,
    maps: ['CHAMPION HIGH ROAD', 'SECRET POWER SPOT']
  },
  {
    id: 'tr-6',
    name: 'MissingNo',
    avatar: '👾',
    email: 'missingno@glitch.net',
    role: 'Member',
    status: 'active',
    joined: '1996-02-27',
    mapsCreated: 1,
    strikes: 5,
    online: false,
    maps: ['GLITCH CITY WATERFRONT']
  }
];

const initialReportedLocations = [
  {
    id: 'rep-1',
    locationName: 'Team Rocket Secret Base',
    creator: 'Grunt #42',
    category: 'SPAM',
    categoryColor: 'bg-red-100 text-red-700 border-red-400',
    count: 158,
    status: 'pending',
    isHidden: false,
    reason: 'Commercial spam and illicit game casino advertisements.',
    reportedAt: '2 hours ago'
  },
  {
    id: 'rep-2',
    locationName: 'Invisible Bridge',
    creator: 'Trainer Blue',
    category: 'FAKE LOCATION',
    categoryColor: 'bg-amber-100 text-amber-700 border-amber-400',
    count: 42,
    status: 'pending',
    isHidden: false,
    reason: 'Coords lead to inaccessible open water tile with no collision.',
    reportedAt: '5 hours ago'
  },
  {
    id: 'rep-3',
    locationName: 'Glitch City',
    creator: 'MissingNo',
    category: 'INAPPROPRIATE',
    categoryColor: 'bg-blue-100 text-blue-700 border-blue-400',
    count: 12,
    status: 'resolved',
    isHidden: true,
    reason: 'Corrupted sprite tile glitching viewer clients.',
    reportedAt: '1 day ago'
  }
];

const initialGlobalSettings = {
  maxPinsPerMap: 50,
  autoApproveCommunity: false,
  maintenanceMode: false,
  allowFastTravel: true,
  coinMultiplier: 1.5,
  autoBanStrikeThreshold: 5,
  serverRegion: 'AP-East (Tokyo)',
  radarRadiusKm: 25
};

const rarityColorForTier = (tier) => {
  switch (tier) {
    case 'rare': return 'bg-sky-500 text-white';
    case 'epic': return 'bg-indigo-500 text-white';
    case 'legendary': return 'bg-[#cc0000] text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const stripMediaFromMap = (item) => {
  if (!item || typeof item !== 'object') return item;
  const clone = { ...item };
  for (const key of ['imageUrl', 'bgThemeUrl', 'previewBackground', 'selfieUrl', 'videoUrl']) {
    if (typeof clone[key] === 'string' && clone[key].startsWith('data:')) clone[key] = null;
  }
  if (Array.isArray(clone.selfieUrls)) {
    clone.selfieUrls = clone.selfieUrls.map((u) => (typeof u === 'string' && u.startsWith('data:') ? null : u));
  }
  if (clone.details && typeof clone.details === 'object') {
    clone.details = stripMediaFromMap(clone.details);
  }
  delete clone.editorState;
  return clone;
};

const serializeCommunityMapsForStorage = (items, trimMedia) =>
  Array.isArray(items) ? (trimMedia ? items.map(stripMediaFromMap) : items) : items;

export const AppProvider = ({ children }) => {
  // Navigation State: 'home', 'community', 'map', 'details', 'mymaps', 'profile', 'auth', 'admin'
  const [currentPage, setCurrentPage] = useState('home');
  const [editorSetup, setEditorSetup] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('pocket_odyssey_themeMode');
      return storedTheme || 'light';
    } catch {
      return 'light';
    }
  });

  const [language, setLanguageState] = useState(() => {
    try {
      const storedLang = localStorage.getItem('pocket_odyssey_language');
      return storedLang || 'en';
    } catch {
      return 'en';
    }
  });

  const t = useCallback((key, args) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
    }
    let str = result || key;
    if (args && typeof str === 'string') {
      Object.entries(args).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (translations[code]) {
      setLanguageState(code);
      try {
        const bc = new BroadcastChannel('pocket_odyssey_lang');
        bc.postMessage({ language: code });
        bc.close();
      } catch {}
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'th' : 'en';
      try {
        const bc = new BroadcastChannel('pocket_odyssey_lang');
        bc.postMessage({ language: next });
        bc.close();
      } catch {}
      return next;
    });
  }, []);

  // Cross-tab / cross-dashboard language sync: storage event + BroadcastChannel fallback.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'pocket_odyssey_language' && e.newValue && translations[e.newValue] && e.newValue !== language) {
        setLanguageState(e.newValue);
      }
      if (e.key === 'pocket_odyssey_themeMode' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed !== themeMode) setThemeMode(parsed);
        } catch {
          if (e.newValue !== themeMode) setThemeMode(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    // Also listen to BroadcastChannel for same-tab immediate sync (some browsers don't fire storage for same tab)
    let bc;
    try {
      bc = new BroadcastChannel('pocket_odyssey_lang');
      bc.onmessage = (ev) => {
        if (ev.data?.language && translations[ev.data.language] && ev.data.language !== language) {
          setLanguageState(ev.data.language);
        }
      };
    } catch {}
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [language, themeMode]);

  // LocalStorage Helper Read
  const loadStored = (key, fallback) => {
    try {
      const stored = localStorage.getItem(`pocket_odyssey_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  // User Profile & Role State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const getStoredRole = () => {
    try {
      return localStorage.getItem('pocket_odyssey_userRole') || null;
    } catch {
      return null;
    }
  };

  const getStoredBadges = () => {
    try {
      const raw = localStorage.getItem('pocket_odyssey_badges');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Persist badges locally so they survive a reload on this device.
  const updateUserBadges = (badges) => {
    const next = Array.isArray(badges) ? badges : [];
    setUserProfile((prev) => (prev ? { ...prev, badges: next } : prev));
    try {
      localStorage.setItem('pocket_odyssey_badges', JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  // Persist the chosen role so it survives reload and syncs to Supabase when signed in.
  const updateUserRole = async (role) => {
    setUserProfile((prev) => (prev ? { ...prev, role } : { role, name: 'Traveler' }));
    try {
      localStorage.setItem('pocket_odyssey_userRole', role);
    } catch (err) {
      console.warn(err);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', session.user.id);
      if (error) console.warn('Role sync skipped:', error);
    } catch (err) {
      console.warn('Role sync skipped:', err);
    }
  };

  const updateUsername = async (username) => {
    const cleanName = (username || '').trim();
    if (!cleanName || cleanName.length > 20) return { success: false, error: 'validation' };
    const prevName = userProfile?.name;
    setUserProfile((prev) => (prev ? { ...prev, name: cleanName } : prev));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: true };
      const { error } = await supabase
        .from('users')
        .update({ username: cleanName })
        .eq('id', session.user.id);
      if (error) {
        setUserProfile((prev) => (prev ? { ...prev, name: prevName } : prev));
        console.warn('Username update rejected:', error);
        return { success: false, error: error.code === '23505' ? 'taken' : 'db' };
      }
      return { success: true };
    } catch (err) {
      setUserProfile((prev) => (prev ? { ...prev, name: prevName } : prev));
      console.warn('Username update skipped:', err);
      return { success: false, error: 'db' };
    }
  };

  const createFallbackProfile = (authUser) => {
    const meta = authUser.user_metadata || {};
    // OAuth providers use different keys: google -> full_name/picture, facebook -> full_name/picture
    const oauthName = meta.full_name || meta.name || meta.user_name || meta.preferred_username || meta.username;
    const oauthAvatar = meta.avatar_url || meta.picture || meta.avatar;
    return {
      id: authUser.id,
      name: oauthName || meta.username || 'Traveler',
      email: authUser.email || '',
      avatar: oauthAvatar || meta.avatar || '🏃',
      role: getStoredRole() || meta.role || 'Cartographer',
      coins: 1245,
      level: 1,
      badges: getStoredBadges(),
      visitedCount: 0
    };
  };

  const fetchUserProfile = async (userId) => {
    try {
      // 1. Check if user is in admins table
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (adminData && adminData.is_active) {
        setIsAdminLoggedIn(true);
        setUserProfile({
          id: userId,
          name: adminData.username || 'Admin_01',
          email: adminData.email,
          avatar: '🛡️',
          role: 'Admin',
          coins: 9999,
          level: 99,
          badges: ['Master Admin', 'System Lord'],
          visitedCount: 99
        });
        setAdminUser({
          name: adminData.username || 'Admin_01',
          email: adminData.email,
          role: 'SUPERUSER',
          badge: 'A1',
          clearanceLevel: 5
        });
        try {
          localStorage.setItem('pocket_odyssey_isAdmin', 'true');
        } catch (e) {
          console.warn(e);
        }
        return;
      }

      // 2. Check public.users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const isAdmin = data.role?.toLowerCase() === 'admin';
        const loadedBadges = getStoredBadges();
        setIsAdminLoggedIn(isAdmin);
        setUserProfile({
          id: userId,
          name: data.username,
          email: data.email,
          avatar: data.avatar || (isAdmin ? '🛡️' : '🏃'),
          role: isAdmin ? 'Admin' : (getStoredRole() || data.role || 'Cartographer'),
          coins: 1245,
          level: 1,
          badges: loadedBadges.length ? loadedBadges : (Array.isArray(data.badges) ? data.badges : ['Pioneer', 'Kyoto Explorer']),
          visitedCount: 14
        });
        if (isAdmin) {
          setAdminUser({
            name: data.username,
            email: data.email,
            role: 'SUPERUSER',
            badge: 'A1',
            clearanceLevel: 5
          });
          try {
            localStorage.setItem('pocket_odyssey_isAdmin', 'true');
          } catch (e) {
            console.warn(e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback - use session email if available
      setUserProfile({
        id: userId,
        name: 'Traveler',
        email: '',
        avatar: '🏃',
        role: 'Cartographer',
        coins: 1245, level: 1, badges: getStoredBadges(), visitedCount: 0
      });
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserProfile(createFallbackProfile(session.user));
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      setIsAuthLoading(false); // Done loading
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserProfile(createFallbackProfile(session.user));
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Map Pins, Background Image, Favorites, Community Maps
  const [mapPins, setMapPins] = useState(() => loadStored('mapPins', initialPins));
  const [selectedPin, setSelectedPin] = useState(initialPins[0]);
  const [mapBackgroundImage, setMapBackgroundImage] = useState(() => loadStored('mapBgImage', null));
  const [mapCanvasStyle, setMapCanvasStyle] = useState(null);
  const [mapElements, setMapElements] = useState([]);
  const [favorites, setFavorites] = useState(() => loadStored('favorites', ['Eiffel Tower']));
  const [communityMaps, setCommunityMaps] = useState(() => loadStored('communityMaps', initialCommunityDiscoveries));
  const [activeCommunityMap, setActiveCommunityMap] = useState(null);

  // Persist a map to Supabase when a real session exists (guest/offline stays local).
  const persistMapToDb = async (item) => {
    if (!item?.id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await upsertMap(item);
    } catch (err) {
      console.warn('Supabase map sync skipped:', err);
    }
  };

  // Delete a map row from Supabase when a real session exists.
  const deleteMapFromDb = async (mapId) => {
    if (!mapId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await deleteMapRow(mapId);
    } catch (err) {
      console.warn('Supabase map delete skipped:', err);
    }
  };

  // Once auth is resolved, hydrate community maps from the database (fallback stays local).
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateMapsFromDb = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const dbMaps = await fetchAllMaps();
        if (cancelled) return;
        setCommunityMaps((previous) => {
          const merged = [];
          const seen = new Set();
          for (const dbMap of dbMaps) {
            if (seen.has(dbMap.id)) continue;
            seen.add(dbMap.id);
            merged.push(dbMap);
          }
          for (const localItem of previous) {
            if (seen.has(localItem.id)) continue;
            // Signed-in: drop local copies of maps the current user owns that no longer exist in the DB
            if (session && localItem.ownerId === session.user.id) continue;
            seen.add(localItem.id);
            merged.push(localItem);
          }
          return merged;
        });
      } catch (err) {
        console.warn('Community maps fallback to local storage:', err);
      }
    };
    hydrateMapsFromDb();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading]);

  // Admin Dashboard States & Persistence
  const [adminActiveTab, setAdminActiveTab] = useState('overview'); // 'overview', 'basemaps', 'settings', 'users', 'reports'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('pocket_odyssey_isAdmin') === 'true' || localStorage.getItem('pocket_odyssey_isAdmin') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUser, setAdminUser] = useState(() => loadStored('adminUser', {
    name: 'Admin_01',
    email: 'admin@travelcraft.com',
    role: 'SUPERUSER',
    badge: 'A1',
    clearanceLevel: 5
  }));
  const [baseMaps, setBaseMaps] = useState(() => loadStored('adminBaseMaps', initialBaseMaps));
  const [trainers, setTrainers] = useState(() => loadStored('adminTrainers', initialTrainers));
  const [reportedLocations, setReportedLocations] = useState(() => loadStored('adminReports', initialReportedLocations));
  const [globalSettings, setGlobalSettings] = useState(() => loadStored('adminSettings', initialGlobalSettings));
  const [adminToast, setAdminToast] = useState(null);

  // Notifications — bell button dropdown (persists locally)
  const initialNotifications = [
    { id: 'n1', titleKey: 'notifications.demo1Title', messageKey: 'notifications.demo1Msg', time: '2m ago', read: false, icon: '🗺️' },
    { id: 'n2', titleKey: 'notifications.demo2Title', messageKey: 'notifications.demo2Msg', time: '1h ago', read: false, icon: '📸' },
    { id: 'n3', titleKey: 'notifications.demo3Title', messageKey: 'notifications.demo3Msg', time: '1d ago', read: true, icon: '✨' },
  ];
  const [notifications, setNotifications] = useState(() => loadStored('notifications', initialNotifications));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [{ id: `n-${Date.now()}`, read: false, time: 'just now', icon: '🔔', ...notif }, ...prev].slice(0, 20));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  // Ref to avoid stale user id in realtime callbacks
  const currentUserIdRef = useRef(null);
  useEffect(() => {
    currentUserIdRef.current = userProfile?.id || null;
  }, [userProfile?.id]);

  // Initial hydration of trainer registry from Supabase (keeps admin view in sync with real users table)
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateTrainersFromDb = async () => {
      try {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200);
        if (cancelled || !data) return;
        // Only replace if we actually got data; keep local fallback otherwise
        if (data.length) {
          const mapped = data.map((u) => ({
            id: u.id,
            name: u.username || 'Anonymous',
            email: u.email || 'N/A',
            role: u.role === 'admin' ? 'Admin' : u.role || 'Member',
            avatar: u.avatar || '🧢',
            status: u.status || 'active',
            joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
            strikes: u.strikes ?? 0,
          }));
          setTrainers(mapped);
        }
      } catch (err) {
        console.warn('Trainer registry hydration skipped:', err);
      }
    };
    hydrateTrainersFromDb();
    return () => { cancelled = true; };
  }, [isAuthLoading]);

  // Realtime sync: whenever any user creates/updates/deletes a map or user, keep admin dashboard in sync with the user UI.
  // Also pushes real system notifications to the bell.
  useEffect(() => {
    const channel = supabase
      .channel('maps-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maps' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setCommunityMaps((prev) => prev.filter((m) => m.id !== deletedId));
            addNotification({ titleKey: 'notifications.mapDeletedTitle', messageKey: 'notifications.mapDeletedMsg', icon: '🗑️' });
          }
          return;
        }
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (!row) return;
          const item = mapRowToItem(row);
          const isOwn = row.owner_id && currentUserIdRef.current && row.owner_id === currentUserIdRef.current;
          setCommunityMaps((prev) => {
            const idx = prev.findIndex((m) => m.id === item.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...item };
              return next;
            }
            return [item, ...prev];
          });
          // Real notification — only for other users' inserts (own insert already notified via publishMapToCommunity)
          if (payload.eventType === 'INSERT' && !isOwn) {
            const creator = item.discoveredBy || row.data?.discoveredBy || 'Trainer';
            addNotification({
              titleKey: 'notifications.newMapTitle',
              messageKey: 'notifications.newMapMsg',
              titleParam: item.title || 'New Map',
              messageParam: creator,
              icon: '🗺️',
              data: { mapId: item.id },
            });
          } else if (payload.eventType === 'UPDATE' && !isOwn) {
            addNotification({
              titleKey: 'notifications.mapUpdatedTitle',
              messageKey: 'notifications.mapUpdatedMsg',
              titleParam: item.title || 'Map',
              icon: '✏️',
              data: { mapId: item.id },
            });
          }
        }
      })
      .subscribe();

    const usersChannel = supabase
      .channel('users-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        try {
          const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200);
          if (!data) return;
          const mapped = data.map((u) => ({
            id: u.id,
            name: u.username || 'Anonymous',
            email: u.email || 'N/A',
            role: u.role === 'admin' ? 'Admin' : u.role || 'Member',
            avatar: u.avatar || '🧢',
            status: u.status || 'active',
            joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
            strikes: u.strikes ?? 0,
          }));
          setTrainers(mapped);
          if (payload?.eventType === 'INSERT' && payload.new) {
            const isOwn = payload.new.id === currentUserIdRef.current;
            if (!isOwn) {
              addNotification({
                titleKey: 'notifications.newUserTitle',
                messageKey: 'notifications.newUserMsg',
                titleParam: payload.new.username || 'New Trainer',
                icon: '👤',
              });
            }
          }
        } catch (e) {
          console.warn('users live sync skipped:', e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(usersChannel);
    };
  }, [addNotification]);

  const showAdminToast = (message, type = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 3500);
  };

  // Sync to LocalStorage on State Changes (Only non-auth data)
  useEffect(() => {
    const persistToLocalStorage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const trimMedia = Boolean(session);
        localStorage.setItem('pocket_odyssey_mapPins', JSON.stringify(mapPins));
        localStorage.setItem('pocket_odyssey_mapBgImage', JSON.stringify(mapBackgroundImage));
        localStorage.setItem('pocket_odyssey_favorites', JSON.stringify(favorites));
        localStorage.setItem('pocket_odyssey_communityMaps', JSON.stringify(serializeCommunityMapsForStorage(communityMaps, trimMedia)));
        localStorage.setItem('pocket_odyssey_adminBaseMaps', JSON.stringify(baseMaps));
        localStorage.setItem('pocket_odyssey_adminTrainers', JSON.stringify(trainers));
        localStorage.setItem('pocket_odyssey_adminReports', JSON.stringify(reportedLocations));
        localStorage.setItem('pocket_odyssey_adminSettings', JSON.stringify(globalSettings));
        localStorage.setItem('pocket_odyssey_themeMode', JSON.stringify(themeMode));
        localStorage.setItem('pocket_odyssey_language', language);
        localStorage.setItem('pocket_odyssey_notifications', JSON.stringify(notifications));
      } catch (err) {
        if (err && err.name === 'QuotaExceededError') {
          try {
            localStorage.removeItem('pocket_odyssey_communityMaps');
            localStorage.removeItem('pocket_odyssey_mapPins');
            console.warn('LocalStorage quota exceeded; cleared map caches.');
          } catch (clearErr) {
            console.warn('LocalStorage clear error:', clearErr);
          }
        } else {
          console.warn('LocalStorage save error:', err);
        }
      }
    };
    persistToLocalStorage();
  }, [mapPins, mapBackgroundImage, favorites, communityMaps, baseMaps, trainers, reportedLocations, globalSettings, themeMode, language, notifications]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Selected Location for Details Page
  const [selectedLocation, setSelectedLocation] = useState({
    title: 'Eiffel Tower',
    region: 'Paris, France',
    type: 'Landmark',
    tag: 'Scenic',
    lore: "Constructed from 1887 to 1889 as the entrance to the 1889 World's Fair, it has become a global cultural icon of France and one of the most recognizable structures in the world.",
    hours: '09:30 - 23:45 (Daily)',
    fee: 'From €11.30 (Stairs)',
    bestTime: 'Sunset / Evening Sparkle',
    travel: 'Metro: Bir-Hakeim / Trocadéro',
    popularity: 99,
    visitors: '7M / yr',
    rarity: 'Legendary'
  });

  // Map Filter State
  const [mapFilters, setMapFilters] = useState({
    temples: true,
    cafes: true,
    viewpoints: true,
    photos: true
  });

  const toggleFilter = (filterKey) => {
    setMapFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const toggleFavorite = (locationTitle) => {
    setFavorites((prev) =>
      prev.includes(locationTitle)
        ? prev.filter((item) => item !== locationTitle)
        : [...prev, locationTitle]
    );
  };

  const addCustomPin = (newPinData) => {
    const customId = newPinData.id || `custom-pin-${newPinData.title.replace(/\s+/g, '-').toLowerCase()}`;
    const newPin = {
      id: customId,
      region: activeCommunityMap ? activeCommunityMap.title : 'Kyoto, Japan',
      hours: '24/7',
      fee: 'Free',
      bestTime: 'Anytime',
      travel: 'Traveler Spot',
      popularity: 80,
      visitors: 'User Upload',
      rarity: 'Custom Photo',
      isUserUploaded: true,
      ...newPinData
    };
    setMapPins((prev) => [newPin, ...prev]);
    setSelectedPin(newPin);
    setUserProfile((prev) => ({ ...prev, coins: prev.coins + 50 }));
  };

  const deleteCustomPin = (pinId) => {
    setMapPins((prev) => prev.filter((pin) => pin.id !== pinId));
    if (selectedPin?.id === pinId) {
      setSelectedPin(null);
    }
  };

  const resetMapBackgroundImage = () => {
    setMapBackgroundImage(null);
    setMapCanvasStyle(null);
    setMapElements([]);
    setMapPins(initialPins);
    setSelectedPin(initialPins[0]);
    setActiveCommunityMap(null);
  };

  // Launch Community Map onto the World Map View
  const trackMapOnWorldMap = useCallback((communityItem) => {
    setActiveCommunityMap(communityItem);
    const editor = communityItem.editorState || {};
    // The user's editor background (latest edit) wins over any legacy bgThemeUrl.
    const editorBackground = typeof editor.backgroundImage === 'string' && editor.backgroundImage ? editor.backgroundImage : null;
    const bg = editorBackground || communityItem.bgThemeUrl || null;
    if (bg) {
      setMapBackgroundImage(bg);
    } else {
      setMapBackgroundImage(null);
    }
    // Template CSS background (used when the map has no uploaded background image).
    const preview = communityItem.previewBackground || {};
    if (preview.backgroundColor || (preview.backgroundImage && preview.backgroundImage !== 'none')) {
      setMapCanvasStyle({
        backgroundColor: preview.backgroundColor || '#ffffff',
        backgroundImage: preview.backgroundImage === 'none' ? undefined : preview.backgroundImage
      });
    } else {
      setMapCanvasStyle(null);
    }
    // Rebuild pins straight from the editor elements so the world map
    // shows exactly what the user placed (works for drafts too).
    const rawElements = Array.isArray(editor.elements) ? editor.elements : [];
    const rawPositions = editor.elementPositions || {};
    const scaledPositions = scaleElementPositions(rawPositions) || {};
    const scaledElements = scaleElementFontSizes(rawElements, rawPositions);
    const layerItems = scaledElements
      .map((element) => ({ element, position: scaledPositions[element.id] }))
      .filter((item) => item.position);
    setMapElements(layerItems);

    // Elements are rendered faithfully instead of as pins — only use pins
    // when there is no element layer to draw.
    let pins = layerItems.length ? [] : (Array.isArray(communityItem.pins) && communityItem.pins.length ? communityItem.pins : []);
    if (!layerItems.length && !pins.length && rawElements.length) {
      pins = derivePinsFromElements(rawElements, rawPositions, (el) => (el.labelKey ? t(el.labelKey) : (el.label || el.content || 'Spot')));
    }
    setMapPins(pins);
    setSelectedPin(pins.length ? pins[0] : null);
    setCurrentPage('map');
    if (communityItem?.id) {
      try {
        window.history.replaceState(null, '', `#/map/${encodeURIComponent(communityItem.id)}`);
      } catch (e) {
        console.warn('URL sync skipped:', e);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [t]);

  // Deep-link routing: every map has its own shareable URL (#/map/<mapId>).
  // On load or hash change, resolve the map id from communityMaps and open it.
  const [urlMapId, setUrlMapId] = useState(() => {
    try {
      const match = window.location.hash.match(/^#\/map\/(.+)$/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const match = window.location.hash.match(/^#\/map\/(.+)$/);
        setUrlMapId(match ? decodeURIComponent(match[1]) : null);
      } catch {
        setUrlMapId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!urlMapId) return undefined;
    const item = communityMaps.find((m) => m.id === urlMapId);
    if (item) {
      // Defer the navigation state update so it isn't a synchronous
      // setState inside the effect body.
      const timer = setTimeout(() => {
        trackMapOnWorldMap(item);
        setUrlMapId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    // Keep retrying until the map list finishes hydrating from the DB.
    const retryTimer = setTimeout(() => setUrlMapId(null), 6000);
    return () => clearTimeout(retryTimer);
  }, [urlMapId, communityMaps, trackMapOnWorldMap]);

  // Persist the latest Map Editor state for a map owned by the current user.
  const saveEditorMapState = (mapId, editorState) => {
    if (!mapId || !editorState) return;
    const currentItem = communityMaps.find((item) => item.id === mapId);
    if (currentItem) {
      const details = currentItem.details ? { ...currentItem.details } : {};
      if (editorState.mapTitle) details.title = editorState.mapTitle;
      if (editorState.publishDescription) details.lore = editorState.publishDescription;
      const updatedItem = {
        ...currentItem,
        title: editorState.mapTitle ? String(editorState.mapTitle).toUpperCase() : currentItem.title,
        details,
        editorState,
        updatedAt: Date.now()
      };
      setCommunityMaps((previous) => previous.map((item) => (item.id === mapId ? updatedItem : item)));
      persistMapToDb(updatedItem);
    }
  };

  // Register a fresh editor map as an openable private draft.
  const registerEditorDraft = (draft) => {
    const author = userProfile || { name: 'Traveler', role: 'Cartographer' };
    const rarity = draft.rarity || 'common';
    const draftItem = {
      id: draft.id,
      ownerId: author.id || null,
      title: (draft.title || 'Untitled Map').toUpperCase(),
      discoveredBy: author.name,
      authorRole: author.role || 'Cartographer',
      authorBadgeColor: 'bg-[#cc0000]',
      popularityLv: 0,
      imageUrl: draft.imageUrl || '',
      rarity,
      rarityColor: rarityColorForTier(rarity),
      category: 'landmarks',
      isEditorMap: true,
      privacy: 'private',
      pins: draft.pins || [],
      tags: draft.tags || [],
      details: {
        title: draft.title || 'Untitled Map',
        region: draft.locationCity || 'Custom Traveler Realm',
        type: 'Community Map',
        tag: 'Custom',
        lore: draft.description || 'A custom map still being designed.',
        hours: draft.hours || '24/7',
        fee: draft.fee || 'Free Exploration',
        bestTime: draft.bestTime || 'Anytime',
        travel: draft.travel || 'Community Gateway',
        popularity: 0,
        visitors: '0',
        rarity,
        logs: draft.logs || [],
        tags: draft.tags || [],
        privacy: 'private'
      },
      editorState: draft.editorState || null,
      updatedAt: Date.now()
    };
    setCommunityMaps((previous) => {
      const exists = previous.some((item) => item.id === draftItem.id && item.ownerId === draftItem.ownerId);
      if (exists) return previous;
      return [draftItem, ...previous];
    });
    persistMapToDb(draftItem);
  };

  // Publish a custom user map to Community Discoveries!
  const publishMapToCommunity = (newCommunityMap) => {
    const title = newCommunityMap.title?.trim() || 'Untitled Map';
    const author = userProfile || { name: 'Traveler', role: 'Cartographer' };
    const mapSlug = title.replace(/\s+/g, '-').toLowerCase();
    const rawId = newCommunityMap.id;
    const uniqueId = rawId
      ? (String(rawId).startsWith('comm-user-') ? rawId : `comm-user-${mapSlug}-${rawId}`)
      : `comm-user-${mapSlug}`;
    const rarity = newCommunityMap.rarity || 'common';
    const publishedItem = {
      id: uniqueId,
      ownerId: author.id || null,
      title: title.toUpperCase(),
      discoveredBy: author.name,
      authorRole: author.role || 'Cartographer',
      authorBadgeColor: 'bg-[#cc0000]',
      popularityLv: 85,
      rarity,
      rarityColor: rarityColorForTier(rarity),
      category: newCommunityMap.category || 'landmarks',
      imageUrl: newCommunityMap.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
      videoUrl: newCommunityMap.videoUrl || null,
      previewBackground: newCommunityMap.previewBackground || null,
      isEditorMap: Boolean(newCommunityMap.isEditorMap),
      bgThemeUrl: newCommunityMap.bgThemeUrl || newCommunityMap.editorState?.backgroundImage || null,
      selfieUrl: newCommunityMap.selfieUrl || null,
      selfieUrls: newCommunityMap.selfieUrls || (newCommunityMap.selfieUrl ? [newCommunityMap.selfieUrl] : null),
      details: {
        title,
        region: newCommunityMap.region || 'Custom Traveler Realm',
        type: 'Community Map',
        tag: 'Custom',
        lore: newCommunityMap.description || 'A custom world map created and shared by an explorer.',
        videoUrl: newCommunityMap.videoUrl || null,
        selfieUrl: newCommunityMap.selfieUrl || null,
        selfieUrls: newCommunityMap.selfieUrls || (newCommunityMap.selfieUrl ? [newCommunityMap.selfieUrl] : null),
        hours: newCommunityMap.hours || '24/7',
        fee: newCommunityMap.fee || 'Free Exploration',
        bestTime: newCommunityMap.bestTime || 'Anytime',
        travel: newCommunityMap.travel || 'Community Gateway',
        popularity: 85,
        visitors: 'Community Discoveries',
        rarity,
        logs: newCommunityMap.logs || [],
        tags: newCommunityMap.tags || [],
        privacy: 'public'
      },
      pins: newCommunityMap.pins || mapPins,
      tags: newCommunityMap.tags || [],
      privacy: 'public',
      editorState: newCommunityMap.editorState || null
    };

    setCommunityMaps((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === uniqueId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...publishedItem };
        return next;
      }
      return [publishedItem, ...prev];
    });
    setUserProfile((prev) => prev ? { ...prev, coins: prev.coins + 150 } : prev);
    persistMapToDb(publishedItem);
    addNotification({ titleKey: 'notifications.publishedTitle', messageKey: 'notifications.publishedMsg', titleParam: title, icon: '🗺️' });
    navigateTo('community');
  };

  const deleteCommunityMap = (mapId) => {
    setCommunityMaps((previous) => previous.filter((map) => (
      !(map.id === mapId && (
        map.ownerId
          ? map.ownerId === userProfile?.id
          : map.discoveredBy === userProfile?.name
      ))
    )));
    deleteMapFromDb(mapId);
    deleteMapAssets(mapId);
  };

  // --- Admin Action Handlers ---
  const resolveReport = (reportId) => {
    setReportedLocations((prev) =>
      prev.map((rep) =>
        rep.id === reportId ? { ...rep, status: 'resolved' } : rep
      )
    );
    showAdminToast('Report marked as RESOLVED.', 'success');
  };

  const hideReportedLocation = (reportId) => {
    setReportedLocations((prev) =>
      prev.map((rep) =>
        rep.id === reportId ? { ...rep, isHidden: !rep.isHidden } : rep
      )
    );
    showAdminToast('Location visibility toggled.', 'info');
  };

  const deleteReportedLocation = (reportId) => {
    setReportedLocations((prev) => prev.filter((rep) => rep.id !== reportId));
    showAdminToast('Reported location deleted from registry.', 'error');
  };

  const warnTrainer = (trainerIdentifier) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerIdentifier || tr.name === trainerIdentifier
          ? { ...tr, strikes: (tr.strikes || 0) + 1 }
          : tr
      )
    );
    showAdminToast(`Warning & strike issued to ${trainerIdentifier}.`, 'warning');
  };

  const banTrainer = (trainerIdentifier) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerIdentifier || tr.name === trainerIdentifier
          ? { ...tr, status: 'banned', role: 'Banned' }
          : tr
      )
    );
    showAdminToast(`Trainer ${trainerIdentifier} has been BANNED.`, 'error');
  };

  const unbanTrainer = (trainerId) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerId ? { ...tr, status: 'active', role: 'Member', strikes: 0 } : tr
      )
    );
    showAdminToast('Trainer unbanned & reinstated.', 'success');
  };

  const changeTrainerRole = (trainerId, newRole) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerId ? { ...tr, role: newRole } : tr
      )
    );
    showAdminToast(`Role updated to ${newRole}.`, 'success');
  };

  const addBaseMap = (newMap) => {
    const mapWithId = {
      id: `base-${Date.now()}`,
      badge: 'BASE',
      pinsCount: 0,
      rating: 5.0,
      ...newMap
    };
    setBaseMaps((prev) => [...prev, mapWithId]);
    showAdminToast(`Base Map "${newMap.name}" created!`, 'success');
  };

  const deleteBaseMap = (mapId) => {
    setBaseMaps((prev) => prev.filter((m) => m.id !== mapId));
    showAdminToast('Base map deleted.', 'info');
  };

  const updateGlobalSettings = (newSettings) => {
    setGlobalSettings((prev) => ({ ...prev, ...newSettings }));
    showAdminToast('Global Map Settings updated successfully!', 'success');
  };

  const adminLogin = async (adminId, password) => {
    const cleanId = (adminId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Master & Demo credentials check
    const isValidMaster =
      (cleanId === 'admin_01' || cleanId === 'admin' || cleanId === 'admin@travelcraft.com' || cleanId === 'system lord') &&
      (cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === 'odyssey2026' || cleanPass === '123456');

    if (isValidMaster) {
      setIsAdminLoggedIn(true);
      try {
        sessionStorage.setItem('pocket_odyssey_isAdmin', 'true');
        localStorage.setItem('pocket_odyssey_isAdmin', 'true');
      } catch (err) {
        console.warn('Storage error:', err);
      }
      showAdminToast('🔑 Clearance Verified: Welcome, System Lord!', 'success');
      return { success: true };
    }

    // 2. Also check Supabase admins table
    try {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .or(`email.eq.${cleanId},username.eq.${cleanId}`)
        .single();

      if (adminData && (cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === 'odyssey2026')) {
        setIsAdminLoggedIn(true);
        setAdminUser({
          name: adminData.username || 'Admin_01',
          email: adminData.email,
          role: 'SUPERUSER',
          badge: 'A1',
          clearanceLevel: 5
        });
        sessionStorage.setItem('pocket_odyssey_isAdmin', 'true');
        localStorage.setItem('pocket_odyssey_isAdmin', 'true');
        showAdminToast(`🔑 Clearance Verified: ${adminData.username}`, 'success');
        return { success: true };
      }
    } catch (e) {
      console.warn('Supabase admin check fallback:', e);
    }

    // Invalid credentials
    showAdminToast('⛔ Access Denied: Invalid Clearance Key', 'error');
    return { success: false, error: 'Invalid Admin Identifier or Security Clearance Code.' };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('pocket_odyssey_isAdmin');
      localStorage.removeItem('pocket_odyssey_isAdmin');
    } catch (e) {
      console.warn(e);
    }
    showAdminToast('🔒 Command Center Session Terminated.', 'info');
  };

  const loginAsAdmin = (customAdmin) => {
    setIsLoggedIn(true);
    setIsAdminLoggedIn(true);
    const profile = {
      id: customAdmin?.id || 'admin-local',
      name: customAdmin?.name || 'Admin_01',
      email: customAdmin?.email || 'admin@travelcraft.com',
      avatar: customAdmin?.avatar || '🛡️',
      role: 'Admin',
      coins: 9999,
      level: 99,
      badges: ['Master Admin', 'System Lord'],
      visitedCount: 99
    };
    setUserProfile(profile);
    setAdminUser({
      name: profile.name,
      email: profile.email,
      role: 'SUPERUSER',
      badge: 'A1',
      clearanceLevel: 5
    });
    try {
      localStorage.setItem('pocket_odyssey_isAdmin', 'true');
      sessionStorage.setItem('pocket_odyssey_isAdmin', 'true');
    } catch (e) {
      console.warn(e);
    }
    showAdminToast('🛡️ Welcome, Admin_01! Command Center unlocked.', 'success');
    setCurrentPage('home');
  };

  const loginAsTrainer = (customTrainer) => {
    setIsLoggedIn(true);
    setIsAdminLoggedIn(false);
    setUserProfile({
      id: customTrainer?.id || 'trainer-local',
      name: customTrainer?.name || 'Ash K.',
      email: customTrainer?.email || '',
      avatar: customTrainer?.avatar || '🧢',
      role: customTrainer?.role || 'Cartographer',
      coins: 1245,
      level: 1,
      badges: ['Pioneer'],
      visitedCount: 4
    });
    try {
      localStorage.removeItem('pocket_odyssey_isAdmin');
      sessionStorage.removeItem('pocket_odyssey_isAdmin');
    } catch (e) {
      console.warn(e);
    }
    setCurrentPage('home');
  };

  const signInWithOAuth = async (provider) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const scopes = provider === 'facebook' ? 'email public_profile' : 'email profile';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = () => signInWithOAuth('google');
  const signInWithFacebook = () => signInWithOAuth('facebook');

  const login = (e) => {
    if (e) e.preventDefault();
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    setIsLoggedIn(false);
    setIsAdminLoggedIn(false);
    setUserProfile(null);
    try {
      localStorage.removeItem('pocket_odyssey_isAdmin');
      sessionStorage.removeItem('pocket_odyssey_isAdmin');
    } catch (e) {
      console.warn(e);
    }
    setAuthMode('login');
    setCurrentPage('auth');
  };

  const navigateTo = (page, location = null) => {
    if (location) {
      setSelectedLocation(location);
    }
    if (page !== 'map' || !activeCommunityMap) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        console.warn('URL sync skipped:', e);
      }
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        editorSetup,
        setEditorSetup,
        authMode,
        setAuthMode,
        themeMode,
        setThemeMode,
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        languages,
        t,
        isLoggedIn,
        setIsLoggedIn,
        userProfile,
        setUserProfile,
        updateUserRole,
        updateUserBadges,
        updateUsername,
        selectedLocation,
        setSelectedLocation,
        mapBackgroundImage,
        setMapBackgroundImage,
        resetMapBackgroundImage,
        mapCanvasStyle,
        setMapCanvasStyle,
        mapElements,
        mapPins,
        setMapPins,
        selectedPin,
        setSelectedPin,
        communityMaps,
        activeCommunityMap,
        setActiveCommunityMap,
        trackMapOnWorldMap,
        publishMapToCommunity,
        deleteCommunityMap,
        saveEditorMapState,
        registerEditorDraft,
        addCustomPin,
        deleteCustomPin,
        favorites,
        toggleFavorite,
        mapFilters,
        toggleFilter,
        login,
        loginAsAdmin,
        loginAsTrainer,
        logout,
        signInWithOAuth,
        signInWithGoogle,
        signInWithFacebook,
        navigateTo,
        isAuthLoading,
        // Admin exports
        adminActiveTab,
        setAdminActiveTab,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminUser,
        adminLogin,
        adminLogout,
        baseMaps,
        setBaseMaps,
        trainers,
        setTrainers,
        reportedLocations,
        setReportedLocations,
        globalSettings,
        setGlobalSettings,
        adminToast,
        showAdminToast,
        resolveReport,
        hideReportedLocation,
        deleteReportedLocation,
        warnTrainer,
        banTrainer,
        unbanTrainer,
        changeTrainerRole,
        addBaseMap,
        deleteBaseMap,
        updateGlobalSettings,
        notifications,
        unreadCount,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
