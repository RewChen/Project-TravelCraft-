import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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

export const AppProvider = ({ children }) => {
  // Navigation State: 'home', 'community', 'map', 'details', 'mymaps', 'profile', 'auth', 'admin'
  const [currentPage, setCurrentPage] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  
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

  const createFallbackProfile = (authUser) => ({
    name: authUser.user_metadata?.username || 'Traveler',
    email: authUser.email || '',
    avatar: authUser.user_metadata?.avatar || '🏃',
    role: authUser.user_metadata?.role || 'Cartographer',
    coins: 1245,
    level: 1,
    badges: [],
    visitedCount: 0
  });

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
        setIsAdminLoggedIn(isAdmin);
        setUserProfile({
          name: data.username,
          email: data.email,
          avatar: data.avatar || '🏃',
          role: data.role || 'Cartographer',
          coins: 1245, // Placeholder game stats
          avatar: data.avatar || (isAdmin ? '🛡️' : '🏃'),
          role: isAdmin ? 'Admin' : (data.role || 'Cartographer'),
          coins: 1245,
          level: 1,
          badges: ['Pioneer', 'Kyoto Explorer'],
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
      // Fallback
      setUserProfile({
        name: 'Traveler',
        email: 'trainer@pallet.town',
        avatar: '🏃',
        role: 'Cartographer',
        coins: 1245, level: 1, badges: [], visitedCount: 0
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
  const [favorites, setFavorites] = useState(() => loadStored('favorites', ['Eiffel Tower']));
  const [communityMaps, setCommunityMaps] = useState(() => loadStored('communityMaps', initialCommunityDiscoveries));
  const [activeCommunityMap, setActiveCommunityMap] = useState(null);

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
    email: 'admin@odyssey.net',
    role: 'SUPERUSER',
    badge: 'A1',
    clearanceLevel: 5
  }));
  const [baseMaps, setBaseMaps] = useState(() => loadStored('adminBaseMaps', initialBaseMaps));
  const [trainers, setTrainers] = useState(() => loadStored('adminTrainers', initialTrainers));
  const [reportedLocations, setReportedLocations] = useState(() => loadStored('adminReports', initialReportedLocations));
  const [globalSettings, setGlobalSettings] = useState(() => loadStored('adminSettings', initialGlobalSettings));
  const [adminToast, setAdminToast] = useState(null);

  const showAdminToast = (message, type = 'success') => {
    setAdminToast({ message, type });
    setTimeout(() => {
      setAdminToast(null);
    }, 3500);
  };

  // Sync to LocalStorage on State Changes (Only non-auth data)
  useEffect(() => {
    try {
      localStorage.setItem('pocket_odyssey_mapPins', JSON.stringify(mapPins));
      localStorage.setItem('pocket_odyssey_mapBgImage', JSON.stringify(mapBackgroundImage));
      localStorage.setItem('pocket_odyssey_favorites', JSON.stringify(favorites));
      localStorage.setItem('pocket_odyssey_communityMaps', JSON.stringify(communityMaps));
      localStorage.setItem('pocket_odyssey_adminBaseMaps', JSON.stringify(baseMaps));
      localStorage.setItem('pocket_odyssey_adminTrainers', JSON.stringify(trainers));
      localStorage.setItem('pocket_odyssey_adminReports', JSON.stringify(reportedLocations));
      localStorage.setItem('pocket_odyssey_adminSettings', JSON.stringify(globalSettings));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }, [mapPins, mapBackgroundImage, favorites, communityMaps, baseMaps, trainers, reportedLocations, globalSettings]);

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
  };

  // Launch Community Map onto the World Map View
  const trackMapOnWorldMap = (communityItem) => {
    setActiveCommunityMap(communityItem);
    if (communityItem.bgThemeUrl) {
      setMapBackgroundImage(communityItem.bgThemeUrl);
    } else {
      setMapBackgroundImage(null);
    }
    if (communityItem.pins && communityItem.pins.length > 0) {
      setMapPins(communityItem.pins);
      setSelectedPin(communityItem.pins[0]);
    }
    setCurrentPage('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Publish a custom user map to Community Discoveries!
  const publishMapToCommunity = (newCommunityMap) => {
    const mapSlug = newCommunityMap.title ? newCommunityMap.title.replace(/\s+/g, '-').toLowerCase() : 'user-map';
    const uniqueId = `comm-user-${mapSlug}-${newCommunityMap.id || mapSlug}`;
    const publishedItem = {
      id: uniqueId,
      title: newCommunityMap.title.toUpperCase(),
      discoveredBy: userProfile.name,
      authorRole: userProfile.role || 'Cartographer',
      authorBadgeColor: 'bg-[#cc0000]',
      popularityLv: 85,
      rarity: 'Epic',
      rarityColor: 'bg-indigo-500 text-white',
      category: newCommunityMap.category || 'landmarks',
      imageUrl: newCommunityMap.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
      bgThemeUrl: mapBackgroundImage || newCommunityMap.bgThemeUrl,
      details: {
        title: newCommunityMap.title,
        region: newCommunityMap.region || 'Custom Traveler Realm',
        type: 'Community Map',
        tag: 'Custom',
        lore: newCommunityMap.description || 'A custom world map created and shared by an explorer.',
        hours: '24/7',
        fee: 'Free Exploration',
        bestTime: 'Anytime',
        travel: 'Community Gateway',
        popularity: 85,
        visitors: 'Community Discoveries',
        rarity: 'Epic'
      },
      pins: newCommunityMap.pins || mapPins
    };

    setCommunityMaps((prev) => [publishedItem, ...prev]);
    setUserProfile((prev) => ({ ...prev, coins: prev.coins + 150 }));
    navigateTo('community');
  };

  const deleteCommunityMap = (mapId) => {
    setCommunityMaps((previous) => previous.filter((map) => (
      !(map.id === mapId && map.discoveredBy === userProfile?.name)
    )));
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
      (cleanId === 'admin_01' || cleanId === 'admin' || cleanId === 'admin@odyssey.net' || cleanId === 'system lord') &&
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
      name: customAdmin?.name || 'Admin_01',
      email: customAdmin?.email || 'admin@odyssey.net',
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
      name: customTrainer?.name || 'Ash K.',
      email: customTrainer?.email || 'trainer@pallet.town',
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
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        authMode,
        setAuthMode,
        isLoggedIn,
        setIsLoggedIn,
        userProfile,
        setUserProfile,
        selectedLocation,
        setSelectedLocation,
        mapBackgroundImage,
        setMapBackgroundImage,
        resetMapBackgroundImage,
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
        updateGlobalSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
