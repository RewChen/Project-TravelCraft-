import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GlobalToast() {
  const { adminToast } = useApp();

  if (!adminToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-none">
      <div
        className={`border-4 border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-mono text-xs font-black uppercase max-w-sm ${
          adminToast.type === 'error'
            ? 'bg-[#cc0000] text-white'
            : adminToast.type === 'warning'
            ? 'bg-amber-400 text-black'
            : adminToast.type === 'info'
            ? 'bg-sky-400 text-black'
            : 'bg-emerald-400 text-black'
        }`}
      >
        {adminToast.type === 'error' ? (
          <AlertCircle className="w-5 h-5 shrink-0" />
        ) : adminToast.type === 'warning' ? (
          <AlertCircle className="w-5 h-5 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 shrink-0" />
        )}
        <span>{adminToast.message}</span>
      </div>
    </div>
  );
}