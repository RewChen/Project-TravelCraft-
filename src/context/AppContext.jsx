import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translations, languages } from '../i18n';
import { fetchMapFeed, fetchMapById, upsertMap, deleteMapRow, mapRowToItem, mapItemSummary } from '../lib/supabaseMaps';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadViewCounts, readLocalViewCounts, recordMapView, effectiveRarity } from '../lib/mapViews';
import {
  fetchGlobalSettings,
  saveGlobalSettings,
  fetchReports,
  insertReport,
  updateReportStatus,
  deleteReportRow,
  deleteReportsByLocation,
  deleteReportsByMap,
  reportRowToItem,
  upsertAdminBaseMap,
  fetchAdminBaseMaps,
  deleteBaseMapRow
} from '../lib/supabaseAdmin';
import { deleteMapAssets } from '../lib/supabaseUploads';
import { uploadAvatar } from '../lib/supabaseAvatar';
import { fetchReviews, insertReview, updateReviewStatus, setReviewPinned, deleteReviewRow, bumpReviewCounter, rowToReview } from '../lib/supabaseReviews';
import { fileToDataUrl, compressForUpload, isImageSrc, resolveCardBackground } from '../lib/imageUtils';
import {
  fetchUserAssets,
  insertUserAsset,
  deleteUserAsset,
  uploadUserAssetFile,
  dataUrlToFile
} from '../lib/supabaseUserAssets';
import { derivePinsFromElements, scaleElementPositions, scaleElementFontSizes, resolvePinOverlaps, buildRoutePaths } from '../lib/editorCanvas';

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

const initialGlobalSettings = {
  maxPinsPerMap: 50,
autoApproveCommunity: false,
  // รีวิวขึ้นทันทีโดยไม่ต้องรออนุมัติ (admin ซ่อน/ลบทีหลังได้) — ตั้ง false เพื่อกลับไปใช้คิวตรวจสอบ
  autoApproveReviews: false,
      maintenanceMode: false,
      allowFastTravel: true,
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
  let truncated = false;
  for (const key of ['imageUrl', 'bgThemeUrl', 'previewBackground', 'selfieUrl', 'videoUrl']) {
    if (typeof clone[key] === 'string' && clone[key].startsWith('data:')) { clone[key] = null; truncated = true; }
  }
  if (Array.isArray(clone.selfieUrls)) {
    clone.selfieUrls = clone.selfieUrls.map((u) => {
      if (typeof u === 'string' && u.startsWith('data:')) { truncated = true; return null; }
      return u;
    });
  }
  if (clone.details && typeof clone.details === 'object') {
    clone.details = stripMediaFromMap(clone.details);
  }
  if (clone.editorState) { delete clone.editorState; truncated = true; }
  // Flag truncated snapshots so deep-link hydration knows to refetch the full
  // row from Supabase instead of trusting the incomplete local copy.
  if (truncated) clone._snapshotTruncated = true;
  return clone;
};

const serializeCommunityMapsForStorage = (items, trimMedia) =>
  Array.isArray(items) ? (trimMedia ? items.map(stripMediaFromMap) : items) : items;

// Session cache of fully-computed map views (element layer + pins + background)
// so reopening a map in the same session skips the network fetch and the
// element/pin derivation work entirely. Cleared on editor save/publish/delete
// and naturally resets on app reload, where localStorage snapshots are trimmed.
const sessionMapViewCache = new Map();

// Recursively replace embedded media data URLs with null so a snapshot can be
// squeezed into localStorage without dropping the map metadata.
const stripDataUrls = (value) => {
  if (typeof value === 'string') return value.startsWith('data:') ? null : value;
  if (Array.isArray(value)) return value.map(stripDataUrls);
  if (value && typeof value === 'object') {
    const next = {};
    for (const key of Object.keys(value)) next[key] = stripDataUrls(value[key]);
    return next;
  }
  return value;
};

