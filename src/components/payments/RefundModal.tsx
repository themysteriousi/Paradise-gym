import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import {
  processRefund,
  formatRupees,
  parseRupeesToPaise,
  getRefundsForPayment,
} from '@/services/paymentService';
import type { DbPayment, PaymentMethod } from '@/types/database';
import { X, RotateCcw, AlertCircle, AlertTriangle } from 'lucide-react';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: DbPayment | null;
  onSuccess: () => void;
}

export default function RefundModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: RefundModalProps) {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const members = useDemoStore((s) => s.members);

  const member = useMemo(() => {
    if (!payment) return null;
    return members.find((m) => m.id === payment.member_id);
  }, [members, payment]);

  const existingRefunds = useMemo(() => {
    if (!payment) return [];
    return getRefundsForPayment(payment.id);
  }, [payment]);

  const totalRefundedSoFar = useMemo(() => {
    return existingRefunds.reduce((sum, r) => sum + r.amount_paise, 0);
  }, [existingRefunds]);

  const maxRefundablePaise = useMemo(() => {
    if (!payment) return 0;
    return Math.max(0, payment.amount_paise - totalRefundedSoFar);
  }, [payment, totalRefundedSoFar]);

  const [refundRupees, setRefundRupees] = useState<string>(
    maxRefundablePaise ? (maxRefundablePaise / 100).toString() : '0'
  );
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'cash');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const refundPaise = parseRupeesToPaise(refundRupees);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (refundPaise <= 0) {
      setError('Please enter a valid refund amount.');
      return;
    }

    if (refundPaise > maxRefundablePaise) {
      setError(`Refund amount cannot exceed remaining refundable amount (${formatRupees(maxRefundablePaise)}).`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a mandatory reason for this refund.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processRefund({
        gym_id: payment.gym_id,
        payment_id: payment.id,
        processed_by: currentPartner?.id || 'demo-partner-001',
        amount_paise: refundPaise,
        method,
        reason: reason.trim(),
        reference: reference || null,
      });

      if (!res.success) {
        setError(res.error || 'Failed to process refund');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error processing refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Issue Refund</h2>
              <p className="text-xs text-slate-400">Non-destructive audit-logged payout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Context Snapshot */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Original Payment:</span>
              <span className="font-bold text-white">{formatRupees(payment.amount_paise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member:</span>
              <span className="text-white font-medium">{member?.full_name || 'Member'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Original Method:</span>
              <span className="uppercase font-mono text-slate-300">{payment.method}</span>
            </div>
            {totalRefundedSoFar > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Already Refunded:</span>
                <span>{formatRupees(totalRefundedSoFar)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold">
              <span className="text-slate-300">Max Refundable:</span>
              <span className="text-emerald-400">{formatRupees(maxRefundablePaise)}</span>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Refund Amount (₹)</label>
              <button
                type="button"
                onClick={() => setRefundRupees((maxRefundablePaise / 100).toString())}
                className="text-[11px] text-brand-400 hover:text-brand-300"
              >
                Max ({formatRupees(maxRefundablePaise)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={refundRupees}
                onChange={(e) => setRefundRupees(e.target.value)}
                placeholder="1000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="1"
                required
              />
            </div>
          </div>

          {/* Refund Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Payout Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'upi', 'card', 'bank_transfer'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 text-xs font-bold rounded-xl uppercase transition ${
                    method === m
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m === 'bank_transfer' ? 'Bank' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Payout Reference / UTR (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. REF-UPI-994827"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Reason for Refund <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear business justification (e.g. Member relocated to another city, medical issue)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This refund creates an immutable audit record processed by {currentPartner?.name || 'Partner'}.
              Original collections are preserved for tax and reporting accuracy.
            </span>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || maxRefundablePaise === 0}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Processing Refund...' : `Refund ${formatRupees(refundPaise)}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
