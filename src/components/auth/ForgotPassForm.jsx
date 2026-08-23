import { Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ForgotPassForm() {
  const { setAuthMode } = useApp();

  return (
    <div className="space-y-4 py-2">
      <div className="text-center">
        <div className="inline-block text-red-600 font-bold text-lg mb-1">🔑 SYSTEM RECOVERY</div>
        <p className="text-[11px] text-gray-600 font-sans">Enter your Trainer Email to receive a Secret Key reset link.</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-black mb-1">Trainer Email</label>
        <input 
          type="email" 
          defaultValue="ash@pallet.town" 
          className="w-full px-3 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
        />
      </div>
      <button 
        onClick={() => setAuthMode('restored')} 
        className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition-colors"
      >
        SEND RESET LINK <Play className="w-3 h-3 fill-white" />
      </button>
      <div className="text-center space-y-1 pt-2">
        <button 
          onClick={() => setAuthMode('login')} 
          className="block w-full text-xs font-bold underline text-black cursor-pointer"
        >
          ← Back to Login
        </button>
        <button 
          onClick={() => setAuthMode('register')} 
          className="block w-full text-xs font-bold underline text-black cursor-pointer"
        >
          ← New Trainer? Register
        </button>
      </div>
    </div>
  );
}