export const AppProvider = ({ children }) => {
  // Navigation State: 'home', 'community', 'map', 'details', 'mymaps', 'profile', 'auth', 'admin'
  const [currentPage, setCurrentPage] = useState('home');
  const [editorSetup, setEditorSetup] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('project_travelcraft_themeMode');
      if (!storedTheme) return 'light';
      // persistSnapshot stores JSON.stringify(themeMode); tolerate legacy raw values too.
      const parsed = JSON.parse(storedTheme);
      return parsed === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [language, setLanguageState] = useState(() => {
    try {
      const storedLang = localStorage.getItem('project_travelcraft_language');
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
        const bc = new BroadcastChannel('project_travelcraft_lang');
        bc.postMessage({ language: code });
        bc.close();
      } catch {
        // BroadcastChannel unsupported in this browser
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'th' : 'en';
      try {
        const bc = new BroadcastChannel('project_travelcraft_lang');
        bc.postMessage({ language: next });
        bc.close();
      } catch {
        // BroadcastChannel unsupported in this browser
      }
      return next;
    });
  }, []);

  // Cross-tab / cross-dashboard language sync: storage event + BroadcastChannel fallback.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'project_travelcraft_language' && e.newValue && translations[e.newValue] && e.newValue !== language) {
        setLanguageState(e.newValue);
      }
      if (e.key === 'project_travelcraft_themeMode' && e.newValue) {
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
      bc = new BroadcastChannel('project_travelcraft_lang');
      bc.onmessage = (ev) => {
        if (ev.data?.language && translations[ev.data.language] && ev.data.language !== language) {
          setLanguageState(ev.data.language);
        }
      };
    } catch {
      // BroadcastChannel unsupported in this browser
    }
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [language, themeMode]);

  // LocalStorage Helper Read
  const loadStored = (key, fallback) => {
    try {
      const stored = localStorage.getItem(`project_travelcraft_${key}`);
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
      return localStorage.getItem('project_travelcraft_userRole') || null;
    } catch {
      return null;
    }
  };

  const getStoredBadges = () => {
    try {
      const raw = localStorage.getItem('project_travelcraft_badges');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getStoredAvatar = () => {
    try {
      const raw = localStorage.getItem('project_travelcraft_profile_avatar');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Persist badges locally so they survive a reload on this device.
  const updateUserBadges = (badges) => {
    const next = Array.isArray(badges) ? badges : [];
    setUserProfile((prev) => (prev ? { ...prev, badges: next } : prev));
    try {
      localStorage.setItem('project_travelcraft_badges', JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  // Role names users may self-assign. 'Admin' is only granted server-side
  // (admins table or an admin-issued update), never via this client path.
  const SELF_ASSIGNABLE_ROLES = ['Novice Traveler', 'Cartographer', 'Gym Leader', 'Game Master'];

  // Persist the chosen role so it survives reload and syncs to Supabase when signed in.
  const updateUserRole = async (role) => {
    const normalized = SELF_ASSIGNABLE_ROLES.find((r) => r.toLowerCase() === String(role).trim().toLowerCase());
    if (!normalized) return { success: false, error: 'forbidden' };
    setUserProfile((prev) => (prev ? { ...prev, role: normalized } : { role: normalized, name: 'Traveler' }));
    try {
      localStorage.setItem('project_travelcraft_userRole', normalized);
    } catch (err) {
      console.warn(err);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: true };
      const { error } = await supabase.rpc('update_own_role', { p_role: normalized });
      if (error) console.warn('Role sync skipped:', error);
    } catch (err) {
      console.warn('Role sync skipped:', err);
    }
    return { success: true };
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

  // Persist a new avatar image: compress -> Supabase Storage public URL ->
  // users.avatar column + auth user_metadata (keeps profile payloads tiny).
  // Falls back to a local base64 data URL when there is no Supabase session.
  const updateUserAvatar = useCallback(async (file) => {
    const uid = userProfile?.id;
    if (!uid || !file) return { success: false, error: 'invalid' };
    let avatarValue = '';
    try {
      const url = await uploadAvatar(uid, file);
      if (url) avatarValue = url;
    } catch (err) {
      console.warn('Avatar storage upload skipped, falling back to base64:', err);
    }
    if (!avatarValue) {
      // Never persist a raw multi-MB base64: shrink to a 256px thumbnail first.
      const small = await compressForUpload(file, { maxWidth: 256, quality: 0.8 }, 'webp');
      avatarValue = await fileToDataUrl(small || file);
      if (!avatarValue) return { success: false, error: 'upload' };
    }
    try {
      localStorage.setItem('project_travelcraft_profile_avatar', JSON.stringify(avatarValue));
    } catch (e) {
      console.warn('Avatar localStorage write failed:', e);
    }
    setUserProfile((prev) => (prev && prev.id === uid ? { ...prev, avatar: avatarValue } : prev));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('users')
          .update({ avatar: avatarValue })
          .eq('id', uid);
        if (error) console.warn('Avatar DB update rejected:', error);
        await supabase.auth.updateUser({ data: { avatar: avatarValue } }).catch(() => {});
      }
    } catch (err) {
      console.warn('Avatar DB sync skipped:', err);
    }
    return { success: true, url: avatarValue };
  }, [userProfile?.id]);

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
      level: 1,
      badges: getStoredBadges(),
      visitedCount: 0
    };
  };

  // Admin access is verified server-side only (admins table / users.role via
  // fetchUserProfile). Never trust the client flag on boot.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(() => loadStored('adminUser', {
    name: 'Admin_01',
    email: 'admin@travelcraft.com',
    role: 'SUPERUSER',
    badge: 'A1',
    clearanceLevel: 5
  }));

  // One-time migration: existing avatars stored as base64 data URLs are moved
  // to Supabase Storage on the user's next profile load so future payloads are
  // tiny URLs instead of multi-MB text blobs.
  const migrateLegacyAvatar = useCallback(async (uid, avatar) => {
    if (!uid || typeof avatar !== 'string' || !avatar.startsWith('data:image')) return;
    try {
      const file = dataUrlToFile(avatar, 'avatar');
      if (!file) return;
      const url = await uploadAvatar(uid, file);
      if (!url) return;
      await supabase.from('users').update({ avatar: url }).eq('id', uid);
      await supabase.auth.updateUser({ data: { avatar: url } }).catch(() => {});
      try {
        localStorage.setItem('project_travelcraft_profile_avatar', JSON.stringify(url));
      } catch {
        // ignore storage failures
      }
      setUserProfile((prev) => (prev && prev.id === uid ? { ...prev, avatar: url } : prev));
    } catch (err) {
      console.warn('Legacy avatar migration skipped:', err);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      // 1. Authoritative server-side lookup (bypasses RLS, works whether the
      // admin flag lives in admins OR users.role).
      const { data: access, error: accessError } = await supabase.rpc('my_access');
      if (!accessError && access) {
        const isAdmin = access.is_admin === true;
        const storedAvatar = getStoredAvatar();
        const avatar = storedAvatar || access.avatar || (isAdmin ? '🛡️' : '🏃');
        setIsAdminLoggedIn(isAdmin);
        setUserProfile({
          id: userId,
          name: access.username || 'Traveler',
          email: access.email || '',
          avatar,
          role: isAdmin ? 'Admin' : (getStoredRole() || access.role || 'Cartographer'),
          level: isAdmin ? 99 : 1,
          badges: isAdmin
            ? ['Master Admin', 'System Lord']
            : (getStoredBadges().length ? getStoredBadges() : ['Pioneer', 'Kyoto Explorer']),
          visitedCount: isAdmin ? 99 : 14
        });
        if (avatar?.startsWith('data:image')) {
          migrateLegacyAvatar(userId, avatar);
        }
        if (isAdmin) {
          setAdminUser({
            name: access.username || 'Admin_01',
            email: access.email || 'admin@travelcraft.com',
            role: 'SUPERUSER',
            badge: 'A1',
            clearanceLevel: 5
          });
        }
        return;
      }

      if (accessError) {
        // Diagnose: RPC is missing (migration not run) or failing server-side.
        console.warn('my_access() failed, falling back to table reads:', accessError);
      }

      // 2. Fallback: legacy table reads (only when the RPC is unavailable).
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
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const isAdmin = data.role?.toLowerCase() === 'admin';
        const loadedBadges = getStoredBadges();
        const storedAvatar = getStoredAvatar();
        // Prefer the avatar set in this browser (most recent), fall back to DB value.
        const avatar = storedAvatar || data.avatar || (isAdmin ? '🛡️' : '🏃');
        setIsAdminLoggedIn(isAdmin);
        setUserProfile({
          id: userId,
          name: data.username,
          email: data.email,
          avatar,
          role: isAdmin ? 'Admin' : (getStoredRole() || data.role || 'Cartographer'),
          level: 1,
          badges: loadedBadges.length ? loadedBadges : (Array.isArray(data.badges) ? data.badges : ['Pioneer', 'Kyoto Explorer']),
          visitedCount: 14
        });
        // One-time migration: base64 avatars -> Storage URLs so profile payloads stay tiny.
        if (avatar?.startsWith('data:image')) {
          migrateLegacyAvatar(userId, avatar);
        }
        if (isAdmin) {
          setAdminUser({
            name: data.username,
            email: data.email,
            role: 'SUPERUSER',
            badge: 'A1',
            clearanceLevel: 5
          });
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
        level: 1, badges: getStoredBadges(), visitedCount: 0
      });
    }
  };

  // Safe reference for the early auth listener (registered before `navigateTo`
  // is declared below) without triggering the immutability guard.
  const navigateToRef = useRef(null);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          setUserProfile(createFallbackProfile(session.user));
          await fetchUserProfile(session.user.id);
        } else {
          const saved = loadStored('session', null);
          if (saved && saved.profile) {
            const storedAvatar = getStoredAvatar();
            setIsLoggedIn(true);
            setIsAdminLoggedIn(saved.type === 'admin');
            setUserProfile(storedAvatar ? { ...saved.profile, avatar: storedAvatar } : saved.profile);
            if (saved.adminUser) {
              setAdminUser(saved.adminUser);
            }
          } else {
            setIsLoggedIn(false);
            setUserProfile(null);
          }
        }
      } catch {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      setIsAuthLoading(false); // Done loading
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        navigateToRef.current?.('auth');
        return;
      }
      if (session) {
        setIsLoggedIn(true);
        setUserProfile(createFallbackProfile(session.user));
        await fetchUserProfile(session.user.id);
      } else {
        // Do not wipe local (non-Supabase) sessions restored from storage on SIGNED_OUT / INITIAL_SESSION events.
        const saved = loadStored('session', null);
        if (!(saved && saved.profile)) {
          setIsLoggedIn(false);
          setUserProfile(null);
        }
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
  const [mapCanvasWidth, setMapCanvasWidth] = useState(null);
  const [mapCanvasHeight, setMapCanvasHeight] = useState(null);
  const [mapElements, setMapElements] = useState([]);
  const [mapRoutes, setMapRoutes] = useState([]);
  const [navStartId, setNavStartId] = useState(null);
  const [navEndId, setNavEndId] = useState(null);
  const [favorites, setFavorites] = useState(() => loadStored('favorites', ['Eiffel Tower']));
  const [communityMaps, setCommunityMaps] = useState(() => loadStored('communityMaps', initialCommunityDiscoveries));
  const [activeCommunityMap, setActiveCommunityMap] = useState(null);

  // Per-user saved editor Elements & Backgrounds (DB when signed in, localStorage for guests).
  const USER_ASSETS_KEY = 'project_travelcraft_userAssets';
  const [userAssets, setUserAssets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_ASSETS_KEY)) || [];
    } catch {
      return [];
    }
  });
  const persistLocalAssets = (assets) => {
    try {
      localStorage.setItem(USER_ASSETS_KEY, JSON.stringify(assets));
    } catch {
      // ignore quota failures
    }
  };
  // Keep localStorage mirror in sync for guest/offline reads.
  useEffect(() => {
    persistLocalAssets(userAssets);
  }, [userAssets]);

  const userAssetsRef = useRef(userAssets);
  useEffect(() => {
    userAssetsRef.current = userAssets;
  }, [userAssets]);

  // Migrate guest assets (data URLs in localStorage) into storage + DB once signed in.
  const loadUserAssets = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const dbAssets = await fetchUserAssets(uid);
      const guestAssets = userAssetsRef.current.filter((a) => String(a.url || '').startsWith('data:'));
      if (guestAssets.length) {
        const migrated = [];
        for (const asset of guestAssets) {
          const file = dataUrlToFile(asset.url, asset.label);
          if (!file) continue;
          try {
            const url = await uploadUserAssetFile(uid, asset.asset_type, file);
            const row = await insertUserAsset(uid, { type: asset.asset_type, label: asset.label, url });
            if (row) migrated.push(row);
          } catch {
            // keep going without this row
          }
        }
        setUserAssets(() => [...migrated, ...(dbAssets || [])]);
        localStorage.removeItem(USER_ASSETS_KEY);
      } else {
        setUserAssets(dbAssets || []);
      }
    } catch {
      // Offline / RLS failure: keep whatever is local.
    }
  }, []);

  // Save an uploaded element/background for the current user.
  // Signed in -> store file in Supabase Storage + a user_assets row.
  // Guest/offline  -> keep data URL in the localStorage library.
  const addUserAsset = useCallback(async ({ type, label, file, content }) => {
    const uid = userProfile?.id;
    const cleanLabel = String(label || (file && file.name) || 'asset');
    if (uid) {
      try {
        const url = await uploadUserAssetFile(uid, type, file);
        const row = await insertUserAsset(uid, { type, label: cleanLabel, url });
        if (row) setUserAssets((previous) => [row, ...previous]);
        return row;
      } catch {
        // Storage/DB unavailable: degrade to a local data URL for this session.
      }
    }
    let localUrl = content || '';
    if (!localUrl && file) {
      try {
        localUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch {
        localUrl = '';
      }
    }
    const fallback = {
      id: `guest-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      user_id: uid || 'guest',
      asset_type: type,
      label: cleanLabel,
      url: localUrl,
      created_at: new Date().toISOString()
    };
    setUserAssets((previous) => [fallback, ...previous]);
    return fallback;
  }, [userProfile]);

  // Remove an asset from the library (DB row + local list). The storage file is
  // intentionally kept so published maps that embed the URL keep rendering.
  const removeUserAsset = useCallback(async (asset) => {
    setUserAssets((previous) => previous.filter((a) => a.id !== asset.id));
    try {
      if (String(asset.url || '').startsWith('data:')) return;
      await deleteUserAsset(asset.id);
    } catch {
      // RLS/offline failure is non-fatal; local removal already applied.
    }
  }, []);

  // Hydrate the per-user asset library once auth resolves.
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        await loadUserAssets(session.user.id);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading]);

  // Persist a map to Supabase. Returns a status so callers can tell the user
  // whether the map really reached the database:
  //   'saved'  -> written to Supabase
  //   'guest'  -> no session; RLS would reject the write
  //   'error'  -> Supabase call failed
  //   'skipped'-> no id
  const persistMapToDb = async (item) => {
    if (!item?.id) return { status: 'skipped' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { status: 'guest' };
      const result = await upsertMap(item);
      if (result?.degraded) return { status: 'degraded' };
      return { status: 'saved' };
    } catch (err) {
      console.warn('Supabase map sync failed:', err?.message || err);
      return { status: 'error', message: err?.message || 'Unknown error' };
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

  // Once auth is resolved, hydrate community maps with a lightweight feed
  // (summary rows only); full map data is fetched on demand via fetchMapById.
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateMapsFromDb = async () => {
      try {
        const dbMaps = await fetchMapFeed();
        if (cancelled) return;
        setCommunityMaps((previous) => {
          const merged = [];
          const seen = new Set();
          const toMs = (value) => {
            const n = Number(value);
            if (value !== null && value !== '' && Number.isFinite(n)) return n;
            const t = Date.parse(value);
            return Number.isFinite(t) ? t : 0;
          };
          for (const dbMap of dbMaps) {
            if (seen.has(dbMap.id)) continue;
            const localItem = previous.find((item) => item.id === dbMap.id);
            // Keep a full local copy when it is at least as fresh as the DB row.
            if (localItem && !localItem._summaryOnly && toMs(localItem.updatedAt) >= toMs(dbMap.updatedAt)) {
              seen.add(dbMap.id);
              merged.push(localItem);
              continue;
            }
            seen.add(dbMap.id);
            merged.push(dbMap);
          }
          for (const localItem of previous) {
            if (seen.has(localItem.id)) continue;
            // Keep only hardcoded seed data (comm-1, comm-2, ...). Everything
            // else that no longer exists in the DB is dropped so deleted maps
            // are never resurrected from the localStorage cache.
            if (String(localItem.id).startsWith('comm-') && !String(localItem.id).startsWith('comm-user-')) {
              seen.add(localItem.id);
              merged.push(localItem);
              continue;
            }
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

  // Admin access is verified server-side only (admins table / users.role via
  // fetchUserProfile). Never trust the client flag on boot.
  const [adminActiveTab, setAdminActiveTab] = useState('overview'); // 'overview', 'basemaps', 'settings', 'users', 'reports'
  const [baseMaps, setBaseMaps] = useState(() =>
    isSupabaseConfigured ? [] : loadStored('adminBaseMaps', initialBaseMaps)
  );
  const [trainers, setTrainers] = useState(() => loadStored('adminTrainers', initialTrainers));
  const [reportedLocations, setReportedLocations] = useState([]);
  // Location reviews & ratings (status: 'pending' | 'approved' | 'hidden').
  // Submitted by travelers from the Details page, moderated in Admin → Reviews.
  const [reviews, setReviews] = useState(() => loadStored('reviews', []));
  const [globalSettings, setGlobalSettings] = useState(() => loadStored('adminSettings', initialGlobalSettings));
  const [adminToast, setAdminToast] = useState(null);

  // Notifications — bell button dropdown (persists locally)
  // data.page / data.mapId drive the deep-link destination in the Header.
  const initialNotifications = [
    { id: 'n1', titleKey: 'notifications.demo1Title', messageKey: 'notifications.demo1Msg', time: '2m ago', read: false, icon: '🗺️', data: { page: 'community' } },
    { id: 'n2', titleKey: 'notifications.demo2Title', messageKey: 'notifications.demo2Msg', time: '1h ago', read: false, icon: '📸', data: { page: 'mymaps' } },
    { id: 'n3', titleKey: 'notifications.demo3Title', messageKey: 'notifications.demo3Msg', time: '1d ago', read: true, icon: '✨', data: { page: 'home' } },
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
    if (!isAdminLoggedIn) return undefined; // full registry is admin-only (RLS hides other rows anyway)
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
  }, [isAuthLoading, isAdminLoggedIn]);

  // Hydrate global settings from Supabase (single-row table). Falls back to
  // localStorage defaults when offline or the table does not exist yet.
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateSettingsFromDb = async () => {
      try {
        const row = await fetchGlobalSettings();
        if (cancelled || !row) return;
        setGlobalSettings((prev) => {
          const next = { ...prev };
          if (row.max_pins_per_map != null) next.maxPinsPerMap = row.max_pins_per_map;
          if (row.auto_approve_community != null) next.autoApproveCommunity = row.auto_approve_community;
          if (row.auto_approve_reviews != null) next.autoApproveReviews = row.auto_approve_reviews;
          if (row.maintenance_mode != null) next.maintenanceMode = row.maintenance_mode;
          if (row.allow_fast_travel != null) next.allowFastTravel = row.allow_fast_travel;
          if (row.auto_ban_strike_threshold != null) next.autoBanStrikeThreshold = row.auto_ban_strike_threshold;
          if (row.server_region != null) next.serverRegion = row.server_region;
          if (row.radar_radius_km != null) next.radarRadiusKm = Number(row.radar_radius_km);
          return next;
        });
      } catch (err) {
        console.warn('Global settings hydration skipped:', err);
      }
    };
    hydrateSettingsFromDb();
    return () => { cancelled = true; };
  }, [isAuthLoading]);

  // Hydrate reported locations from the real reports table. Admin view is DB-pure:
  // only rows that exist in Supabase appear (no mock or offline-only entries).
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateReportsFromDb = async () => {
      try {
        const rows = await fetchReports();
        if (cancelled) return;
        const mapped = rows.map(reportRowToItem);
        setReportedLocations(mapped);
      } catch (err) {
        console.warn('Reports hydration skipped:', err);
      }
    };
    hydrateReportsFromDb();
    return () => { cancelled = true; };
  }, [isAuthLoading]);

  // Hydrate base maps straight from their own base_maps table.
  // Not gated on admin login: base maps are public rows and reading them here
  // keeps "Manage Base Maps" honest — no ghost seed rows when the DB is empty.
  useEffect(() => {
    if (isAuthLoading) return undefined;
    let cancelled = false;
    const hydrateBaseMapsFromDb = async () => {
      if (!isSupabaseConfigured) {
        setBaseMaps(initialBaseMaps);
        return;
      }
      try {
        const rows = await fetchAdminBaseMaps();
        if (cancelled) return;
        const mapped = (rows || []).map((row) => {
          const s = row.summary || {};
          const d = row.data || {};
          return {
            id: row.id,
            ownerId: row.owner_id,
            name: s.title || d.name || row.title || 'Untitled Map',
            theme: d.theme || 'Plains & Forest',
            region: d.region || s.region || 'Unknown Region',
            image: s.imageUrl || d.image || null,
            description: d.description || s.lore || 'Curated base map',
            badge: 'BASE',
            pinsCount: s.pinCount || 0,
            rating: 5.0,
            createdAt: row.created_at || null
          };
        });
        setBaseMaps(mapped);
      } catch (err) {
        console.warn('Base maps DB read failed; restoring local list:', err);
        setBaseMaps(loadStored('adminBaseMaps', initialBaseMaps));
      }
    };
    hydrateBaseMapsFromDb();
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
            addNotification({ titleKey: 'notifications.mapDeletedTitle', messageKey: 'notifications.mapDeletedMsg', icon: '🗑️', data: { page: 'community' } });
          }
          return;
        }
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (!row) return;
          // Realtime carries a lean column set (see `select` below) because the
          // full `data` JSONB can be multi-MB with base64 media. Rebuild the card
          // shape from the summary instead of shipping that blob per subscriber.
          const item = summaryToItem(row);
          const isOwn = row.owner_id && currentUserIdRef.current && row.owner_id === currentUserIdRef.current;
          setCommunityMaps((prev) => {
            const idx = prev.findIndex((m) => m.id === item.id);
            if (idx >= 0) {
              const existing = prev[idx];
              const next = [...prev];
              if (existing && !existing._summaryOnly && item._summaryOnly) {
                // Never downgrade a full local copy (logs/selfies/editorState)
                // with a lean summary row — refresh only the card-level metadata.
                const { details, _summaryOnly, ...cardMeta } = item;
                next[idx] = { ...existing, ...cardMeta };
              } else {
                next[idx] = { ...existing, ...item };
              }
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

    // Trainer registry live sync + new-user notifications are admin-only.
    let usersChannel = null;
    if (isAdminLoggedIn) {
      usersChannel = supabase
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
                  data: { page: 'admin' },
                });
              }
            }
          } catch (e) {
            console.warn('users live sync skipped:', e);
          }
        })
        .subscribe();
    }

    // Reviews live sync — new/updated/hidden reviews flow into the UI without a reload.
    // Realtime deliveries respect RLS, so guests/others only see rows they may read.
    const reviewsChannel = supabase
      .channel('reviews-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) setReviews((prev) => prev.filter((r) => r.id !== deletedId));
          return;
        }
        const row = payload.new;
        if (!row) return;
        const item = rowToReview(row);
        setReviews((prev) => {
          const idx = prev.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...item };
            return next;
          }
          return [item, ...prev];
        });
      })
      .subscribe();

    // Reports live sync — new location reports appear in the Admin Reported Locations
    // tab instantly. Realtime respects RLS, so only admins receive full rows.
    const reportsChannel = supabase
      .channel('reports-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) setReportedLocations((prev) => prev.filter((r) => r.id !== deletedId));
          return;
        }
        const row = payload.new;
        if (!row) return;
        const item = reportRowToItem(row);
        setReportedLocations((prev) => {
          const idx = prev.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...item };
            return next;
          }
          return [item, ...prev];
        });
        if (payload.eventType === 'INSERT' && isAdminLoggedIn) {
          const reporter = row.reporter_name || 'A Trainer';
          const isOwn = row.reporter_id === currentUserIdRef.current;
          if (!isOwn) {
            addNotification({
              titleKey: 'notifications.newReportTitle',
              messageKey: 'notifications.newReportMsg',
              titleParam: row.location_name || 'Location',
              messageParam: reporter,
              icon: '🚨',
              data: { page: 'admin' },
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (usersChannel) supabase.removeChannel(usersChannel);
      if (reviewsChannel) supabase.removeChannel(reviewsChannel);
      if (reportsChannel) supabase.removeChannel(reportsChannel);
    };
  }, [addNotification, isAdminLoggedIn]);

  const showAdminToast = (message, type = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 3500);
  };

  // Sync to LocalStorage on State Changes (Only non-auth data).
  // Debounced so typing/autosaves don't re-serialize the whole state on every
  // keystroke; flushed synchronously on pagehide so nothing is lost on close.
  const persistSnapshot = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const trimMedia = Boolean(session);
      localStorage.setItem('project_travelcraft_mapPins', JSON.stringify(mapPins));
      localStorage.setItem('project_travelcraft_mapBgImage', JSON.stringify(mapBackgroundImage));
      localStorage.setItem('project_travelcraft_favorites', JSON.stringify(favorites));
      localStorage.setItem('project_travelcraft_communityMaps', JSON.stringify(serializeCommunityMapsForStorage(communityMaps, trimMedia)));
      localStorage.setItem('project_travelcraft_adminBaseMaps', JSON.stringify(baseMaps));
      localStorage.setItem('project_travelcraft_adminTrainers', JSON.stringify(trainers));
      localStorage.setItem('project_travelcraft_adminSettings', JSON.stringify(globalSettings));
      localStorage.setItem('project_travelcraft_themeMode', JSON.stringify(themeMode));
      localStorage.setItem('project_travelcraft_language', language);
      localStorage.setItem('project_travelcraft_notifications', JSON.stringify(notifications));
      localStorage.setItem('project_travelcraft_reviews', JSON.stringify(reviews));
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') {
        // Storage is full (usually uploaded media stored as data URLs). Never
        // wipe the whole snapshot — retry with embedded media stripped so the
        // metadata (titles, pins, editor layout, favorites) still survives reloads.
        const forceTrimmedSave = (key, value) => {
          try {
            localStorage.setItem(key, JSON.stringify(stripDataUrls(value)));
          } catch {
            try {
              localStorage.removeItem(key);
            } catch {
              // nothing else to do
            }
          }
        };
        forceTrimmedSave('project_travelcraft_mapPins', mapPins);
        forceTrimmedSave('project_travelcraft_mapBgImage', mapBackgroundImage);
        forceTrimmedSave('project_travelcraft_communityMaps', serializeCommunityMapsForStorage(communityMaps, true));
        forceTrimmedSave('project_travelcraft_reviews', reviews);
        console.warn('LocalStorage quota reached; saved snapshot without embedded media.');
      } else {
        console.warn('LocalStorage save error:', err);
      }
    }
  }, [mapPins, mapBackgroundImage, favorites, communityMaps, baseMaps, trainers, globalSettings, themeMode, language, notifications, reviews]);

  const persistSnapshotRef = useRef(persistSnapshot);
  useEffect(() => {
    persistSnapshotRef.current = persistSnapshot;
  }, [persistSnapshot]);

  useEffect(() => {
    const timer = setTimeout(() => {
      persistSnapshotRef.current();
    }, 1200);
    return () => clearTimeout(timer);
  }, [persistSnapshot]);

  // Flush the debounced snapshot when the page is being closed/hidden.
  useEffect(() => {
    const flush = () => {
      persistSnapshotRef.current();
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('visibilitychange', flush);
    };
  }, []);

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

  // Location view counts (view count -> rarity). Mirrored in localStorage and
  // hydrated from the map_views table/RPC when available.
  const [mapViewCounts, setMapViewCounts] = useState(() => readLocalViewCounts());

  useEffect(() => {
    let cancelled = false;
    loadViewCounts()
      .then((counts) => {
        if (!cancelled) setMapViewCounts((prev) => ({ ...prev, ...counts }));
      })
      .catch((err) => console.warn('view counts hydrate skipped:', err));
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const viewCountFor = useCallback((location) => {
    const id = typeof location === 'string' ? location : location?.id;
    if (!id) return 0;
    return mapViewCounts[id] || 0;
  }, [mapViewCounts]);

  const effectiveRarityFor = useCallback((location) => {
    const id = typeof location === 'string' ? location : location?.id;
    const views = id ? (mapViewCounts[id] || 0) : 0;
    return effectiveRarity(location?.rarity, views);
  }, [mapViewCounts]);

  const trackLocationView = useCallback(async (location) => {
    const id = typeof location === 'string' ? location : location?.id;
    if (!id) return;
    try {
      const result = await recordMapView(id, currentUserIdRef.current);
      if (result?.counted) {
        setMapViewCounts((prev) => ({ ...prev, [id]: Math.max(prev[id] || 0, result.count || 0) }));
      }
    } catch (err) {
      console.warn('trackLocationView failed:', err);
    }
  }, []);

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
const resolvedPins = resolvePinOverlaps([newPin, ...mapPins]);
    setMapPins(resolvedPins);
    setSelectedPin(resolvedPins[0]);
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
    setMapCanvasWidth(null);
    setMapCanvasHeight(null);
    setMapElements([]);
    setMapRoutes([]);
    setNavStartId(null);
    setNavEndId(null);
    setMapPins(initialPins);
    setSelectedPin(initialPins[0]);
    setActiveCommunityMap(null);
  };

  // Launch Community Map onto the World Map View
  const [mapViewLoading, setMapViewLoading] = useState(false);
  // Tracks whether the user has previewed at least one map this session. The
  // World Map page stays hidden (blank) until a first map is opened.
  const [hasEverOpenedMap, setHasEverOpenedMap] = useState(false);
  // Stale-response guard for map preview taps: tracks the id of the map the
  // user most recently asked to open, so a slow fetch from an older tap never
  // clobbers the map opened by a newer one.
  const mapLoadToken = useRef(null);

  // Fetch the full map row (data JSONB) when only a summary row is available, or
  // when the local snapshot was truncated (media/editorState stripped to fit
  // localStorage), and cache the result back into communityMaps so subsequent
  // opens are instant.
  const resolveFullMap = useCallback(async (communityItem) => {
    if (!communityItem || (!communityItem._summaryOnly && !communityItem._snapshotTruncated)) return communityItem;
    try {
      const full = await fetchMapById(communityItem.id);
      if (full) {
        setCommunityMaps((previous) =>
          previous.some((item) => item.id === full.id)
            ? previous.map((item) => (item.id === full.id ? full : item))
            : [full, ...previous]
        );
        return full;
      }
    } catch (err) {
      console.warn('Full map fetch failed; using summary row:', err);
    }
    return communityItem;
  }, []);

  const trackMapOnWorldMap = useCallback(async (communityItem) => {
    if (!communityItem || !communityItem.id) return;
    const mapId = communityItem.id;
    // Mark this map as the latest preview target.
    mapLoadToken.current = mapId;

    // Navigate to the World Map instantly and show the loading overlay while
    // the full map data is fetched and derived in the background, instead of
    // stalling on the previous page during the network round-trip.
    setActiveCommunityMap(null);
    setMapElements([]);
    setMapRoutes([]);
    setNavStartId(null);
    setNavEndId(null);
    setMapPins([]);
    setSelectedPin(null);
    setMapBackgroundImage(null);
    setMapCanvasStyle(null);
    setMapCanvasWidth(null);
    setMapCanvasHeight(null);
    setMapViewLoading(true);
    setCurrentPage('map');
    try {
      window.history.replaceState(null, '', `#/map/${encodeURIComponent(mapId)}`);
    } catch (e) {
      console.warn('URL sync skipped:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const cached = sessionMapViewCache.get(mapId);
      const isFull = !communityItem._summaryOnly && !communityItem._snapshotTruncated;
      const item = (cached && isFull) ? communityItem : await resolveFullMap(communityItem);
      // A newer preview tap happened while we were loading — bail out quietly.
      if (!item || mapLoadToken.current !== mapId) return;

      setHasEverOpenedMap(true);
      setActiveCommunityMap(item);

      if (cached && isFull) {
        // Cache hit: reuse the derived element layer, pins, routes and background.
        if (cached.bg) {
          setMapBackgroundImage(cached.bg);
        } else {
          setMapBackgroundImage(null);
        }
        setMapCanvasStyle(cached.canvasStyle);
        setMapCanvasWidth(cached.canvasWidth || null);
        setMapCanvasHeight(cached.canvasHeight || null);
        setMapElements(cached.layerItems);
        setMapRoutes(cached.routes || []);
        setNavStartId(cached.navStartId || null);
        setNavEndId(cached.navEndId || null);
        setMapPins(cached.pins);
        setSelectedPin(null);
        return;
      }

      const editor = item.editorState || {};
      const preview = item.previewBackground || {};
      // Derive the world-map background from the SAME source the Community/Home
      // cards use (resolveCardBackground) so the map can never show a different
      // background than the card for that location. Image backgrounds (uploaded
      // photos / template art) are rendered as an <img> stretched to the square
      // canvas exactly like the editor's 4000x4000, so pinned elements line up.
      const cardStyle = resolveCardBackground(item) || null;
      let bg = null;
      let canvasStyle = null;
      const previewBgRaw = typeof preview.backgroundImage === 'string' ? preview.backgroundImage.trim() : '';
      const isPreviewImage = Boolean(previewBgRaw && previewBgRaw !== 'none' && !previewBgRaw.includes('gradient'));
      if (isPreviewImage) {
        const inner = previewBgRaw.match(/^url\(\s*["']?([^"')]+)["']?\s*\)/i);
        bg = inner ? inner[1] : previewBgRaw;
      } else if (cardStyle) {
        canvasStyle = cardStyle;
      }
      // Legacy maps published before previewBackground embedded the real image:
      // fall back to the editor's own background / bgThemeUrl.
      if (!bg && !canvasStyle) {
        const legacyImage = (typeof editor.backgroundImage === 'string' && editor.backgroundImage) ? editor.backgroundImage : (item.bgThemeUrl || null);
        if (isImageSrc(legacyImage)) {
          bg = legacyImage;
          canvasStyle = null;
        }
      }
      setMapBackgroundImage(bg);
      setMapCanvasStyle(canvasStyle);
      const canvasWidth = editor.canvasWidth || 4000;
      const canvasHeight = editor.canvasHeight || 4000;
      setMapCanvasWidth(canvasWidth);
      setMapCanvasHeight(canvasHeight);
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

      // Elements marked as Location become clickable pins on the map (the pin
      // marker is the element itself). Unmarked elements stay as decorations in
      // the element layer. Legacy maps (no element layer / no marked locations)
      // fall back to the stored pins so nothing regresses.
      const getPinLabel = (el) => (el.labelKey ? t(el.labelKey) : (el.label || el.content || 'Spot'));
      const hasMarkedLocations = layerItems.some((item) => item.element.isLocation === true);
      let pins = [];
      if (hasMarkedLocations) {
        pins = derivePinsFromElements(rawElements, rawPositions, getPinLabel);
      } else if (!layerItems.length) {
        pins = Array.isArray(item.pins) && item.pins.length ? item.pins : [];
        if (!pins.length && rawElements.length) {
          pins = derivePinsFromElements(rawElements, rawPositions, getPinLabel);
        }
      }
      const resolvedPins = resolvePinOverlaps(pins);
      setMapPins(resolvedPins);
      setSelectedPin(null);

      // Navigation routes: prefer the editor's ordered point lists (they
      // auto-follow moved pins); fall back to published percent paths.
      let computedRoutes = [];
      try {
        if (Array.isArray(editor.routes) && editor.routes.length) {
          computedRoutes = buildRoutePaths(editor.routes, scaledPositions);
        } else if (Array.isArray(item.routes) && item.routes.length) {
          computedRoutes = item.routes;
        }
         // Quick A → B navigation: explicit start pin and destination pin.
         const navStart = scaledPositions[editor.navStartId];
         const navEnd = scaledPositions[editor.navEndId];
         if (editor.navStartId && editor.navEndId && navStart && navEnd) {
           computedRoutes = [...computedRoutes, {
             id: 'nav-ab',
             name: 'A → B',
             color: '#16a34a',
             thickness: 6,
             points: [
               { x: (navStart.left || 0) + (navStart.width || 0) / 2, y: (navStart.top || 0) + (navStart.height || 0) / 2 },
               { x: (navEnd.left || 0) + (navEnd.width || 0) / 2, y: (navEnd.top || 0) + (navEnd.height || 0) / 2 }
             ]
           }];
         } else if (Array.isArray(item.navAB?.points) && item.navAB.points.length >= 2) {
           computedRoutes = [...computedRoutes, { id: 'nav-ab', name: 'A → B', color: '#16a34a', thickness: item.navAB.thickness || 6, points: item.navAB.points }];
         }
      } catch {
        computedRoutes = [];
      }
      setMapRoutes(computedRoutes);
      setNavStartId(editor.navStartId || null);
      setNavEndId(editor.navEndId || null);

      // Remember the computed view so reopening this map is instant.
      sessionMapViewCache.set(mapId, { layerItems, pins: resolvedPins, routes: computedRoutes, navStartId: editor.navStartId, navEndId: editor.navEndId, bg, canvasStyle, canvasWidth, canvasHeight });
    } finally {
      if (mapLoadToken.current === mapId) setMapViewLoading(false);
    }
  }, [t, resolveFullMap]);

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
      // setState inside the effect body. Summary rows are resolved to their
      // full data inside trackMapOnWorldMap.
      const timer = setTimeout(() => {
        trackMapOnWorldMap(item);
        setUrlMapId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    // Not in the local list yet (cold open / someone else's map): fetch directly.
    let cancelled = false;
    (async () => {
      let full = null;
      try {
        full = await fetchMapById(urlMapId);
      } catch {
        full = null;
      }
      if (cancelled) return;
      if (full) {
        setCommunityMaps((previous) =>
          previous.some((m) => m.id === full.id)
            ? previous.map((m) => (m.id === full.id ? full : m))
            : [full, ...previous]
        );
        trackMapOnWorldMap(full);
      }
      setUrlMapId(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [urlMapId, communityMaps, trackMapOnWorldMap]);

  // Persist the latest Map Editor state for a map owned by the current user.
  const saveEditorMapState = (mapId, editorState) => {
    if (!mapId || !editorState) return;
    // The map is being edited — the cached view is stale.
    sessionMapViewCache.delete(mapId);
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
        region: draft.locationCity || '',
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
  const publishMapToCommunity = async (newCommunityMap) => {
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
      imageUrl: newCommunityMap.imageUrl || null,
      videoUrl: newCommunityMap.videoUrl || null,
      previewBackground: newCommunityMap.previewBackground || null,
      isEditorMap: Boolean(newCommunityMap.isEditorMap),
      bgThemeUrl: newCommunityMap.bgThemeUrl || newCommunityMap.editorState?.backgroundImage || null,
      selfieUrl: newCommunityMap.selfieUrl || null,
      selfieUrls: newCommunityMap.selfieUrls || (newCommunityMap.selfieUrl ? [newCommunityMap.selfieUrl] : null),
      details: {
        title,
        region: newCommunityMap.region || '',
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
        privacy: newCommunityMap.privacy || 'public'
      },
      pins: newCommunityMap.pins || mapPins,
      tags: newCommunityMap.tags || [],
      privacy: newCommunityMap.privacy || 'public',
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
    // Republished maps carry fresh editor state — drop any cached view.
    if (rawId) sessionMapViewCache.delete(rawId);
    sessionMapViewCache.delete(uniqueId);
    const dbSave = await persistMapToDb(publishedItem);

    // Check whether the map actually reached the database. If it did not
    // (guest without a session, or a DB/RLS error), tell the user clearly so
    // they don't think others can see it yet.
    if (publishedItem.privacy === 'public') {
      if (dbSave?.status === 'error') {
        showAdminToast(`Map sync error: ${dbSave.message}`, 'error');
      } else if (dbSave?.status !== 'saved' && dbSave?.status !== 'degraded') {
        showAdminToast(t('map.publishLocalOnly'), 'warning');
      } else {
        showAdminToast(t('myMaps.publishedMsg', { title }), 'success');
        addNotification({ titleKey: 'notifications.publishedTitle', messageKey: 'notifications.publishedMsg', titleParam: title, icon: '🗺️', data: { mapId: uniqueId, page: 'community' } });
      }
      navigateTo('community');
    }
  };

  const isOwnMap = (mapItem) => {
    // Only the logged-in user's own maps count. Full editor rows are NOT
    // automatically "mine" — ownership is proven by ownerId (or by the
    // discoveredBy fallback for legacy rows that never got an owner).
    if (mapItem.ownerId) return mapItem.ownerId === userProfile?.id;
    return Boolean(userProfile) && mapItem.discoveredBy === userProfile?.name;
  };

  const deleteCommunityMap = (mapId, reason = '') => {
    const target = (communityMaps || []).find((map) => map.id === mapId);
    // กันไว้ชั้นนึง: ไม่ใช่ของตัวเองลบไม่ได้ (admin ใช้ adminDeleteCommunityMap แทน)
    if (!target || !isOwnMap(target)) return false;
    sessionMapViewCache.delete(mapId);
    setCommunityMaps((previous) => previous.filter((map) => !(map.id === mapId && isOwnMap(map))));
    deleteMapFromDb(mapId);
    deleteMapAssets(mapId);
    if (reason) console.info(`[moderation] Community map deleted: ${mapId} — reason: ${reason}`);
    return true;
  };

  // Admin moderation: remove ANY map from Community Discoveries regardless of ownership.
  const adminDeleteCommunityMap = (mapId, reason = '') => {
    sessionMapViewCache.delete(mapId);
    setCommunityMaps((previous) => previous.filter((map) => map.id !== mapId));
    deleteMapFromDb(mapId);
    deleteMapAssets(mapId);
    if (reason) console.info(`[moderation] Community map deleted by admin: ${mapId} — reason: ${reason}`);
  };

  // --- Admin Action Handlers ---
  const resolveReport = async (reportId) => {
    setReportedLocations((prev) =>
      prev.map((rep) =>
        rep.id === reportId ? { ...rep, status: 'resolved' } : rep
      )
    );
    try {
      await updateReportStatus(reportId, 'resolved');
    } catch (err) {
      console.warn('Resolve report DB write skipped:', err);
    }
    showAdminToast(t('admin.resolvedNoViolation'), 'success');
  };

  const deleteReportedLocation = async (reportId) => {
    setReportedLocations((prev) => prev.filter((rep) => rep.id !== reportId));
    try {
      await deleteReportRow(reportId);
    } catch (err) {
      console.warn('Delete report DB write skipped:', err);
    }
    showAdminToast(t('admin.reportDeleted'), 'error');
  };

  // Delete ALL report rows for a location at once (moderation cleanup).
  const deleteReportedLocationBatch = async (locationName) => {
    const lower = (locationName || '').toLowerCase();
    setReportedLocations((prev) =>
      prev.filter((rep) => (rep.locationName || '').toLowerCase() !== lower)
    );
    try {
      await deleteReportsByLocation(locationName);
      showAdminToast(t('admin.reportsDeleted'), 'success');
    } catch (err) {
      console.warn('Batch report delete DB write skipped:', err);
      showAdminToast(t('admin.reportDeleteFailed'), 'error');
    }
  };

  // Delete the reported COMMUNITY map (whole map + all its reports) in one go.
  const deleteReportedMap = async ({ id, mapId, locationName }) => {
    const mapKey = mapId || id || null;
    const lower = (locationName || '').toLowerCase();
    setReportedLocations((prev) =>
      prev.filter((rep) =>
        rep.id !== id &&
        (mapKey ? rep.mapId !== mapKey : true) &&
        (lower ? (rep.locationName || '').toLowerCase() !== lower : true)
      )
    );
    try {
      if (mapKey) adminDeleteCommunityMap(mapKey, 'Reported location removed');
      if (mapKey) {
        try { await deleteReportsByMap(mapKey); } catch (e) { console.warn('Delete reports by map skipped:', e); }
      }
      if (locationName) {
        try { await deleteReportsByLocation(locationName); } catch (e) { console.warn('Delete reports by location skipped:', e); }
      }
      showAdminToast(t('admin.reportMapDeleted'), 'success');
    } catch (err) {
      console.warn('Reported map delete DB write skipped:', err);
      showAdminToast(t('admin.reportMapDeleteFailed'), 'error');
    }
  };

  // Submit a new report from a trainer (world map / details page).
  const submitReport = useCallback(async ({ reporterId, reporterName, mapId, locationName, reason, details }) => {
    const saved = await insertReport({ reporterId, reporterName, mapId, locationName, reason, details });
    if (!saved) return false;
    const item = reportRowToItem(saved);
    setReportedLocations((prev) => [item, ...prev.filter((r) => r.id !== item.id)]);
    return true;
  }, []);

  // --- Location reviews & ratings ---
  // บังคับให้รีวิวใหม่ทุกอันเข้าคิว Pending เสมอ เพื่อให้ Admin ตรวจสอบก่อน
  const submitReview = useCallback(({ locationId, locationName, region, rating, text, images, gpsVerified }) => {
    const id = `REV-${Math.floor(10000 + Math.random() * 90000)}`;
    const autoApprove = globalSettings?.autoApproveReviews === true; // ต้องเปิดตั้งค่าชัดเจนถึงจะผ่าน (ค่าเริ่มต้นคือ false)
    const review = {
      id,
      locationId: locationId || locationName || 'unknown',
      locationName: locationName || 'Unknown location',
      region: region || '',
      authorId: userProfile?.id || null,
      authorName: userProfile?.name || userProfile?.username || 'Traveler',
      avatar: userProfile?.avatar || null,
      authorRole: userProfile?.role || 'Cartographer',
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      text: (text || '').trim(),
      images: Array.isArray(images) ? images.slice(0, 4) : [],
      status: autoApprove ? 'approved' : 'pending',
      pinned: false,
      reports: 0,
      helpful: 0,
      gpsVerified: Boolean(gpsVerified),
      createdAt: Date.now(),
    };
    setReviews((prev) => [review, ...prev]);
    insertReview(review).catch((err) => {
      console.warn('Review DB write skipped (offline/missing table):', err);
    });
    return review;
  }, [userProfile, globalSettings]);

  const approveReview = useCallback((reviewId) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status: 'approved' } : r)));
    showAdminToast('Review approved.', 'success');
    updateReviewStatus(reviewId, 'approved').catch((err) => console.warn('Review status DB write skipped:', err));
  }, []);

  const hideReview = useCallback((reviewId) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status: 'hidden' } : r)));
    showAdminToast('Review hidden.', 'warning');
    updateReviewStatus(reviewId, 'hidden').catch((err) => console.warn('Review status DB write skipped:', err));
  }, []);

  const unhideReview = useCallback((reviewId) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status: 'approved' } : r)));
    showAdminToast('Review restored.', 'success');
    updateReviewStatus(reviewId, 'approved').catch((err) => console.warn('Review status DB write skipped:', err));
  }, []);

  const togglePinReview = useCallback((reviewId) => {
    setReviews((prev) => {
      const target = prev.find((r) => r.id === reviewId);
      const nextPinned = !target?.pinned;
      if (target) {
        setReviewPinned(reviewId, nextPinned).catch((err) => console.warn('Review pin DB write skipped:', err));
      }
      return prev.map((r) => (r.id === reviewId ? { ...r, pinned: nextPinned } : r));
    });
  }, []);

  const deleteReview = useCallback((reviewId, reason = '') => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    showAdminToast('Review deleted.', 'error');
    if (reason) {
      console.info(`[moderation] Review deleted: ${reviewId} — reason: ${reason}`);
      try {
        const raw = localStorage.getItem('project_travelcraft_review_deletions');
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
          list.push({ id: reviewId, reason, date: Date.now() });
          localStorage.setItem('project_travelcraft_review_deletions', JSON.stringify(list));
        }
      } catch {
        // ข้ามเก็บ audit ได้ ไม่บล็อกการลบ
      }
    }
    deleteReviewRow(reviewId).catch((err) => console.warn('Review delete DB write skipped:', err));
  }, []);

  const reportReview = useCallback((reviewId) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reports: (r.reports || 0) + 1 } : r)));
    bumpReviewCounter(reviewId, 'reports').catch((err) => console.warn('Review report DB write skipped:', err));
  }, []);

  const voteHelpful = useCallback((reviewId) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r)));
    bumpReviewCounter(reviewId, 'helpful').catch((err) => console.warn('Review helpful DB write skipped:', err));
  }, []);

  // Hydrate shared reviews from Supabase (RLS returns approved + own + admin-all).
  // Merges DB rows with local-only rows (offline/demo reviews whose insert
  // never made it to the DB) so nothing vanishes. One-time backfill pushes the
  // current user's local-authored reviews into the DB (idempotent via flag).
  useEffect(() => {
    if (isAuthLoading) return;
    let cancelled = false;
    fetchReviews()
      .then((dbReviews) => {
        if (cancelled || !Array.isArray(dbReviews)) return;
        const dbIds = new Set(dbReviews.map((r) => r.id));
        setReviews((prev) => [...dbReviews, ...prev.filter((r) => !dbIds.has(r.id))]);
        if (userProfile?.id) {
          try {
            if (localStorage.getItem('reviews_backfilled') === 'true') return;
            const localMine = loadStored('reviews', []).filter(
              (r) => r.authorId === userProfile.id && !dbIds.has(r.id)
            );
            if (!localMine.length) {
              localStorage.setItem('reviews_backfilled', 'true');
              return;
            }
            Promise.all(localMine.map((r) => insertReview(r).catch(() => null))).then((res) => {
              if (!cancelled && res.every((x) => x !== null)) {
                try { localStorage.setItem('reviews_backfilled', 'true'); } catch { /* storage full */ }
              }
            });
          } catch (err) {
            console.warn('Review backfill skipped:', err);
          }
        }
      })
      .catch((err) => console.warn('Reviews DB hydration skipped:', err));
    return () => { cancelled = true; };
  }, [isAuthLoading, userProfile?.id]);

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

  const persistAdminUserUpdate = async (userId, patch) => {
    try {
      const { error } = await supabase.from('users').update(patch).eq('id', userId);
      if (error) {
        await supabase.rpc('admin_update_user_role', { p_user_id: userId, p_role: patch.role, p_status: patch.status });
      }
    } catch (err) {
      console.warn('User role/status DB write skipped:', err);
    }
  };

  const banTrainer = async (trainerIdentifier) => {
    const target = trainers.find((tr) => tr.id === trainerIdentifier || tr.name === trainerIdentifier);
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerIdentifier || tr.name === trainerIdentifier
          ? { ...tr, status: 'banned', role: 'Banned' }
          : tr
      )
    );
    if (target?.id) await persistAdminUserUpdate(target.id, { status: 'banned', role: 'Banned' });
    showAdminToast(`Trainer ${trainerIdentifier} has been BANNED.`, 'error');
  };

  const unbanTrainer = async (trainerId) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerId ? { ...tr, status: 'active', role: 'Member', strikes: 0 } : tr
      )
    );
    await persistAdminUserUpdate(trainerId, { status: 'active', role: 'Member' });
    showAdminToast('Trainer unbanned & reinstated.', 'success');
  };

  const changeTrainerRole = async (trainerId, newRole) => {
    setTrainers((prev) =>
      prev.map((tr) =>
        tr.id === trainerId ? { ...tr, role: newRole } : tr
      )
    );
    await persistAdminUserUpdate(trainerId, { role: newRole.toLowerCase() });
    showAdminToast(`Role updated to ${newRole}.`, 'success');
  };

  const addBaseMap = async (newMap, fixedId) => {
    const id = fixedId || `base-${Date.now()}`;
    const mapRow = {
      id,
      owner_id: userProfile?.id || null,
      title: newMap.name,
      privacy: 'public',
      is_editor_map: false,
      data: {
        name: newMap.name,
        theme: newMap.theme,
        region: newMap.region,
        image: newMap.image,
        description: newMap.description
      },
      summary: {
        title: newMap.name,
        imageUrl: newMap.image,
        region: newMap.region,
        theme: newMap.theme,
        pinCount: 0
      }
    };
    const uiItem = {
      id,
      badge: 'BASE',
      pinsCount: 0,
      rating: 5.0,
      description: 'A new frontier ready for trainer quests and cartography.',
      ...newMap
    };

    if (!isSupabaseConfigured) {
      setBaseMaps((prev) => [...prev, uiItem]);
      showAdminToast(`Base Map "${newMap.name}" created locally (DB not configured).`, 'info');
      return null;
    }

    try {
      await upsertAdminBaseMap(mapRow);
    } catch (err) {
      console.warn('Base map DB write failed:', err);
      showAdminToast(`Base Map "${newMap.name}" NOT saved to database — nothing added.`, 'error');
      return null;
    }
    setBaseMaps((prev) => [...prev, uiItem]);
    showAdminToast(`Base Map "${newMap.name}" created & synced to DB!`, 'success');
    return id;
  };

  const deleteBaseMap = async (mapId) => {
    try {
      await deleteBaseMapRow(mapId);
    } catch (err) {
      console.warn('Base map DB delete failed:', err);
      showAdminToast('Base map NOT deleted from database — keeping it in the list.', 'error');
      return false;
    }
    setBaseMaps((prev) => prev.filter((m) => m.id !== mapId));
    showAdminToast('Base map deleted from database.', 'info');
    return true;
  };

  const updateGlobalSettings = async (newSettings) => {
    setGlobalSettings((prev) => ({ ...prev, ...newSettings }));
    let synced = false;
    try {
      await saveGlobalSettings(newSettings);
      synced = true;
    } catch (err) {
      console.warn('Global settings DB write skipped:', err);
    }
    showAdminToast(
      synced
        ? 'Global Map Settings updated & synced to DB!'
        : 'Global Map Settings saved locally (database not connected).',
      'success'
    );
    return synced;
  };

  // Promote/demote a map as a base map against the dedicated base_maps table.
  //   promote (true):  copy the community map row into base_maps (maps row stays).
  //   demote  (false): delete the row from base_maps (community row stays).
  const setMapBaseFlagFor = async (mapId, isBase) => {
    try {
      if (isBase) {
        const full = await fetchMapById(mapId);
        if (!full) throw new Error('Map not found for promotion');
        await upsertAdminBaseMap({
          id: mapId,
          owner_id: full.ownerId ?? null,
          title: full.title ?? 'UNTITLED MAP',
          privacy: 'public',
          is_editor_map: false,
          data: full,
          summary: mapItemSummary(full),
        });
      } else {
        await deleteBaseMapRow(mapId);
      }
      return true;
    } catch (err) {
      console.warn('Base map flag DB write failed:', err);
      showAdminToast('Base map change NOT saved to database.', 'error');
      return false;
    }
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('project_travelcraft_isAdmin');
      localStorage.removeItem('project_travelcraft_isAdmin');
    } catch (e) {
      console.warn(e);
    }
    showAdminToast('🔒 Command Center Session Terminated.', 'info');
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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    setIsLoggedIn(false);
    setIsAdminLoggedIn(false);
    setUserProfile(null);
    try {
      localStorage.removeItem('project_travelcraft_isAdmin');
      sessionStorage.removeItem('project_travelcraft_isAdmin');
      localStorage.removeItem('project_travelcraft_session');
    } catch (e) {
      console.warn(e);
    }
    setAuthMode('login');
    setCurrentPage('auth');
  };

  const navigateTo = (page, location = null) => {
    if (location) {
      // Map items keep their publish-time data split across the top level
      // (title, cover, video, selfies, tags, logs) and the nested `details`
      // object (description/lore, region, hours, fee...). Merge both so the
      // Details page always sees exactly what the user entered on Publish Map.
      const nested = location.details && typeof location.details === 'object' ? location.details : null;
      const view = nested
        ? {
            ...location,
            ...nested,
            title: location.title ?? nested.title ?? '',
            lore: location.lore ?? location.description ?? nested.lore ?? ''
          }
        : location;
      setSelectedLocation(view);
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

  // Keep navigateToRef in sync so the early auth listener can navigate once the
  // latest navigateTo is available without re-registering the listener.
  useEffect(() => {
    navigateToRef.current = navigateTo;
  });

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
        updateUserAvatar,
        selectedLocation,
        setSelectedLocation,
        mapViewCounts,
        viewCountFor,
        effectiveRarityFor,
        trackLocationView,
        mapBackgroundImage,
        setMapBackgroundImage,
        resetMapBackgroundImage,
        mapCanvasStyle,
        setMapCanvasStyle,
        mapCanvasWidth,
        mapCanvasHeight,
         mapElements,
         mapRoutes,
         navStartId,
         navEndId,
         mapPins,
         setMapPins,
        selectedPin,
        setSelectedPin,
        communityMaps,
        setCommunityMaps,
        activeCommunityMap,
        setActiveCommunityMap,
        mapViewLoading,
        hasEverOpenedMap,
        trackMapOnWorldMap,
        publishMapToCommunity,
        deleteCommunityMap,
        adminDeleteCommunityMap,
        isOwnMap,
        saveEditorMapState,
        registerEditorDraft,
        userAssets,
        addUserAsset,
        removeUserAsset,
        addCustomPin,
        deleteCustomPin,
        favorites,
        toggleFavorite,
        mapFilters,
        toggleFilter,
        login,
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
        adminUser,
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
        deleteReportedLocation,
        deleteReportedLocationBatch,
        deleteReportedMap,
        submitReport,
        reviews,
        submitReview,
        approveReview,
        hideReview,
        unhideReview,
        togglePinReview,
        deleteReview,
        reportReview,
        voteHelpful,
        warnTrainer,
        banTrainer,
        unbanTrainer,
        changeTrainerRole,
        addBaseMap,
        deleteBaseMap,
        setMapBaseFlagFor,
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
