import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import {
  recordExpense,
  getExpenseSummaryByCategory,
} from '@/services/expenseService';
import { formatRupees, parseRupeesToPaise } from '@/services/paymentService';
import type { ExpenseCategory } from '@/types/database';
import {
  Plus,
  Receipt,
  Building2,
  Zap,
  Wrench,
  Dumbbell,
  Users,
  Megaphone,
  Sparkles,
  Calendar,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: typeof Building2; color: string }
> = {
  rent: { label: 'Rent & Lease', icon: Building2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  salary: { label: 'Staff Salary', icon: Users, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  utilities: { label: 'Electricity & Water', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  equipment: { label: 'Equipment & Spares', icon: Dumbbell, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  maintenance: { label: 'Maintenance & Repairs', icon: Wrench, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  marketing: { label: 'Marketing & Ads', icon: Megaphone, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  supplies: { label: 'Supplies & Cleaning', icon: Sparkles, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  other: { label: 'General / Other', icon: Receipt, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

export default function ExpensesPage() {
  const expenses = useDemoStore((s) => s.expenses);
  const currentPartner = useAuthStore((s) => s.currentPartner);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => getExpenseSummaryByCategory(expenses), [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          e.description.toLowerCase().includes(query) ||
          e.note?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountPaise = parseRupeesToPaise(amountRupees);
    if (amountPaise <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordExpense({
        gym_id: currentPartner?.gym_id || 'demo-gym-001',
        recorded_by: currentPartner?.id || 'demo-partner-001',
        category,
        description: description.trim(),
        amount_paise: amountPaise,
        expense_date: expenseDate,
        note: note.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Failed to record expense');
        setIsSubmitting(false);
        return;
      }

      // Reset
      setDescription('');
      setAmountRupees('');
      setNote('');
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error recording expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-400">Gym overhead & operational cash outlays</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Total Expenses Recorded</p>
          <p className="text-xl font-black text-white mt-1">{formatRupees(summary.total_paise)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{expenses.length} expense entries</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Rent & Utilities</p>
          <p className="text-xl font-black text-amber-400 mt-1">
            {formatRupees(summary.rent + summary.utilities)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Fixed premises overhead</p>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expense description or note..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
              selectedCategoryFilter === 'all'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition ${
                selectedCategoryFilter === cat
                  ? 'bg-slate-800 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/50'
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No expenses recorded</p>
            <p className="text-xs text-slate-500">
              Track rent, power bills, and maintenance to calculate estimated profit.
            </p>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
            const Icon = meta.icon;

            return (
              <div
                key={exp.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {exp.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">{meta.label}</span>
                        <span>•</span>
                        <span>{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-rose-400">
                      -{formatRupees(exp.amount_paise)}
                    </p>
                  </div>
                </div>

                {exp.note && (
                  <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 italic">
                    Note: {exp.note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Record Expense</h2>
                  <p className="text-xs text-slate-400">Operational overhead outflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center space-y-1 text-center transition ${
                          category === cat
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    min="1"
                    required
                  />
                </div>
                {/* Quick amount pills */}
                <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto">
                  {[500, 1000, 3000, 5000, 12000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountRupees(amt.toString())}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition shrink-0"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly rent to landlord"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expense Date</span>
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Optional Note / Mode</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Paid via UPI Ref 192837"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Expense...' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
