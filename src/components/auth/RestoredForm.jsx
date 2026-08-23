import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function RestoredForm() {
  const { setAuthMode } = useApp();

  return (
    <div className="space-y-4 text-center py-2">
      <div className="w-12 h-12 bg-red-600 border-2 border-black rounded-lg mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Check className="w-6 h-6 text-white stroke-[3]" />
      </div>
      <h3 className="font-black text-sm uppercase tracking-wider">SYSTEM RESTORED</h3>
      <p className="text-[10px] text-gray-600 font-sans leading-tight">
        Your Trainer Secret Key has been successfully updated. You can now log back into the system.
      </p>
      <button 
        onClick={() => setAuthMode('login')} 
        className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase cursor-pointer hover:bg-red-700 transition-colors"
      >
        BACK TO LOGIN
      </button>
    </div>
  );
}
