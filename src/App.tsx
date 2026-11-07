import { Dumbbell } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-brand-500 p-2 rounded-xl text-slate-950">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Paradise Gym</h1>
            <p className="text-xs text-slate-400">Partner Operations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            Online
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Welcome Partners</h2>
          <p className="text-sm text-slate-400">
            Initial application shell loaded successfully. Foundation is ready for member management, QR attendance, and finance modules.
          </p>
        </div>
      </main>

      {/* Footer / Bottom Nav Placeholder */}
      <nav className="bg-slate-800/90 border-t border-slate-700/60 px-4 py-2 flex justify-around items-center text-xs text-slate-400">
        <span>Dashboard</span>
        <span>Members</span>
        <span>Attendance</span>
        <span>Payments</span>
        <span>More</span>
      </nav>
    </div>
  );
}
