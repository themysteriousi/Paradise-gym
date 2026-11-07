import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { DbMember, DbMembershipPlan } from '@/types/database';
import { membershipService } from '@/services/membershipService';
import { useAuthStore } from '@/stores/authStore';

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!currentGym) return;
    membershipService.getPlans(currentGym.id).then((p) => {
      setPlans(p);
      if (p.length > 0) setSelectedPlanId(p[0].id);
    });
  }, [currentGym]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const basePrice = selectedPlan ? selectedPlan.price_paise / 100 : 0;
  const discount = Number(discountAmount) || 0;
  const finalPrice = Math.max(0, basePrice - discount);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym || !currentPartner || !selectedPlan) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      // Check current active membership to calculate early extension
      const activeMs = await membershipService.getMemberActiveMembership(member.id);
      const today = new Date();
      const currentExpiry = activeMs ? new Date(activeMs.end_date) : today;
      const duration = selectedPlan.duration_days || 30;

      const newExpiry = membershipService.calculateRenewalExpiry(currentExpiry, today, duration);
      const startDate = currentExpiry.getTime() > today.getTime() ? currentExpiry : today;

      await membershipService.createMembership({
        gymId: currentGym.id,
        memberId: member.id,
        planId: selectedPlan.id,
        pricePaise: finalPrice * 100,
        startDate,
        durationDays: duration,
        partnerId: currentPartner.id,
      });

      alert(`Membership successfully renewed until ${newExpiry.toLocaleDateString('en-IN')}!`);
      onRenewed();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Renewal failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-brand-500">
            <RefreshCw className="w-5 h-5 stroke-[2.5]" />
            <h2 className="text-base font-bold text-white">Renew Membership</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
          <p className="text-slate-400">Member</p>
          <p className="text-sm font-bold text-white">{member.full_name}</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRenew} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Renewal Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price_paise / 100} ({p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Promotional Discount (₹)</label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
            />
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Standard Price:</span>
              <span>₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount:</span>
                <span>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
              <span>Payable Amount:</span>
              <span className="text-brand-500">₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-bold rounded-xl flex-1 shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-1"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? 'Renewing...' : 'Confirm Renewal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
