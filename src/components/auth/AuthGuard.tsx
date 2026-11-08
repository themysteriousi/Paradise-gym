import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import { Dumbbell } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // If loading live session check and not yet authenticated, show terminal loader
  if (!isInitialized && isLoading && !isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-[#0d0f12] text-[#ededed] flex flex-col justify-center items-center px-4 select-none">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center justify-center animate-pulse">
            <Dumbbell className="w-5 h-5 stroke-[1.75]" />
          </div>
          <p className="text-xs text-[#a1a1a6] font-mono animate-pulse">Connecting terminal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
