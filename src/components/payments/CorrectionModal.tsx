import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import {
  correctPayment,
  formatRupees,
  parseRupeesToPaise,
} from '@/services/paymentService';
import type { DbPayment, PaymentMethod } from '@/types/database';
import { X, Edit3, AlertCircle, AlertTriangle, Check } from 'lucide-react';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: DbPayment | null;
  onSuccess: () => void;
}

export default function CorrectionModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: CorrectionModalProps) {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const members = useDemoStore((s) => s.members);

  const member = useMemo(() => {
    if (!payment) return null;
    return members.find((m) => m.id === payment.member_id);
  }, [members, payment]);

  const [amountRupees, setAmountRupees] = useState<string>(
    payment ? (payment.amount_paise / 100).toString() : '0'
  );
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'cash');
  const [reference, setReference] = useState<string>(payment?.reference || '');
  const [note, setNote] = useState<string>(payment?.note || '');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const newAmountPaise = parseRupeesToPaise(amountRupees);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newAmountPaise <= 0) {
      setError('Corrected amount must be greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a mandatory audit reason explaining this correction.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await correctPayment({
        payment_id: payment.id,
        corrected_by: currentPartner?.id || 'demo-partner-001',
        reason: reason.trim(),
        new_method: method,
        new_amount_paise: newAmountPaise,
        new_reference: reference || null,
        new_note: note || null,
      });

      if (!res.success) {
        setError(res.error || 'Failed to correct payment');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error applying correction');
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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Correct Payment Entry</h2>
              <p className="text-xs text-slate-400">Clerical mistake adjustment with audit trail</p>
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

          {/* Current Original Context */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Member:</span>
              <span className="font-bold text-white">{member?.full_name || 'Member'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Original Amount:</span>
              <span className="line-through text-slate-500 font-mono">
                {formatRupees(payment.amount_paise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Original Method:</span>
              <span className="uppercase text-slate-400 font-mono">{payment.method}</span>
            </div>
            {payment.reference && (
              <div className="flex justify-between">
                <span className="text-slate-400">Original Ref:</span>
                <span className="text-slate-400 font-mono">{payment.reference}</span>
              </div>
            )}
          </div>

          {/* Corrected Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Corrected Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="1500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="1"
                required
              />
            </div>
          </div>

          {/* Corrected Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Corrected Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'upi', 'card', 'bank_transfer'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 text-xs font-bold rounded-xl uppercase transition ${
                    method === m
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m === 'bank_transfer' ? 'Bank' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Corrected Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Reference / UTR (Optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI-CORRECTED-12345"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Corrected Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Updated Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Corrected note details"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Audit Reason for Correction <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Typo: recorded ₹15,000 instead of ₹1,500; corrected payment method from Cash to UPI..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              The original record will be marked superseded. A linked corrected record will be created
              with author attribution to {currentPartner?.name || 'Partner'}.
            </span>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Applying Correction...' : 'Apply Correction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
