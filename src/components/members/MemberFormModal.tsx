import { useState } from 'react';
import { X, UserPlus, Phone, User, Calendar, FileText } from 'lucide-react';
import { memberService, CreateMemberInput } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: () => void;
}

export default function MemberFormModal({ isOpen, onClose, onMemberCreated }: MemberFormModalProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

      const input: CreateMemberInput = {
        gymId,
        fullName: trimmedName,
        phone: cleanPhone,
        email: email.trim() || null,
        gender,
        dateOfBirth: dateOfBirth || null,
        notes: notes.trim() || null,
      };

      await memberService.createMember(input);
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
            <UserPlus className="w-4 h-4 stroke-2 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Register New Member</h2>
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
              {submitting ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
