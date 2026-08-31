import { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertTriangle, X, Terminal, RefreshCw, Cpu } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function DeployUpdateModal({ isOpen, onClose }) {
  const { showAdminToast } = useApp();
  const [deployStep, setDeployStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setDeployStep(0);
      setIsDeploying(false);
      setLogs([
        'Ready to compile bundle v2.4.1-ODYSSEY',
        'Target: All 4 Edge Regions (Kanto, Johto, Hoenn, Sinnoh)',
        'Status: Standby'
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDeploy = () => {
    setIsDeploying(true);
    setDeployStep(1);
    setLogs((prev) => [...prev, '>>> Initiating hotfix build sequence...', '>>> Syncing Supabase edge tables...']);

    setTimeout(() => {
      setDeployStep(2);
      setLogs((prev) => [...prev, '>>> Invaliding CDN tile caches across 4 regions...', '>>> Rebuilding spatial coordinates indexes...']);
    }, 1200);

    setTimeout(() => {
      setDeployStep(3);
      setLogs((prev) => [...prev, '>>> Broadcast reload signal sent to 42,091 connected clients.', '>>> DEPLOYMENT COMPLETE! Status: OPERATIONAL']);
      setIsDeploying(false);
      showAdminToast('🚀 System Update deployed successfully to all edge regions!', 'success');
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            <h3 className="text-base font-black uppercase tracking-wider">Deploy System Update</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-neutral-800 text-white rounded-lg border-2 border-white flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-gray-100 border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Target Version</div>
              <div className="text-sm font-black text-black">v2.4.1-ODYSSEY (Build 8421)</div>
            </div>
            <span className="bg-emerald-400 text-black text-[10px] font-black px-2.5 py-1 border-2 border-black rounded-full uppercase">
              Production Release
            </span>
          </div>

          {/* Terminal Console Output */}
          <div className="bg-neutral-900 border-4 border-black rounded-xl p-3 text-emerald-400 text-[11px] font-mono shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] h-40 overflow-y-auto space-y-1">
            <div className="flex items-center gap-2 text-gray-400 border-b border-neutral-800 pb-1 mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Odyssey Console Stream</span>
            </div>
            {logs.map((log, index) => (
              <div key={index} className="leading-tight">
                {log}
              </div>
            ))}
            {isDeploying && (
              <div className="flex items-center gap-2 text-amber-300 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Processing edge workers...</span>
              </div>
            )}
          </div>

          {/* Progress or Steps indicator */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase">
            <div className={`p-2 border-2 border-black rounded-lg ${deployStep >= 1 ? 'bg-amber-400' : 'bg-gray-100 text-gray-400'}`}>
              1. Build Bundle
            </div>
            <div className={`p-2 border-2 border-black rounded-lg ${deployStep >= 2 ? 'bg-amber-400' : 'bg-gray-100 text-gray-400'}`}>
              2. Edge Sync
            </div>
            <div className={`p-2 border-2 border-black rounded-lg ${deployStep === 3 ? 'bg-emerald-400' : 'bg-gray-100 text-gray-400'}`}>
              3. Live Broadcast
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 border-2 border-black rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Close
            </button>
            {deployStep !== 3 ? (
              <button
                type="button"
                disabled={isDeploying}
                onClick={handleStartDeploy}
                className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 disabled:opacity-50 text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Execute Deploy</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

