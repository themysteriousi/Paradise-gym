import { Dumbbell, LogOut, Moon, Sun, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function Header() {
  const { currentGym, currentPartner, isDemoMode, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-40">
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Gym Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="bg-brand-500 p-2 rounded-xl text-slate-950 shadow-sm shadow-brand-500/20">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-sm leading-tight text-white tracking-tight">
                {currentGym?.name || 'Paradise Gym'}
              </h1>
              {isDemoMode && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> DEMO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{currentPartner?.name || 'Partner'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={logout}
            aria-label="Log Out"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

