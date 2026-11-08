import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import {
  recordPayment,
  formatRupees,
  parseRupeesToPaise,
  calculateFifoAllocation,
  type PaymentSplitInput,
  type OutstandingCharge,
} from '@/services/paymentService';
import type { PaymentMethod } from '@/types/database';
import { X, Check, AlertCircle, QrCode, Plus, Trash2, IndianRupee } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMemberId?: string;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialMemberId,
}: RecordPaymentModalProps) {
  const members = useDemoStore((s) => s.members);
  const currentPartner = useAuthStore((s) => s.currentPartner);

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (members[0]?.id ?? '')
  );
  const [amountRupees, setAmountRupees] = useState<string>('1500');
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [singleMethod, setSingleMethod] = useState<PaymentMethod>('upi');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showUpiQr, setShowUpiQr] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Split payments state
  const [splits, setSplits] = useState<PaymentSplitInput[]>([
    { method: 'cash', amount_paise: 50000 },
    { method: 'upi', amount_paise: 100000, reference: '' },
  ]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId]
  );

  // Mock outstanding charges for the member (in real system, queries charges/memberships)
  const outstandingCharges: OutstandingCharge[] = useMemo(() => {
    if (!selectedMember) return [];
    const isDue = selectedMember.notes?.includes('Pending') || selectedMember.id === 'demo-member-1';
    if (isDue) {
      return [
        {
          id: `charge-due-${selectedMember.id}-1`,
          member_id: selectedMember.id,
          amount_paise: 150000,
          balance_paise: 100000,
          due_date: '2026-02-01',
        },
      ];
    }
    return [];
  }, [selectedMember]);

  const totalPaise = parseRupeesToPaise(amountRupees);

  // Split sum calculation
  const splitSumPaise = useMemo(
    () => splits.reduce((acc, curr) => acc + curr.amount_paise, 0),
    [splits]
  );
  const splitDiffPaise = totalPaise - splitSumPaise;

  // FIFO Preview
  const fifoPreview = useMemo(
    () => calculateFifoAllocation(totalPaise, outstandingCharges),
    [totalPaise, outstandingCharges]
  );

  if (!isOpen) return null;

  const handleAddSplitRow = () => {
    setSplits((prev) => [...prev, { method: 'cash', amount_paise: 0 }]);
  };

  const handleRemoveSplitRow = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSplit = (index: number, field: keyof PaymentSplitInput, value: unknown) => {
    setSplits((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalPaise <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (!selectedMemberId) {
      setErrorMessage('Please select a member.');
      return;
    }

    if (paymentMode === 'split' && splitDiffPaise !== 0) {
      setErrorMessage(`Split payments must equal total amount. Difference: ${formatRupees(Math.abs(splitDiffPaise))}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordPayment({
        gym_id: selectedMember?.gym_id || 'demo-gym-001',
        member_id: selectedMemberId,
        received_by: currentPartner?.id || 'demo-partner-001',
        method: paymentMode === 'split' ? 'split' : singleMethod,
        amount_paise: totalPaise,
        reference: reference || null,
        note: note || null,
        splits: paymentMode === 'split' ? splits : undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to record payment');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPI deep link
  const upiPayload = `upi://pay?pa=paradisegym@upi&pn=Paradise%20Gym&am=${(totalPaise / 100).toFixed(2)}&cu=INR&tn=Gym%20Fees%20${selectedMember?.full_name || ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#14161c] border border-white/[0.1] rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-white/[0.06] text-emerald-400 border border-white/[0.08] flex items-center justify-center">
              <IndianRupee className="w-4 h-4 stroke-2" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Record Payment</h2>
              <p className="text-[10px] font-mono text-zinc-500">Cash, UPI & Split Collections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {errorMessage && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-rose-300 font-mono text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Member Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Select Member</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-[#0d0f12] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-white/30"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Dues Alert if member has outstanding */}
          {outstandingCharges.length > 0 && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-400">Outstanding Due Found</p>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Due since {outstandingCharges[0].due_date}: {formatRupees(outstandingCharges[0].balance_paise)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAmountRupees((outstandingCharges[0].balance_paise / 100).toString())}
                className="text-xs px-2.5 py-1 bg-amber-500 text-black font-semibold rounded-md hover:bg-amber-400 transition"
              >
                Clear Due
              </button>
            </div>
          )}

          {/* Total Payment Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-500 font-mono text-sm">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="1500"
                className="w-full bg-[#0d0f12] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-white/30 tabular-nums"
                min="1"
                required
              />
            </div>
            {/* Quick Amount Pills */}
            <div className="flex items-center space-x-1.5 pt-0.5 overflow-x-auto">
              {[500, 1000, 1500, 2000, 3800, 12000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountRupees(amt.toString())}
                  className="px-2 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-mono text-[11px] rounded-md border border-white/[0.06] transition shrink-0"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode Selector: Single vs Split */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Payment Structure</label>
            <div className="grid grid-cols-2 gap-2 bg-[#0d0f12] p-1 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPaymentMode('single')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition ${
                  paymentMode === 'single'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Single Method
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('split')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition ${
                  paymentMode === 'split'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Split (Cash + UPI)
              </button>
            </div>
          </div>

          {/* Single Method Mode */}
          {paymentMode === 'single' && (
            <div className="space-y-3 p-3 bg-[#0d0f12] rounded-lg border border-white/[0.06]">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['upi', 'cash', 'card', 'bank_transfer'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSingleMethod(m)}
                      className={`py-1.5 rounded-md text-xs font-mono uppercase transition ${
                        singleMethod === m
                          ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                          : 'bg-white/[0.02] text-zinc-400 border border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {m === 'bank_transfer' ? 'Bank' : m}
                    </button>
                  ))}
                </div>
              </div>

              {singleMethod === 'upi' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">UPI Reference / UTR</label>
                    <button
                      type="button"
                      onClick={() => setShowUpiQr(!showUpiQr)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showUpiQr ? 'Hide QR' : 'Show UPI QR'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 412389102488"
                    className="w-full bg-[#14161c] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 font-mono"
                  />

                  {showUpiQr && (
                    <div className="p-3 bg-[#14161c] border border-white/[0.08] rounded-lg text-center space-y-2">
                      <p className="text-xs text-zinc-300 font-medium">Scan with GPay / PhonePe / Paytm</p>
                      <div className="inline-block p-2 bg-white rounded-lg">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiPayload)}`}
                          alt="UPI QR Code"
                          className="w-32 h-32 mx-auto"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">VPA: paradisegym@upi</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Split Payment Mode */}
          {paymentMode === 'split' && (
            <div className="space-y-3 p-3 bg-[#0d0f12] rounded-lg border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200">Split Breakdown</label>
                <button
                  type="button"
                  onClick={handleAddSplitRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Split</span>
                </button>
              </div>

              <div className="space-y-2">
                {splits.map((split, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <select
                      value={split.method}
                      onChange={(e) => handleUpdateSplit(idx, 'method', e.target.value as PaymentMethod)}
                      className="bg-[#14161c] border border-white/[0.08] text-xs rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-white/30 font-mono"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank</option>
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500 font-mono">₹</span>
                      <input
                        type="number"
                        value={split.amount_paise / 100}
                        onChange={(e) =>
                          handleUpdateSplit(idx, 'amount_paise', parseRupeesToPaise(e.target.value))
                        }
                        className="w-full bg-[#14161c] border border-white/[0.08] rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono font-semibold text-zinc-100 focus:outline-none focus:border-white/30"
                        placeholder="Amount"
                        min="0"
                      />
                    </div>

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitRow(idx)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Split Summary Validation */}
              <div
                className={`p-2.5 rounded-lg text-xs font-mono flex items-center justify-between border ${
                  splitDiffPaise === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <span>Splits Total: {formatRupees(splitSumPaise)}</span>
                {splitDiffPaise === 0 ? (
                  <span className="flex items-center space-x-1 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Exact Match</span>
                  </span>
                ) : (
                  <span className="font-semibold">
                    {splitDiffPaise > 0 ? `Remaining: ${formatRupees(splitDiffPaise)}` : `Over by: ${formatRupees(Math.abs(splitDiffPaise))}`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* FIFO Allocation Preview */}
          {outstandingCharges.length > 0 && (
            <div className="p-2.5 bg-[#0d0f12] rounded-lg border border-white/[0.06] text-xs font-mono space-y-1">
              <p className="font-semibold text-zinc-300">FIFO Clearance Preview:</p>
              {fifoPreview.allocations.map((a, i) => (
                <p key={i} className="text-zinc-400">
                  • Clearing {formatRupees(a.allocated_paise)} against due (remaining: {formatRupees(a.remaining_balance_paise)})
                </p>
              ))}
              {fifoPreview.unallocated_paise > 0 && (
                <p className="text-emerald-400 font-medium">
                  • Advance Credit: {formatRupees(fifoPreview.unallocated_paise)}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Internal Note / Memo (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid in full for 3-month renewal"
              className="w-full bg-[#0d0f12] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || (paymentMode === 'split' && splitDiffPaise !== 0)}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg transition text-xs flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-2" />
                  <span>Collect {formatRupees(totalPaise)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
