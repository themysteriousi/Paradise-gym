import { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, Calendar, FileText, Dumbbell, Flame, Edit2 } from 'lucide-react';
import { memberService, CreateMemberInput } from '@/services/memberService';
import { membershipService } from '@/services/membershipService';
import { generateMemberQrToken } from '@/services/qrService';
import { useAuthStore } from '@/stores/authStore';
import type { DbMember, DbMembershipPlan } from '@/types/database';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: () => void;
  memberToEdit?: DbMember | null;
}

export default function MemberFormModal({ isOpen, onClose, onMemberCreated, memberToEdit }: MemberFormModalProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [plans, setPlans] = useState<DbMembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.full_name || '');
      setPhone(memberToEdit.phone || '');
      setEmail(memberToEdit.email || '');
      setGender(memberToEdit.gender || 'male');
      setDateOfBirth(memberToEdit.date_of_birth ? memberToEdit.date_of_birth.slice(0, 10) : '');
      setNotes(memberToEdit.notes || '');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setGender('male');
      setDateOfBirth('');
      setNotes('');
    }
  }, [memberToEdit, isOpen]);

  useEffect(() => {
    const gymId = currentPartner?.gym_id || currentGym?.id;
    if (gymId && isOpen && !memberToEdit) {
      membershipService.getPlans(gymId).then((loaded) => {
        setPlans(loaded);
        if (loaded.length > 0) {
          setSelectedPlanId((prev) => (prev ? prev : loaded[0].id));
        }
      });
    }
  }, [currentPartner?.gym_id, currentGym?.id, isOpen, memberToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gymId = currentPartner?.gym_id || currentGym?.id;
    if (!gymId) {
      setErrorMsg('Gym configuration is missing. Please refresh or re-login.');
      return;
    }

    const trimmedName = fullName.trim();
    const rawPhone = phone.trim();

    if (!trimmedName || !rawPhone) {
      setErrorMsg('Full Name and Mobile Number are required.');
      return;
    }

    // Sanitize phone number (e.g. +91 7984889083, +917984889083, 07984889083 -> 7984889083)
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (memberToEdit) {
        await memberService.updateMember(memberToEdit.id, {
          fullName: trimmedName,
          phone: cleanPhone,
          email: email.trim() || null,
          gender,
          dateOfBirth: dateOfBirth || null,
          notes: notes.trim() || null,
        });

        onMemberCreated();
        onClose();
        return;
      }

      const input: CreateMemberInput = {
        gymId,
        fullName: trimmedName,
        phone: cleanPhone,
        email: email.trim() || null,
        gender,
        dateOfBirth: dateOfBirth || null,
        notes: notes.trim() || null,
      };

      const newMember = await memberService.createMember(input);

      // Attach selected plan if chosen
      if (selectedPlanId) {
        const plan = plans.find((p) => p.id === selectedPlanId);
        if (plan) {
          try {
            await membershipService.createMembership({
              gymId,
              memberId: newMember.id,
              planId: plan.id,
              pricePaise: plan.price_paise,
              paidPaise: 0,
              startDate: new Date(),
              durationDays: plan.duration_days || 30,
              partnerId: currentPartner?.id || 'desk-partner',
            });
          } catch (planErr) {
            console.warn('Initial plan assignment error:', planErr);
          }
        }
      }

      // Generate initial QR token for attendance
      try {
        await generateMemberQrToken({
          gym_id: gymId,
          member_id: newMember.id,
          expires_in_days: 365,
        });
      } catch (_) {}

      onMemberCreated();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to register member:', err);
      let message = 'Failed to register member.';
      if (err instanceof Error) {
        message = err.message;
      } else if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        message = (o.message as string) || (o.details as string) || (o.error_description as string) || message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14161c] border border-white/[0.1] rounded-2xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2 text-zinc-100">
            {memberToEdit ? (
              <Edit2 className="w-4 h-4 stroke-2 text-emerald-400" />
            ) : (
              <UserPlus className="w-4 h-4 stroke-2 text-emerald-400" />
            )}
            <h2 className="text-sm font-semibold text-zinc-100">
              {memberToEdit ? 'Edit Member Profile' : 'Register New Member'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-9 pr-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Mobile Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile (e.g. 9876543210)"
                className="w-full pl-9 pr-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-white/30"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">DOB (Optional)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>
          </div>

          {!memberToEdit && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Initial Membership Plan
                </label>
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 font-semibold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Diwali Offer Active
                </span>
              </div>
              <div className="relative">
                <Dumbbell className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400/50"
                >
                  {plans.length > 0 ? (
                    <>
                      <optgroup label="💥 Special Diwali & Opening Offer">
                        {plans
                          .filter((p) => p.id.includes('offer'))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Standard Regular Rates">
                        {plans
                          .filter((p) => !p.id.includes('offer'))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                            </option>
                          ))}
                      </optgroup>
                    </>
                  ) : (
                    <option value="">No active plans found</option>
                  )}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Notes / Preferences</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional member notes"
                className="w-full pl-9 pr-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-medium text-xs rounded-lg border border-white/[0.06] flex-1 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs rounded-lg flex-1 transition"
            >
              {submitting ? 'Saving...' : memberToEdit ? 'Update Member' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
