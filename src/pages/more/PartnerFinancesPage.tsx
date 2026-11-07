import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import {
  recordPartnerTransaction,
  getPartnerLedgerSummary,
} from '@/services/expenseService';
import { formatRupees, parseRupeesToPaise } from '@/services/paymentService';
import type { TransactionType } from '@/types/database';
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  AlertCircle,
  X,
  Check,
  Info,
} from 'lucide-react';

const PARTNERS = [
  { id: 'demo-partner-001', name: 'Partner 1 (Operations)', role: 'Managing Partner' },
  { id: 'demo-partner-002', name: 'Partner 2 (Finance)', role: 'Managing Partner' },
];

export default function PartnerFinancesPage() {
  const transactions = useDemoStore((s) => s.partnerTransactions);
  const currentPartner = useAuthStore((s) => s.currentPartner);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partnerId, setPartnerId] = useState(currentPartner?.id || PARTNERS[0].id);
  const [txType, setTxType] = useState<TransactionType>('credit');
  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute ledgers for both partners
  const ledger1 = useMemo(() => getPartnerLedgerSummary(PARTNERS[0].id), [transactions]);
  const ledger2 = useMemo(() => getPartnerLedgerSummary(PARTNERS[1].id), [transactions]);

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountPaise = parseRupeesToPaise(amountRupees);
    if (amountPaise <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPartnerTransaction({
        gym_id: currentPartner?.gym_id || 'demo-gym-001',
        partner_id: partnerId,
        type: txType,
        amount_paise: amountPaise,
        description: description.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Failed to record transaction');
        setIsSubmitting(false);
        return;
      }

      setAmountRupees('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error recording transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Partner Capital & Draws</h1>
          <p className="text-xs text-slate-400">Equity contributions & drawings for both partners</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Capital / Draw</span>
        </button>
      </div>

      {/* Accounting Notice Banner */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start space-x-2.5 text-xs text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Strict P&L Separation:</strong> Partner capital investments and personal drawings
          are kept distinct from gym operating expenses (rent, power, staff) to ensure operating profit
          and gym valuation remain mathematically pure.
        </p>
      </div>

      {/* Partner Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Partner 1 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-xs">
                P1
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{PARTNERS[0].name}</h3>
                <p className="text-[11px] text-slate-400">{PARTNERS[0].role}</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              50% Stake
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Total Contributed</p>
              <p className="font-bold text-emerald-400 mt-0.5">
                {formatRupees(ledger1.total_contributed_paise)}
              </p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Total Withdrawn</p>
              <p className="font-bold text-rose-400 mt-0.5">
                {formatRupees(ledger1.total_withdrawn_paise)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Net Capital Balance:</span>
            <span className="text-base font-black text-white">
              {formatRupees(ledger1.net_balance_paise)}
            </span>
          </div>
        </div>

        {/* Partner 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs">
                P2
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{PARTNERS[1].name}</h3>
                <p className="text-[11px] text-slate-400">{PARTNERS[1].role}</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              50% Stake
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Total Contributed</p>
              <p className="font-bold text-emerald-400 mt-0.5">
                {formatRupees(ledger2.total_contributed_paise)}
              </p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Total Withdrawn</p>
              <p className="font-bold text-rose-400 mt-0.5">
                {formatRupees(ledger2.total_withdrawn_paise)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">Net Capital Balance:</span>
            <span className="text-base font-black text-white">
              {formatRupees(ledger2.net_balance_paise)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
          Recent Capital Ledger Entries
        </h3>

        {transactions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No partner transactions recorded</p>
            <p className="text-xs text-slate-500">
              Record initial gym equipment capital or personal draws here.
            </p>
          </div>
        ) : (
          transactions.map((tx) => {
            const partnerName =
              PARTNERS.find((p) => p.id === tx.partner_id)?.name || 'Partner';
            const isCredit = tx.type === 'credit';

            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      isCredit
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{tx.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {partnerName} •{' '}
                      <span className="capitalize">{tx.type.replace('_', ' ')}</span> •{' '}
                      {new Date(tx.transaction_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-black ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCredit ? '+' : '-'}
                    {formatRupees(tx.amount_paise)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Capital / Draw Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Record Capital / Draw</h2>
                  <p className="text-xs text-slate-400">Equity transaction for partner</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Partner Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Partner</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {PARTNERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('credit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      txType === 'credit'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Capital Deposit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('debit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      txType === 'debit'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Personal Draw (-)
                  </button>
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
                    placeholder="25000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Purchase of commercial treadmill / Monthly personal draw"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Save Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
