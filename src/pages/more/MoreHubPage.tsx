import { useState } from 'react';
import FinancialReportsPage from './FinancialReportsPage';
import ExpensesPage from './ExpensesPage';
import PartnerFinancesPage from './PartnerFinancesPage';
import PlanSettingsPage from './PlanSettingsPage';
import ClosuresPage from './ClosuresPage';
import ExportsPage from './ExportsPage';
import HelpPage from './HelpPage';
import RegistrationQueuePage from '@/pages/members/RegistrationQueuePage';
import MemberImportPage from '@/pages/members/MemberImportPage';
import {
  TrendingUp,
  Receipt,
  Users,
  Settings,
  CalendarOff,
  UserCheck,
  UploadCloud,
  DownloadCloud,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

type SubView =
  | 'menu'
  | 'reports'
  | 'expenses'
  | 'partner-finances'
  | 'plans'
  | 'closures'
  | 'exports'
  | 'help'
  | 'queue'
  | 'import';

export default function MoreHubPage() {
  const [subView, setSubView] = useState<SubView>('menu');

  if (subView !== 'menu') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSubView('menu')}
          className="flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Settings</span>
        </button>

        {subView === 'reports' && <FinancialReportsPage />}
        {subView === 'expenses' && <ExpensesPage />}
        {subView === 'partner-finances' && <PartnerFinancesPage />}
        {subView === 'plans' && <PlanSettingsPage />}
        {subView === 'closures' && <ClosuresPage />}
        {subView === 'exports' && <ExportsPage />}
        {subView === 'help' && <HelpPage />}
        {subView === 'queue' && <RegistrationQueuePage onBack={() => setSubView('menu')} />}
        {subView === 'import' && (
          <MemberImportPage
            onBack={() => setSubView('menu')}
            onImportComplete={() => setSubView('menu')}
          />
        )}
      </div>
    );
  }

  const MENU_ITEMS = [
    {
      id: 'reports' as const,
      title: 'Financial Reports & P&L',
      desc: 'Operational profit, collections, and 50/50 partner split',
      icon: TrendingUp,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      id: 'expenses' as const,
      title: 'Operating Expenses',
      desc: 'Gym rent, electricity, maintenance, and staff payroll',
      icon: Receipt,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'partner-finances' as const,
      title: 'Partner Capital & Draws',
      desc: 'Individual capital investments and drawing accounts',
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'plans' as const,
      title: 'Membership Plans & Pricing',
      desc: 'Configure Monthly, Quarterly, and Annual pricing',
      icon: Settings,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'closures' as const,
      title: 'Gym Closures & Extensions',
      desc: 'Holiday & maintenance shutdown management with 1-tap auto-extensions',
      icon: CalendarOff,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'queue' as const,
      title: 'Public Registration Queue',
      desc: 'Review and approve self-registered member submissions',
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'import' as const,
      title: 'CSV Member Import',
      desc: 'Bulk import member lists with preview and validation',
      icon: UploadCloud,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'exports' as const,
      title: 'Business Data Export & Backups',
      desc: '1-tap download of all spreadsheets (CSV) and full JSON database backups',
      icon: DownloadCloud,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      id: 'help' as const,
      title: 'Help Guides & Operations Runbook',
      desc: 'Step-by-step partner instructions, offline routines, and cash reconciliation',
      icon: HelpCircle,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">Partner Settings & Tools</h1>
        <p className="text-xs text-slate-400">Gym governance, finances, and administration</p>
      </div>

      <div className="space-y-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSubView(item.id)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-4 rounded-2xl flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center space-x-3.5">
                <div className={`p-3 rounded-2xl border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
