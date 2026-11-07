import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/auth/LoginPage';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
