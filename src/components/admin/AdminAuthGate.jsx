import { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Unlock, ArrowLeft, Terminal, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AdminAuthGate() {
  const { adminLogin, navigateTo } = useApp();

  const [adminId, setAdminId] = useState('admin_01');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await adminLogin(adminId, passcode);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Access Denied: Invalid clearance credentials.');
    }
  };

  const fillDemoCredentials = () => {
    setAdminId('admin_01');
    setPasscode('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#1a1d20] flex flex-col items-center justify-center p-4 font-mono select-none">
      {/* Back Button */}
      <button
        onClick={() => navigateTo('home')}
        className="mb-6 bg-gray-800 hover:bg-gray-700 text-white font-black px-4 py-2 border-2 border-white rounded-xl text-xs uppercase shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Trainer Mode</span>
      </button>

      {/* Main Gate Card */}
      <div className="w-full max-w-md bg-[#e8ecef] border-4 border-black rounded-[28px] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Terminal Header Banner */}
        <div className="bg-[#cc0000] text-white p-3.5 px-4 -mx-6 -mt-6 border-b-4 border-black flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider">
              COMMAND CENTER GATEWAY
            </span>
          </div>
          <span className="text-[10px] bg-black text-amber-400 font-black px-2 py-0.5 rounded border border-amber-400">
            LVL-5 SECURE
          </span>
        </div>

        {/* Security Warning Box */}
        <div className="bg-amber-100 border-2 border-black rounded-xl p-3 mb-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-900 shrink-0 mt-0.5" />
          <div className="text-[11px] font-sans font-bold text-amber-950 leading-snug">
            <span className="font-mono uppercase font-black">Restricted Area:</span> Administrative credentials and clearance key required to manage Odyssey network parameters.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin ID / Username */}
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-800 flex items-center justify-between">
              <span>Admin Identifier</span>
              <span className="text-[10px] text-gray-500 font-bold">UID / Email</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin_01 / admin@odyssey.net"
                className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-xs font-black text-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Passcode Field */}
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-800 flex items-center justify-between">
              <span>Clearance Passcode</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-indigo-700 hover:underline font-black uppercase cursor-pointer"
              >
                {showPassword ? 'Hide Key' : 'Show Key'}
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter security clearance key..."
                className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-xs font-black text-black focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-100 border-2 border-red-500 rounded-xl p-2.5 text-xs font-black text-red-700 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Credentials Helper */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl p-2.5 flex items-center justify-between">
            <div className="text-[10px] text-gray-600 font-bold">
              <span>🔑 Demo Key: </span>
              <span className="font-mono font-black text-black">admin_01</span> / <span className="font-mono font-black text-black">admin123</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2 py-1 bg-white hover:bg-amber-100 border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Fill Key
            </button>
          </div>

          {/* Authenticate Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#cc0000] hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isLoading ? (
              <span className="animate-pulse">VERIFYING CLEARANCE...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>AUTHENTICATE & ENTER</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Subtext */}
        <div className="mt-4 pt-3 border-t-2 border-black/10 text-center text-[10px] text-gray-500 font-mono">
          ODYSSEY COMMAND SECURITY PROTOCOL v2.4
        </div>
      </div>
    </div>
  );
}

