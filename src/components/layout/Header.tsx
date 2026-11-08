import { Dumbbell, LogOut, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function Header() {
  const { currentGym, currentPartner, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#0d0f12]/90 backdrop-blur-md border-b border-white/[0.08] z-40 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Gym Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-medium text-sm leading-tight text-[#ededed]">
                {currentGym?.name || 'Paradise Gym'}
              </h1>
            </div>
            <p className="text-[11px] text-[#71717a]">
              {currentPartner?.name ? `${currentPartner.name} (Desk)` : 'Desk terminal'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 text-[#71717a] hover:text-[#ededed] hover:bg-white/[0.04] rounded-lg transition-colors duration-150"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 stroke-[1.75]" /> : <Moon className="w-4 h-4 stroke-[1.75]" />}
          </button>
          <button
            onClick={logout}
            aria-label="Log Out"
            className="p-2 text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </header>
  );
}
