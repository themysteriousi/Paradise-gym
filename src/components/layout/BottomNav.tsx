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
      className="fixed bottom-0 left-0 right-0 bg-[#0d0f12]/95 backdrop-blur-md border-t border-white/[0.08] z-40 pb-[max(0.375rem,env(safe-area-inset-bottom))] select-none"
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
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition duration-150 min-h-[48px] select-none touch-manipulation ${
                isActive
                  ? 'text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`px-3 py-1 rounded-lg transition duration-150 ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
              </div>
              <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${isActive ? 'font-medium text-zinc-200' : 'text-zinc-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
