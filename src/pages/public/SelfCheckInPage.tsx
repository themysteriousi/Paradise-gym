import { useState, useEffect } from 'react';
import { Dumbbell, CheckCircle2, AlertCircle, Clock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { processMemberCheckIn, type CheckInResult } from '@/services/attendanceService';

interface SelfCheckInPageProps {
  gymId?: string;
}

const STORAGE_KEY = 'paradise_last_checkin_phone';

export default function SelfCheckInPage({ gymId = 'demo-gym-001' }: SelfCheckInPageProps) {
  const [phone, setPhone] = useState('');
  const [hasRememberedPhone, setHasRememberedPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill from previous successful check-in
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.length === 10) {
        setPhone(saved);
        setHasRememberedPhone(true);
      }
    } catch (_) {}
  }, []);

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    let cleanPhone = phone.trim().replace(/\D/g, '');
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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Check-in request timed out. Please check your network or try again.'
              )
            ),
          7000
        )
      );

      const checkInPromise = processMemberCheckIn({
        gym_id: gymId,
        phone: cleanPhone,
        method: 'kiosk',
        note: 'Wall QR Self-Checkin',
      });

      const res = await Promise.race([checkInPromise, timeoutPromise]);

      if (!res.success) {
        setErrorMsg(res.error || 'Check-in failed. Please verify your number.');
        return;
      }

      // Save for 1-tap next time
      try {
        localStorage.setItem(STORAGE_KEY, cleanPhone);
      } catch (_) {}

      setResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setResult(null);
    setPhone('');
    setHasRememberedPhone(false);
    setErrorMsg('');
  };

  // SUCCESS CONFIRMATION VIEW
  if (result && result.member) {
    const { member, isDuplicateWarning, statusWarning, hasOutstandingDues, planName, daysRemaining } = result;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="min-h-[100dvh] bg-[#0d0f12] text-zinc-100 flex flex-col justify-center items-center px-4 py-8 select-none">
        <div className="max-w-sm w-full bg-[#14161c] border border-white/[0.08] rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
          {/* Animated Success Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 stroke-[2.25]" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Attendance Marked
            </span>
            <h2 className="text-xl font-bold text-zinc-100 mt-2 tracking-tight">
              Welcome, {member.full_name}!
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Arrival: {nowTime} • Today
            </p>
          </div>

          {/* Membership Status & Days Remaining */}
          <div className="p-3.5 bg-[#0d0f12] rounded-xl border border-white/[0.06] text-left space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Membership Plan</span>
              <span className="font-mono text-emerald-400 font-semibold">{planName || 'Active'}</span>
            </div>
            {daysRemaining !== undefined && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-white/[0.05]">
                <span className="text-zinc-500 font-mono">Plan Validity</span>
                <span className="font-mono text-zinc-300">
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expiring today'}
                </span>
              </div>
            )}
          </div>

          {/* Duplicate / Re-scan Notice */}
          {isDuplicateWarning && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center space-x-2 text-xs text-amber-300 text-left">
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="text-[11px]">You already checked in earlier today. Logged rescan!</span>
            </div>
          )}

          {/* Status / Expiry Alert if any */}
          {statusWarning && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-xs text-rose-300 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="text-[11px] font-medium">{statusWarning}</span>
            </div>
          )}

          {hasOutstandingDues && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center space-x-2 text-xs text-amber-300 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="text-[11px]">Friendly reminder: You have an instalment due at the desk.</span>
            </div>
          )}

          <p className="text-xs text-zinc-400 font-medium pt-1">
            Have a great workout session! 💪🔥
          </p>

          <div className="pt-2">
            <button
              onClick={handleResetForAnother}
              className="w-full h-9 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium rounded-lg border border-white/[0.08] transition"
            >
              Check In Another Member
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT CHECK-IN FORM
  return (
    <div className="min-h-[100dvh] bg-[#0d0f12] text-zinc-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-sm w-full space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400 items-center justify-center shadow-lg">
            <Dumbbell className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Paradise Gym</h1>
          <p className="text-xs font-mono text-zinc-400">Self-Attendance Check-In</p>
        </div>

        {/* Input Card */}
        <div className="bg-[#14161c] border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark Today&apos;s Attendance</span>
            </h2>
            <p className="text-[11px] text-zinc-500">
              Enter your registered mobile number to check in
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl space-y-1 text-left">
              <div className="flex items-center space-x-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <p className="text-[10px] text-zinc-400 pl-5">
                Not a member yet?{' '}
                <a
                  href={`/?register=true&gym=${gymId}`}
                  className="text-emerald-400 underline font-medium"
                >
                  Register here
                </a>
              </p>
            </div>
          )}

          <form onSubmit={handleCheckIn} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-zinc-500 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  autoFocus={!hasRememberedPhone}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setHasRememberedPhone(false);
                  }}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-3 py-2 bg-[#0d0f12] border border-white/[0.08] rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 tracking-wider"
                />
              </div>
              {hasRememberedPhone && (
                <p className="text-[10px] font-mono text-emerald-400/80 mt-1 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Remembered from your last visit</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || phone.length < 10}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <span>{submitting ? 'Checking in...' : hasRememberedPhone ? 'Mark Present (1-Tap)' : 'Check In Now'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <p className="text-[10px] text-zinc-600 font-mono text-center">
            Zero app installation required • Instant attendance
          </p>
        </div>
      </div>
    </div>
  );
}

