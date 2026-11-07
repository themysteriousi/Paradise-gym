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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />

      {/* Sticky Offline / Sync Status Banner */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div className="fixed top-14 left-0 right-0 z-40 max-w-lg mx-auto px-4 pt-1">
          <div
            className={`px-3 py-2 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg backdrop-blur-md border ${
              !isOnline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : isSyncing
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-brand-500/10 border-brand-500/30 text-brand-300'
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
              <span>
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
                className="px-2 py-0.5 bg-brand-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-brand-400 transition"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full pt-16 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
