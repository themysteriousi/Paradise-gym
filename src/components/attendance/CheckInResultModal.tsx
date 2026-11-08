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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#14161c] border border-white/[0.1] rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl relative space-y-3.5">
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Primary Status Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6 stroke-2" />
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Check-In Confirmed
          </span>
          <h2 className="text-base font-semibold text-zinc-100 mt-2 leading-tight">
            {member.full_name}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            {member.phone} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Membership Status Badge */}
        <div className="p-2.5 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span>Membership</span>
          </span>
          <span
            className={`font-mono capitalize px-2 py-0.5 rounded text-[10px] ${
              member.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Warnings if any */}
        {isDuplicateWarning && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center space-x-2 text-xs text-amber-300 text-left">
            <Clock className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="text-[11px]">Member already checked in earlier today. Logged rescan.</span>
          </div>
        )}

        {statusWarning && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-xs text-rose-300 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-[11px] font-medium">{statusWarning}</span>
          </div>
        )}

        {hasOutstandingDues && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs text-left">
            <div className="flex items-center space-x-2 text-amber-300">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium">Pending instalment due</span>
            </div>
            {onCollectPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCollectPayment(member.id);
                }}
                className="px-2 py-1 bg-amber-500 text-black font-semibold rounded text-[10px] hover:bg-amber-400 transition"
              >
                Collect
              </button>
            )}
          </div>
        )}

        {/* Auto dismiss countdown footer */}
        <p className="text-[10px] font-mono text-zinc-500 pt-0.5">
          Auto-closing in 4s • Tap to dismiss
        </p>
      </div>
    </div>
  );
}

