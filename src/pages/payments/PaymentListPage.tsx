import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { formatRupees, getPaymentSummary } from '@/services/paymentService';
import type { DbPayment } from '@/types/database';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import RefundModal from '@/components/payments/RefundModal';
import CorrectionModal from '@/components/payments/CorrectionModal';
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  Receipt,
  FileCheck,
  RotateCcw,
  Edit3,
} from 'lucide-react';

interface PaymentListPageProps {
  onOpenRefund?: (payment: DbPayment) => void;
  onOpenCorrection?: (payment: DbPayment) => void;
}

export default function PaymentListPage({
  onOpenRefund,
  onOpenCorrection,
}: PaymentListPageProps) {
  const payments = useDemoStore((s) => s.payments);
  const members = useDemoStore((s) => s.members);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'upi' | 'card'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<DbPayment | null>(null);
  const [refundPayment, setRefundPayment] = useState<DbPayment | null>(null);
  const [correctionPayment, setCorrectionPayment] = useState<DbPayment | null>(null);

  // Compute member lookup map for O(1) details
  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m.id, m]));
  }, [members]);

  // Overall financial summary for active filter
  const summary = useMemo(() => getPaymentSummary(payments), [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const now = new Date();

    return payments.filter((p) => {
      // Method filter
      if (methodFilter !== 'all' && p.method !== methodFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const pDate = new Date(p.paid_at);
        if (dateFilter === 'today') {
          const isToday =
            pDate.getDate() === now.getDate() &&
            pDate.getMonth() === now.getMonth() &&
            pDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
          if (pDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const isThisMonth =
            pDate.getMonth() === now.getMonth() &&
            pDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const member = memberMap.get(p.member_id);
        const memberName = member?.full_name?.toLowerCase() || '';
        const memberPhone = member?.phone || '';
        const ref = p.reference?.toLowerCase() || '';
        const note = p.note?.toLowerCase() || '';

        return (
          memberName.includes(query) ||
          memberPhone.includes(query) ||
          ref.includes(query) ||
          note.includes(query)
        );
      }

      return true;
    });
  }, [payments, methodFilter, dateFilter, searchQuery, memberMap]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Payments & Collections</h1>
          <p className="text-xs text-slate-400">Total {payments.length} collections recorded</p>
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            <span>Total Collected</span>
          </div>
          <p className="text-lg font-black text-white">{formatRupees(summary.total_paise)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{summary.count} transactions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>UPI Total</span>
          </div>
          <p className="text-lg font-black text-sky-400">{formatRupees(summary.upi_paise)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Instant online</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cash Handover</span>
          </div>
          <p className="text-lg font-black text-emerald-400">{formatRupees(summary.cash_paise)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Physical desk</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>Card / Other</span>
          </div>
          <p className="text-lg font-black text-purple-400">
            {formatRupees(summary.card_paise + summary.other_paise)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">POS & Netbanking</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name, phone, or reference..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
          {/* Date Filter Pills */}
          <div className="flex items-center space-x-1 shrink-0">
            {(['all', 'today', 'week', 'month'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  dateFilter === df
                    ? 'bg-slate-800 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                {df === 'all' ? 'All Time' : df}
              </button>
            ))}
          </div>

          {/* Method Filter Pills */}
          <div className="flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {(['all', 'upi', 'cash', 'card'] as const).map((mf) => (
              <button
                key={mf}
                onClick={() => setMethodFilter(mf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase transition ${
                  methodFilter === mf
                    ? 'bg-brand-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                {mf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-2">
        {filteredPayments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No payment records found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your date/method filters or record a new collection.
            </p>
          </div>
        ) : (
          filteredPayments.map((p) => {
            const member = memberMap.get(p.member_id);
            const formattedDate = new Date(p.paid_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-3.5 rounded-2xl transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs border border-slate-700/50 shrink-0">
                      {member?.full_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {member?.full_name || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {member?.phone} • {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-white">{formatRupees(p.amount_paise)}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mt-0.5 ${
                        p.method === 'upi'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : p.method === 'cash'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {p.method}
                    </span>
                  </div>
                </div>

                {/* Sub details: reference, notes & action bar */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="truncate max-w-[200px]">
                    {p.reference && (
                      <span className="font-mono text-[11px] text-slate-500 mr-2">Ref: {p.reference}</span>
                    )}
                    {p.note && <span className="text-[11px] italic">{p.note}</span>}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center space-x-1"
                      title="View Digital Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Receipt</span>
                    </button>
                    <button
                      onClick={() => (onOpenCorrection ? onOpenCorrection(p) : setCorrectionPayment(p))}
                      className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
                      title="Correct Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => (onOpenRefund ? onOpenRefund(p) : setRefundPayment(p))}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      title="Issue Refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => setIsRecordModalOpen(false)}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={!!refundPayment}
        payment={refundPayment}
        onClose={() => setRefundPayment(null)}
        onSuccess={() => setRefundPayment(null)}
      />

      {/* Correction Modal */}
      <CorrectionModal
        isOpen={!!correctionPayment}
        payment={correctionPayment}
        onClose={() => setCorrectionPayment(null)}
        onSuccess={() => setCorrectionPayment(null)}
      />

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Official Receipt</p>
              <h3 className="text-xl font-black text-white mt-0.5">Paradise Gym</h3>
              <p className="text-xs text-slate-400">Civil Lines, Paradise City</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt ID:</span>
                <span className="font-mono text-white">{selectedReceipt.id.slice(0, 12)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-white">
                  {memberMap.get(selectedReceipt.member_id)?.full_name || 'Member'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-white">
                  {new Date(selectedReceipt.paid_at).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="uppercase font-bold text-white">{selectedReceipt.method}</span>
              </div>
              {selectedReceipt.reference && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-white">{selectedReceipt.reference}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                <span className="text-slate-200">Amount Paid:</span>
                <span className="text-emerald-400">{formatRupees(selectedReceipt.amount_paise)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
