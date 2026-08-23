import { ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WildEncounters() {
  const { navigateTo } = useApp();

  const encounters = [
    {
      title: 'Seine River Cruise',
      distance: '500m away',
      icon: '🚢',
      color: 'bg-blue-100',
      region: 'Paris, France',
      lore: 'Glide along the historic Seine river with iconic views of Paris monuments.',
      hours: '10:00 - 22:00',
      fee: '€16.00',
      bestTime: 'Night lights',
      travel: 'Pont de l\'Alma',
      popularity: 92,
      visitors: '4M / yr',
      rarity: 'Uncommon'
    },
    {
      title: 'Musée du quai Branly',
      distance: '800m away',
      icon: '🏛️',
      color: 'bg-amber-100',
      region: 'Paris, France',
      lore: 'Features indigenous art and cultures of Africa, Asia, Oceania, and the Americas.',
      hours: '10:30 - 19:00',
      fee: '€14.00',
      bestTime: 'Afternoon',
      travel: 'RER Champ de Mars',
      popularity: 85,
      visitors: '1.5M / yr',
      rarity: 'Rare'
    }
  ];

  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-base font-black flex items-center gap-2 mb-4 border-b-2 border-black pb-2 text-black">
        🗺️ Wild Encounters
      </h3>
      <div className="space-y-3">
        {encounters.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigateTo('details', item)}
            className="flex items-center gap-3 border border-gray-300 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className={`w-10 h-10 ${item.color} border-2 border-black rounded flex items-center justify-center text-sm shadow-sm`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold">{item.title}</div>
              <div className="text-[10px] text-gray-500">{item.distance}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
