import { Camera } from 'lucide-react';

export default function TravelerLogs() {
  return (
    <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-indigo-700">
          <Camera className="w-5 h-5" /> Traveler Logs
        </h3>
        <button className="text-xs font-bold text-red-600 hover:underline">View All</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="aspect-square bg-sky-200 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
          🗼
        </div>
        <div className="aspect-square bg-sky-300 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
          🌅
        </div>
        <div className="aspect-square bg-sky-100 border-2 border-black rounded flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold hover:scale-105 transition-transform cursor-pointer">
          ✨
        </div>
      </div>
    </div>
  );
}
