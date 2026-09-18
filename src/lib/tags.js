import { Utensils, Plane, Trees, Gamepad2, Landmark, Mountain } from 'lucide-react';

export const PRESET_TAGS = [
  { value: 'national-park', labelKey: 'myMaps.tagNationalPark', icon: Mountain, emoji: '⛰️' },
  { value: 'restaurant', labelKey: 'myMaps.tagRestaurant', icon: Utensils, emoji: '🍽️' },
  { value: 'travel', labelKey: 'myMaps.tagTravel', icon: Plane, emoji: '✈️' },
  { value: 'park', labelKey: 'myMaps.tagPark', icon: Trees, emoji: '🌲' },
  { value: 'game', labelKey: 'myMaps.tagGame', icon: Gamepad2, emoji: '🎮' },
  { value: 'attraction', labelKey: 'myMaps.tagAttraction', icon: Landmark, emoji: '⛩️' }
];

export const PRESET_TAG_META = Object.fromEntries(
  PRESET_TAGS.map(({ value, ...meta }) => [value, meta])
);
