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
    <nav
      onContextMenu={(e) => e.preventDefault()}
      className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 z-40 pb-[max(0.375rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              onContextMenu={(e) => e.preventDefault()}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-100 min-h-[48px] tap-bounce select-none touch-manipulation ${
                isActive
                  ? 'text-brand-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 shadow-sm shadow-brand-500/10'
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10.5px] leading-none mt-1 tracking-tight ${isActive ? 'font-bold text-brand-300' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
