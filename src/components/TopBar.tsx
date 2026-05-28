import { CloudAlert, CloudOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function TopBar({ title, showSync = true }: { title: string, showSync?: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <header className="h-16 bg-geo-dark text-white px-6 flex items-center justify-between shadow-md shrink-0 pt-safe font-sans">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 z-10 bg-geo-mid rounded flex items-center justify-center font-bold text-sm">PF</div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider leading-none">{title}</h1>
          <p className="text-[10px] opacity-70 uppercase tracking-widest mt-1">Field Terminal</p>
        </div>
      </div>
      
      {showSync && (
        <button 
          onClick={handleSync}
          className="flex items-center gap-2 text-[10px] font-mono tracking-tighter"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-white" />
              <span>SYNCING...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span>1 PENDING</span>
            </>
          )}
        </button>
      )}
    </header>
  );
}
