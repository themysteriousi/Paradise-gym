import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import {
  generateProfitAndLossStatement,
  calculatePaymentMethodBreakdown,
  getPresetPeriod,
} from '@/services/financialReportService';
import { formatRupees } from '@/services/paymentService';
import { whatsappService } from '@/services/whatsappService';
import {
  TrendingUp,
  Smartphone,
  Banknote,
  CreditCard,
  AlertCircle,
  MessageCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function FinancialReportsPage() {
  const payments = useDemoStore((s) => s.payments);
  const refunds = useDemoStore((s) => s.refunds);
  const expenses = useDemoStore((s) => s.expenses);
  const members = useDemoStore((s) => s.members);

  const [preset, setPreset] = useState<
    'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all'
  >('this_month');

  const period = useMemo(() => getPresetPeriod(preset), [preset]);

  const pnl = useMemo(
    () => generateProfitAndLossStatement(payments, refunds, expenses, period),
    [payments, refunds, expenses, period]
  );

  const methodBreakdown = useMemo(
    () => calculatePaymentMethodBreakdown(payments),
    [payments]
  );

  // Members with pending dues
  const membersWithDues = useMemo(() => {
    return members
      .filter((m) => m.notes?.includes('Pending') || m.id === 'demo-member-1')
      .map((m) => ({
        member: m,
        due_amount_paise: 100000, // ₹1,000 pending instalment
        due_date: '2026-02-01',
      }));
  }, [members]);

  const handleSendReminder = (m: (typeof membersWithDues)[0]) => {
    const text = whatsappService.formatDueReminder({
      gymName: 'Paradise Gym',
      memberName: m.member.full_name,
      dueAmountFormatted: formatRupees(m.due_amount_paise),
      dueDate: m.due_date,
    });
    const link = whatsappService.getWhatsAppLink({ phone: m.member.phone, message: text });
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Financial Reports & P&L</h1>
          <p className="text-xs text-slate-400">Audited revenue, expenses, and partner profit share</p>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1">
        {(
          [
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_quarter', label: 'Quarter' },
            { id: 'this_year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
              preset === item.id
                ? 'bg-brand-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Executive P&L Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profit & Loss Statement</h2>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>
                  {period.startDate} to {period.endDate}
                </span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            Cash Basis
          </span>
        </div>

        {/* Financial Flow Line Items */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-300">Gross Member Collections</span>
            <span className="font-bold text-white text-sm">
              {formatRupees(pnl.gross_collections_paise)}
            </span>
          </div>

          {pnl.total_refunds_paise > 0 && (
            <div className="flex justify-between items-center py-1 text-rose-400">
              <span>Less: Refunds Issued</span>
              <span className="font-bold">-{formatRupees(pnl.total_refunds_paise)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 text-sky-400 border-t border-slate-800/80 pt-2 font-semibold">
            <span>Net Operating Collections</span>
            <span className="font-bold text-sm">{formatRupees(pnl.net_collections_paise)}</span>
          </div>

          <div className="flex justify-between items-center py-1 text-rose-400">
            <span>Less: Operating Expenses</span>
            <span className="font-bold">-{formatRupees(pnl.total_expenses_paise)}</span>
          </div>

          {/* Operating Profit (Bottom Line) */}
          <div className="mt-2 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Estimated Operating Profit</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Collections minus expenses</p>
            </div>
            <p
              className={`text-xl font-black ${
                pnl.estimated_profit_paise >= 0 ? 'text-brand-400' : 'text-rose-400'
              }`}
            >
              {formatRupees(pnl.estimated_profit_paise)}
            </p>
          </div>

          {/* 50-50 Partner Split */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center">
              <p className="text-[10px] text-slate-400">Partner 1 Share (50%)</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {formatRupees(pnl.partner_share_paise)}
              </p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center">
              <p className="text-[10px] text-slate-400">Partner 2 Share (50%)</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {formatRupees(pnl.partner_share_paise)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Split */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Collections Breakdown by Channel</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <Smartphone className="w-4 h-4 text-sky-400 mx-auto" />
            <p className="text-[11px] text-slate-400">UPI</p>
            <p className="text-sm font-black text-sky-400">
              {formatRupees(methodBreakdown.upi.amount_paise)}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {methodBreakdown.upi.percentage}% of total
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <Banknote className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-[11px] text-slate-400">Cash</p>
            <p className="text-sm font-black text-emerald-400">
              {formatRupees(methodBreakdown.cash.amount_paise)}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {methodBreakdown.cash.percentage}% of total
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <CreditCard className="w-4 h-4 text-purple-400 mx-auto" />
            <p className="text-[11px] text-slate-400">Card / Other</p>
            <p className="text-sm font-black text-purple-400">
              {formatRupees(methodBreakdown.card.amount_paise + methodBreakdown.other.amount_paise)}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {methodBreakdown.card.percentage + methodBreakdown.other.percentage}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Outstanding Dues & WhatsApp Reminders */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Pending Dues & Overdue Balances</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {membersWithDues.length} member(s) with pending fees
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {membersWithDues.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No overdue fees currently pending.</p>
          ) : (
            membersWithDues.map((item) => (
              <div
                key={item.member.id}
                className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.member.full_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.member.phone} • Due: {item.due_date}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-black text-amber-400">
                    {formatRupees(item.due_amount_paise)}
                  </span>
                  <button
                    onClick={() => handleSendReminder(item)}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center space-x-1 transition"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Remind</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
