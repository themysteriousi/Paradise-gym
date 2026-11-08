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
      <div className="space-y-3.5">
        <button
          onClick={() => setSubView('menu')}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white font-medium px-2.5 py-1 rounded-md bg-[#14161c] border border-white/[0.08] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
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
    },
    {
      id: 'expenses' as const,
      title: 'Operating Expenses',
      desc: 'Gym rent, electricity, maintenance, and staff payroll',
      icon: Receipt,
    },
    {
      id: 'partner-finances' as const,
      title: 'Partner Capital & Draws',
      desc: 'Individual capital investments and drawing accounts',
      icon: Users,
    },
    {
      id: 'plans' as const,
      title: 'Membership Plans & Pricing',
      desc: 'Configure Monthly, Quarterly, and Annual pricing',
      icon: Settings,
    },
    {
      id: 'closures' as const,
      title: 'Gym Closures & Extensions',
      desc: 'Holiday & maintenance shutdown management with 1-tap auto-extensions',
      icon: CalendarOff,
    },
    {
      id: 'queue' as const,
      title: 'Public Registration Queue',
      desc: 'Review and approve self-registered member submissions',
      icon: UserCheck,
    },
    {
      id: 'import' as const,
      title: 'CSV Member Import',
      desc: 'Bulk import member lists with preview and validation',
      icon: UploadCloud,
    },
    {
      id: 'exports' as const,
      title: 'Business Data Export & Backups',
      desc: '1-tap download of all spreadsheets (CSV) and full JSON database backups',
      icon: DownloadCloud,
    },
    {
      id: 'help' as const,
      title: 'Help Guides & Operations Runbook',
      desc: 'Step-by-step partner instructions, offline routines, and cash reconciliation',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-3.5">
      <div>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Partner Settings & Tools</h1>
        <p className="text-[11px] font-mono text-zinc-500">Gym governance, finances, and administration</p>
      </div>

      <div className="space-y-1.5 touch-pan-y">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubView(item.id)}
              className="w-full bg-[#14161c] border border-white/[0.07] hover:border-white/[0.14] p-3 rounded-xl flex items-center justify-between text-left transition group select-none"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-100 group-hover:text-white transition">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition shrink-0 ml-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
