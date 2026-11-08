import { useState } from 'react';
import { Dumbbell, ArrowRight, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { registrationService } from '@/services/registrationService';

interface RegisterPageProps {
  gymId?: string;
  onSuccess?: () => void;
}

export default function RegisterPage({ gymId = 'demo-gym-001', onSuccess }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('plan-monthly');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = fullName.trim();
    const rawPhone = phone.trim();

    if (!trimmedName || !rawPhone) {
      setErrorMsg('Full Name and Mobile Number are required.');
      return;
    }

    // Sanitize phone number (strip +91, spaces, dashes)
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
      setLoading(true);
      await registrationService.submitRegistration({
        gymId,
        fullName: trimmedName,
        phone: cleanPhone,
        selectedPlanId,
        email: email.trim() || null,
        gender,
        dateOfBirth: dateOfBirth || null,
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Failed to submit registration:', err);
      let message = 'Registration failed. Please check your details.';
      if (err instanceof Error) {
        message = err.message;
      } else if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        message = (o.message as string) || (o.details as string) || (o.error_description as string) || message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col justify-center px-4 py-8">
        <div className="max-w-md w-full mx-auto bg-[#14161c] border border-white/[0.08] rounded-xl p-6 text-center space-y-3.5 shadow-2xl">
          <div className="inline-flex p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-zinc-100">Registration Submitted</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Welcome to Paradise Gym. Your submission has been received for front-desk verification and activation. Your digital access pass will be generated shortly.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setSubmitted(false)}
              className="h-9 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium rounded-lg border border-white/[0.06] transition"
            >
              Submit Another Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-100 items-center justify-center">
            <Dumbbell className="w-5 h-5 stroke-[2]" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Paradise Gym</h1>
          <p className="text-xs font-mono text-zinc-500">Member Registration Desk</p>
        </div>

        {/* Form Container */}
        <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Member Enrollment</span>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sahil Varma"
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Mobile Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Select Membership Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-white/30"
              >
                <option value="plan-monthly">Monthly Standard — ₹1,500/month</option>
                <option value="plan-quarterly">Quarterly Value — ₹3,800/3 months</option>
                <option value="plan-yearly">Annual Champion — ₹12,000/year</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-white/30"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-2 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@gmail.com"
                className="w-full px-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Submitting...' : 'Submit Registration'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-1 flex items-center justify-center space-x-1.5 text-[10px] text-zinc-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Encrypted transmission • Paradise Gym Terminal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
