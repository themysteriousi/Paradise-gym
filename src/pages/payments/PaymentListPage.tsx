import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
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
  const currentGym = useAuthStore((s) => s.currentGym);

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
    <div className="space-y-3.5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Payments & Collections</h1>
          <p className="text-[11px] font-mono text-zinc-500">{payments.length} collections recorded</p>
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg transition flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#14161c] border border-white/[0.08] p-3 rounded-xl">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Total Collected</span>
          </div>
          <p className="text-base font-mono font-bold text-zinc-100">{formatRupees(summary.total_paise)}</p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{summary.count} txns</p>
        </div>

        <div className="bg-[#14161c] border border-white/[0.08] p-3 rounded-xl">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
            <Smartphone className="w-3 h-3 text-zinc-400" />
            <span>UPI Total</span>
          </div>
          <p className="text-base font-mono font-semibold text-zinc-200">{formatRupees(summary.upi_paise)}</p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Online transfers</p>
        </div>

        <div className="bg-[#14161c] border border-white/[0.08] p-3 rounded-xl">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
            <Banknote className="w-3 h-3 text-zinc-400" />
            <span>Cash Handover</span>
          </div>
          <p className="text-base font-mono font-semibold text-zinc-200">{formatRupees(summary.cash_paise)}</p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Physical desk</p>
        </div>

        <div className="bg-[#14161c] border border-white/[0.08] p-3 rounded-xl">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
            <CreditCard className="w-3 h-3 text-zinc-400" />
            <span>Card / Other</span>
          </div>
          <p className="text-base font-mono font-semibold text-zinc-200">
            {formatRupees(summary.card_paise + summary.other_paise)}
          </p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">POS & other</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, phone, or reference..."
            className="w-full bg-[#14161c] border border-white/[0.08] rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center justify-between overflow-x-auto pb-0.5 gap-2 text-xs">
          {/* Date Filter Tabs */}
          <div className="flex items-center space-x-1 shrink-0">
            {(['all', 'today', 'week', 'month'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition ${
                  dateFilter === df
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {df === 'all' ? 'All Time' : df}
              </button>
            ))}
          </div>

          {/* Method Filter Tabs */}
          <div className="flex items-center space-x-1 shrink-0">
            <Filter className="w-3 h-3 text-zinc-500 mr-0.5" />
            {(['all', 'upi', 'cash', 'card'] as const).map((mf) => (
              <button
                key={mf}
                onClick={() => setMethodFilter(mf)}
                className={`px-2 py-0.5 text-[11px] font-mono uppercase rounded-md transition ${
                  methodFilter === mf
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {mf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-1.5 touch-pan-y">
        {filteredPayments.length === 0 ? (
          <div className="bg-[#14161c] border border-white/[0.07] rounded-xl p-8 text-center space-y-1.5">
            <Receipt className="w-6 h-6 text-zinc-600 mx-auto" />
            <p className="text-xs font-medium text-zinc-300">No payment records found</p>
            <p className="text-[11px] text-zinc-500">
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
                className="bg-[#14161c] border border-white/[0.07] hover:border-white/[0.14] p-3 rounded-xl transition space-y-2 touch-pan-y"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center font-mono font-bold text-zinc-300 text-xs border border-white/[0.08] shrink-0">
                      {member?.full_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-100 leading-tight">
                        {member?.full_name || 'Member'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {member?.phone} • {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-zinc-100">{formatRupees(p.amount_paise)}</p>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase mt-0.5 ${
                        p.method === 'cash'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.04] text-zinc-300 border border-white/[0.08]'
                      }`}
                    >
                      {p.method}
                    </span>
                  </div>
                </div>

                {/* Sub details: reference, notes & action bar */}
                <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <div className="truncate max-w-[200px]">
                    {p.reference && (
                      <span className="font-mono text-[10px] text-zinc-500 mr-2">Ref: {p.reference}</span>
                    )}
                    {p.note && <span className="text-[11px] text-zinc-400 italic">{p.note}</span>}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-2 py-0.5 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] flex items-center space-x-1 text-[11px]"
                      title="View Digital Receipt"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>Receipt</span>
                    </button>
                    <button
                      onClick={() => (onOpenCorrection ? onOpenCorrection(p) : setCorrectionPayment(p))}
                      className="p-1 text-zinc-500 hover:text-amber-400 rounded hover:bg-white/[0.06]"
                      title="Correct Entry"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => (onOpenRefund ? onOpenRefund(p) : setRefundPayment(p))}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-white/[0.06]"
                      title="Issue Refund"
                    >
                      <RotateCcw className="w-3 h-3" />
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
              <p className="text-xs text-slate-400">
                {currentGym?.address || 'Lakshay Sarovar Kidana, Front of Lake'}
              </p>
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
