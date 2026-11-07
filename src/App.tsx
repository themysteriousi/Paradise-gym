import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/layout/AppShell';
import { useUiStore } from '@/stores/uiStore';
import MemberListPage from '@/pages/members/MemberListPage';
import PaymentListPage from '@/pages/payments/PaymentListPage';
import MoreHubPage from '@/pages/more/MoreHubPage';
import { Users, QrCode, TrendingUp } from 'lucide-react';

function DashboardView() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <span>Today&apos;s Operations</span>
          </h2>
          <span className="text-xs text-slate-400">Live Numbers</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400">Active Members</p>
            <p className="text-2xl font-black text-white mt-1">24</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400">Today&apos;s Check-ins</p>
            <p className="text-2xl font-black text-brand-500 mt-1">11</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400">Today&apos;s Collections</p>
            <p className="text-2xl font-black text-white mt-1">₹6,500</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400">Pending Dues</p>
            <p className="text-2xl font-black text-amber-400 mt-1">₹3,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon }: { title: string; icon: typeof Users }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
      <div className="inline-flex p-3 rounded-2xl bg-slate-800 text-brand-500 border border-slate-700/60">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mx-auto">
        Module scaffolded and ready for implementation in the next phase.
      </p>
    </div>
  );
}

function MainContent() {
  const activeTab = useUiStore((s) => s.activeTab);

  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'members':
      return <MemberListPage />;
    case 'attendance':
      return <PlaceholderView title="QR Attendance Scanner" icon={QrCode} />;
    case 'payments':
      return <PaymentListPage />;
    case 'more':
      return <MoreHubPage />;
    default:
      return <DashboardView />;
  }
}

export default function App() {
  return (
    <AuthGuard>
      <AppShell>
        <MainContent />
      </AppShell>
    </AuthGuard>
  );
}
