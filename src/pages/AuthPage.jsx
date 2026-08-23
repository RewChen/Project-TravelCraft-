import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPassForm from '../components/auth/ForgotPassForm';
import RestoredForm from '../components/auth/RestoredForm';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const { authMode, navigateTo } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-mono">
      <button
        onClick={() => navigateTo('home')}
        className="mb-4 text-white text-xs font-bold bg-gray-800 hover:bg-gray-700 px-4 py-2 border-2 border-white rounded-lg flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
      >
        ← Back to Main Page
      </button>
      
      <div className="w-full max-w-sm bg-[#d8d8d8] border-4 border-black rounded-[36px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] relative">
        <div className="bg-[#111111] p-3 rounded-t-2xl rounded-b-xl border-4 border-black mb-5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
          <div className="bg-white border-4 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Red Header Banner */}
            <div className="bg-[#cc0000] text-white py-2.5 px-3 border-b-4 border-black text-center font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2">
              <span>{authMode === 'login' && 'POCKET ODYSSEY'}</span>
              <span>{authMode === 'register' && 'TRAINER REGISTRATION'}</span>
              <span>{authMode === 'forgot' && 'SYSTEM RECOVERY'}</span>
              <span>{authMode === 'restored' && 'SYSTEM RESTORED'}</span>
            </div>
            
            <div className="p-4 sm:p-5">
              {authMode === 'login' && <LoginForm />}
              {authMode === 'register' && <RegisterForm />}
              {authMode === 'forgot' && <ForgotPassForm />}
              {authMode === 'restored' && <RestoredForm />}
            </div>

          </div>
        </div>

        {/* Game Boy D-Pad and Action Buttons */}
        <div className="flex items-center justify-between px-3 pt-1 pb-2">
          <div className="relative w-14 h-14">
            <div className="absolute top-0 left-4 w-5 h-14 bg-black rounded-sm"></div>
            <div className="absolute top-4 left-0 w-14 h-5 bg-black rounded-sm"></div>
            <div className="absolute top-4 left-4 w-5 h-5 bg-[#222222] rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
            <div className="w-6 h-6 bg-amber-400 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
          </div>
        </div>

      </div>

      <footer className="text-center text-xs text-white/60 mt-6 space-y-1 font-sans">
        <div className="flex justify-center gap-4 font-bold underline">
          <button className="hover:text-white">Legal</button>
          <button className="hover:text-white">Support</button>
          <button className="hover:text-white">Trainer Club</button>
        </div>
        <p className="text-[10px]">© 2026 Pocket Odyssey - Gotta Explore 'Em All</p>
      </footer>
    </div>
  );
}
