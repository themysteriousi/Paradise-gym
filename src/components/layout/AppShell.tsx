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
    <div className="min-h-screen min-h-[100dvh] bg-[#0d0f12] text-zinc-100 flex flex-col selection:bg-emerald-500/20 selection:text-white">
      <Header />

      {/* Sticky Offline / Sync Status Banner */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] left-0 right-0 z-40 max-w-lg mx-auto px-4 pt-1 pointer-events-none">
          <div
            className={`pointer-events-auto px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-medium shadow-lg border ${
              !isOnline
                ? 'bg-[#14161c] border-amber-500/30 text-amber-300 backdrop-blur-md'
                : isSyncing
                ? 'bg-[#14161c] border-white/[0.15] text-zinc-200 backdrop-blur-md'
                : 'bg-[#14161c] border-emerald-500/30 text-emerald-300 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center space-x-2">
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : isSyncing ? (
                <RefreshCw className="w-4 h-4 text-zinc-300 animate-spin shrink-0" />
              ) : (
                <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-mono text-[11px]">
                {!isOnline
                  ? `Offline • ${pendingQueueCount} check-in(s) queued`
                  : isSyncing
                  ? `Syncing ${pendingQueueCount} items...`
                  : `${pendingQueueCount} queued items ready`}
              </span>
            </div>

            {isOnline && pendingQueueCount > 0 && !isSyncing && (
              <button
                onClick={() => processOfflineSync()}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md text-[11px] transition shadow-sm"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content container with ample bottom padding so fixed BottomNav never clips content */}
      <main className="flex-1 max-w-lg mx-auto w-full pt-[calc(4.25rem+env(safe-area-inset-top,0px))] pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] px-3.5 sm:px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
