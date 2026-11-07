import { ReactNode, useEffect } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { useOfflineStore } from '@/stores/offlineStore';
import { initNetworkListeners, processOfflineSync } from '@/services/offlineSyncService';
import { WifiOff, RefreshCw, CloudCheck } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingQueueCount = useOfflineStore((s) => s.pendingQueueCount);
  const isSyncing = useOfflineStore((s) => s.isSyncing);

  useEffect(() => {
    const cleanup = initNetworkListeners();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-white">
      <Header />

      {/* Sticky Offline / Sync Status Banner */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] left-0 right-0 z-40 max-w-lg mx-auto px-4 pt-1">
          <div
            className={`px-3.5 py-2 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xl border ${
              !isOnline
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-300 backdrop-blur-md'
                : isSyncing
                ? 'bg-sky-950/90 border-sky-500/40 text-sky-300 backdrop-blur-md'
                : 'bg-brand-950/90 border-brand-500/40 text-brand-300 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center space-x-2">
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : isSyncing ? (
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
              ) : (
                <CloudCheck className="w-4 h-4 text-brand-400 shrink-0" />
              )}
              <span className="font-medium text-[11.5px]">
                {!isOnline
                  ? `Offline Mode Active • ${pendingQueueCount} check-in(s) queued`
                  : isSyncing
                  ? `Syncing ${pendingQueueCount} items to cloud...`
                  : `${pendingQueueCount} queued items ready to sync`}
              </span>
            </div>

            {isOnline && pendingQueueCount > 0 && !isSyncing && (
              <button
                onClick={() => processOfflineSync()}
                className="px-2.5 py-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-[10px] transition tap-bounce shadow-sm"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content container with ample bottom padding so fixed BottomNav never clips content */}
      <main className="flex-1 max-w-lg mx-auto w-full pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] px-3.5 sm:px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
