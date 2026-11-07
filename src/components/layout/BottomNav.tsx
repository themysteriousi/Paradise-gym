import { LayoutDashboard, Users, QrCode, CreditCard, MoreHorizontal } from 'lucide-react';
import { useUiStore, NavTab } from '@/stores/uiStore';

interface NavItem {
  tab: NavTab;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'members', label: 'Members', icon: Users },
  { tab: 'attendance', label: 'Attendance', icon: QrCode },
  { tab: 'payments', label: 'Payments', icon: CreditCard },
  { tab: 'more', label: 'More', icon: MoreHorizontal },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition duration-150 min-h-[48px] ${
                isActive
                  ? 'text-brand-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
              aria-label={label}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-brand-500/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
