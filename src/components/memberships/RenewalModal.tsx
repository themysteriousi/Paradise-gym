import { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { DbMember, DbMembershipPlan, DbMembership, PaymentMethod } from '@/types/database';
import { membershipService } from '@/services/membershipService';
import { recordPayment } from '@/services/paymentService';
import { useAuthStore } from '@/stores/authStore';
import { generateDemoDataset } from '@/services/demoDataService';

interface RenewalModalProps {
  member: DbMember;
  isOpen: boolean;
  onClose: () => void;
  onRenewed: () => void;
}

export default function RenewalModal({ member, isOpen, onClose, onRenewed }: RenewalModalProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const [plans, setPlans] = useState<DbMembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | 'due'>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [activeMembership, setActiveMembership] = useState<DbMembership | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const gymId = currentGym?.id || currentPartner?.gym_id || 'demo-gym-001';
    membershipService.getPlans(gymId).then((p) => {
      const availablePlans = p && p.length > 0 ? p : generateDemoDataset().plans;
      setPlans(availablePlans);
      if (availablePlans.length > 0) {
        setSelectedPlanId((prev) =>
          prev && availablePlans.some((pl) => pl.id === prev) ? prev : availablePlans[0].id
        );
      }
    });

    membershipService.getMemberActiveMembership(member.id).then((ms) => {
      setActiveMembership(ms);
    });
  }, [currentGym, currentPartner?.gym_id, member.id, isOpen]);

  const offerPlans = useMemo(() => {
    return plans.filter((p) =>
      (p.id && p.id.includes('offer')) ||
      (p.name && (p.name.toLowerCase().includes('offer') || p.name.toLowerCase().includes('diwali')))
    );
  }, [plans]);

  const regularPlans = useMemo(() => {
    return plans.filter((p) => !offerPlans.some((o) => o.id === p.id));
  }, [plans, offerPlans]);

  if (!isOpen) return null;

  const isRenewal = activeMembership !== null;
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const basePrice = selectedPlan ? selectedPlan.price_paise / 100 : 0;
  const discount = Number(discountAmount) || 0;
  const finalPrice = Math.max(0, basePrice - discount);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym || !currentPartner || !selectedPlan) {
      setErrorMsg('Gym configuration or plan is missing.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const today = new Date();
      const currentExpiry = activeMembership ? new Date(activeMembership.end_date) : today;
      const duration = selectedPlan.duration_days || 30;
      const startDate = currentExpiry.getTime() > today.getTime() ? currentExpiry : today;
      const payablePaise = finalPrice * 100;
      const isPaid = paymentMode !== 'due';

      // 1. Create membership record
      await membershipService.createMembership({
        gymId: currentGym.id,
        memberId: member.id,
        planId: selectedPlan.id,
        pricePaise: payablePaise,
        paidPaise: isPaid ? payablePaise : 0,
        startDate,
        durationDays: duration,
        partnerId: currentPartner.id,
      });

      // 2. If fee collected right now, record payment transaction
      if (isPaid && payablePaise > 0) {
        await recordPayment({
          gym_id: currentGym.id,
          member_id: member.id,
          received_by: currentPartner.id,
          method: paymentMode as PaymentMethod,
          amount_paise: payablePaise,
          reference: paymentRef.trim() || null,
          note: `${selectedPlan.name} (${duration} days)`,
        });
      }

      onRenewed();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Plan assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14161c] border border-white/[0.1] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2 text-zinc-100">
            <RefreshCw className="w-4 h-4 stroke-2 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              {isRenewal ? 'Renew Membership' : 'Assign Membership Plan'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#0d0f12] p-2.5 rounded-lg border border-white/[0.06] text-xs">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Member</p>
          <p className="text-sm font-semibold text-zinc-100 mt-0.5">{member.full_name}</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRenew} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Select Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400/50"
            >
              {offerPlans.length > 0 && (
                <optgroup label="💥 Special Diwali & Opening Offer">
                  {offerPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{(p.price_paise / 100).toLocaleString('en-IN')} ({p.duration_days} days)
                    </option>
                  ))}
                </optgroup>
              )}
              {regularPlans.length > 0 && (
                <optgroup label="Standard Regular Rates">
                  {regularPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{(p.price_paise / 100).toLocaleString('en-IN')} ({p.duration_days} days)
                    </option>
                  ))}
                </optgroup>
              )}
              {offerPlans.length === 0 && regularPlans.length === 0 && plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{(p.price_paise / 100).toLocaleString('en-IN')} ({p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Promotional Discount (₹)</label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-white/30 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Payment Collection Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                  paymentMode === 'upi'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0d0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                UPI (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                  paymentMode === 'cash'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0d0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cash (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                  paymentMode === 'card'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0d0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Card (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('due')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                  paymentMode === 'due'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0d0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Mark as Due (Unpaid)
              </button>
            </div>
          </div>

          {paymentMode !== 'due' && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Reference / Transaction ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref # or receipt #"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          )}

          <div className="bg-[#0d0f12] p-3 rounded-lg border border-white/[0.06] space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Standard Price</span>
              <span className="font-mono">₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount</span>
                <span className="font-mono">- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-sm text-zinc-100 pt-1.5 border-t border-white/[0.08]">
              <span>Payable Amount</span>
              <span className="font-mono text-emerald-400">₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium rounded-lg border border-white/[0.06] flex-1 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg flex-1 flex items-center justify-center space-x-1 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-2" />
              <span>{submitting ? 'Saving...' : isRenewal ? 'Confirm Renewal' : 'Activate Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
