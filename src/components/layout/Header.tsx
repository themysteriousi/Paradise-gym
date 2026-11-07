import { Dumbbell, LogOut, Moon, Sun, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function Header() {
  const { currentGym, currentPartner, isDemoMode, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800/80 z-40 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Gym Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="bg-brand-500 p-2 rounded-xl text-slate-950 shadow-md shadow-brand-500/20">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-sm leading-tight text-white tracking-tight">
                {currentGym?.name || 'Paradise Gym'}
              </h1>
              {isDemoMode && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-400" /> DEMO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {currentPartner?.name ? `${currentPartner.name} (Partner)` : 'Partner Mode'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition tap-bounce"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={logout}
            aria-label="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition tap-bounce"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
