import { Dumbbell, LogOut, Sparkles } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/stores/authStore';

function AppContent() {
  const { currentPartner, currentGym, isDemoMode, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="bg-brand-500 p-2 rounded-xl text-slate-950 shadow-sm shadow-brand-500/20">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base leading-tight tracking-tight text-white">{currentGym?.name || 'Paradise Gym'}</h1>
              {isDemoMode && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{currentPartner?.name || 'Partner'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-bold text-slate-100">Today&apos;s Operations</h2>
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
              <p className="text-xs text-slate-400">Collections</p>
              <p className="text-2xl font-black text-white mt-1">₹6,500</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-400">Pending Dues</p>
              <p className="text-2xl font-black text-amber-400 mt-1">₹3,000</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-2.5 flex justify-around items-center text-xs text-slate-400 sticky bottom-0">
        <span className="text-brand-500 font-semibold">Dashboard</span>
        <span>Members</span>
        <span>Attendance</span>
        <span>Payments</span>
        <span>More</span>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}
