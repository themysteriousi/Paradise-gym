import { useEffect } from 'react';
import type { CheckInResult } from '@/services/attendanceService';
import {
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Clock,
  X,
  User,
} from 'lucide-react';

interface CheckInResultModalProps {
  result: CheckInResult | null;
  onClose: () => void;
  onCollectPayment?: (memberId: string) => void;
}

export default function CheckInResultModal({
  result,
  onClose,
  onCollectPayment,
}: CheckInResultModalProps) {
  // Auto dismiss after 4 seconds
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [result, onClose]);

  if (!result || !result.member) return null;

  const { member, isDuplicateWarning, statusWarning, hasOutstandingDues } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative space-y-4">
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Primary Status Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Check-In Confirmed
          </span>
          <h2 className="text-xl font-black text-white mt-2 leading-tight">
            {member.full_name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {member.phone} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Membership Status Badge */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Membership:</span>
          </span>
          <span
            className={`font-bold capitalize px-2 py-0.5 rounded-md text-[11px] ${
              member.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Warnings if any */}
        {isDuplicateWarning && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center space-x-2 text-xs text-amber-300 text-left">
            <Clock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Member already checked in earlier today. Logged rescan.</span>
          </div>
        )}

        {statusWarning && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-2 text-xs text-rose-400 text-left font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{statusWarning}</span>
          </div>
        )}

        {hasOutstandingDues && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-left">
            <div className="flex items-center space-x-2 text-amber-300">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pending instalment due!</span>
            </div>
            {onCollectPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCollectPayment(member.id);
                }}
                className="px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-400 transition"
              >
                Collect
              </button>
            )}
          </div>
        )}

        {/* Auto dismiss countdown footer */}
        <p className="text-[10px] text-slate-400 pt-1">
          Auto-closing in 4s • Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}

