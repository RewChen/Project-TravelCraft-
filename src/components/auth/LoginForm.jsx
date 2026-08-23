import { useState } from 'react';
import { Mail, Key, Play, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

export default function LoginForm() {
  const { login, setAuthMode } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        login(); // Trigger context update to redirect to home
      }
    } catch {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-3">
      <div className="text-center text-[10px] text-gray-500 font-bold uppercase">System Boot... OK.</div>
      <h2 className="text-center text-lg font-extrabold text-black mb-2">Trainer Login</h2>

      {errorMsg && (
        <div className="bg-red-100 border-2 border-black text-red-700 p-2 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-black mb-1">Trainer Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trainer@pallet.town"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
            required 
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-black mb-1">Secret Key</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-600" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-8 pr-2 py-1.5 border-2 border-black rounded bg-gray-50 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
            required 
          />
        </div>
      </div>
      <div className="text-left">
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
        className="w-full bg-[#cc0000] text-white font-bold py-2 px-4 rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Booting...' : 'Start Adventure'} <Play className="w-3.5 h-3.5 fill-white" />
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
