import { useState } from 'react';
import { Mail, Key, Play, AlertCircle, Shield, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

export default function LoginForm() {
  const { login, loginAsAdmin, loginAsTrainer, setAuthMode } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanInput = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Direct Admin Master Login
    const isMasterAdmin =
      (cleanInput === 'admin_01' || cleanInput === 'admin' || cleanInput === 'admin@odyssey.net') &&
      (cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === 'odyssey2026' || cleanPass === '123456');

    if (isMasterAdmin) {
      loginAsAdmin({
        name: 'Admin_01',
        email: 'admin@odyssey.net',
        role: 'Admin',
        avatar: '🛡️'
      });
      setLoading(false);
      return;
    }

    // 2. Demo Trainer Fallback
    if (cleanInput === 'trainer@pallet.town' && (cleanPass === '123456' || cleanPass === 'trainer123')) {
      loginAsTrainer({
        name: 'Ash K.',
        email: 'trainer@pallet.town',
        role: 'Cartographer',
        avatar: '🧢'
      });
      setLoading(false);
      return;
    }

    // 3. Supabase Auth (Supports both regular players and admins in DB)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password: cleanPass,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        login(); // Trigger context update to redirect to home
      }
    } catch {
      setErrorMsg('An unexpected error occurred during boot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3 font-mono">
      <div className="text-center text-[10px] text-gray-500 font-bold uppercase">System Boot... OK.</div>
      <h2 className="text-center text-lg font-extrabold text-black mb-2">Trainer & Admin Login</h2>

      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-black mb-1">Email / Identifier</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trainer@pallet.town or admin@odyssey.net"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded-xl bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-amber-50" 
            required 
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-black mb-1">Secret Key / Passcode</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded-xl bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-amber-50" 
            required 
          />
        </div>
      </div>

      {/* Quick Demo Credentials Helper */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase">Quick Fill:</span>
        <button
          type="button"
          onClick={() => { setEmail('admin@odyssey.net'); setPassword('admin123'); setErrorMsg(''); }}
          className="px-2 py-0.5 bg-red-100 hover:bg-red-200 border border-black rounded text-[10px] font-black text-red-800 flex items-center gap-1 cursor-pointer"
        >
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </button>
        <button
          type="button"
          onClick={() => { setEmail('trainer@pallet.town'); setPassword('123456'); setErrorMsg(''); }}
          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-black rounded text-[10px] font-black text-amber-900 flex items-center gap-1 cursor-pointer"
        >
          <User className="w-3 h-3" />
          <span>Trainer</span>
        </button>
      </div>

      <div className="text-left pt-1">
        <button 
          type="button" 
          onClick={() => setAuthMode('forgot')} 
          className="text-[11px] font-bold underline text-gray-800 hover:text-black cursor-pointer"
        >
          Forgot Pass?
        </button>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#cc0000] text-white font-black py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Booting System...' : 'Start Adventure / Enter Command'} <Play className="w-3.5 h-3.5 fill-white" />
      </button>

      <div className="text-center pt-2">
        <button 
          type="button" 
          onClick={() => setAuthMode('register')} 
          className="text-xs font-bold underline text-black cursor-pointer"
        >
          New Trainer? Register
        </button>
      </div>
    </form>
  );
}
