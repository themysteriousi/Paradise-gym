import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full pt-16 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
