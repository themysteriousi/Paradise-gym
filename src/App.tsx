import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/layout/AppShell';
import { useUiStore } from '@/stores/uiStore';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import MemberListPage from '@/pages/members/MemberListPage';
import PaymentListPage from '@/pages/payments/PaymentListPage';
import AttendancePage from '@/pages/attendance/AttendancePage';
import MoreHubPage from '@/pages/more/MoreHubPage';

function MainContent() {
  const activeTab = useUiStore((s) => s.activeTab);

  switch (activeTab) {
    case 'dashboard':
      return <DashboardPage />;
    case 'members':
      return <MemberListPage />;
    case 'attendance':
      return <AttendancePage />;
    case 'payments':
      return <PaymentListPage />;
    case 'more':
      return <MoreHubPage />;
    default:
      return <DashboardPage />;
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
