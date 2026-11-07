import React, { useState, useMemo } from 'react';
import { X, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { calculateClosureDays, createGymClosure } from '@/services/closureService';
import { useAuthStore } from '@/stores/authStore';

interface AddClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClosureAdded: () => void;
}

export default function AddClosureModal({
  isOpen,
  onClose,
  onClosureAdded,
}: AddClosureModalProps) {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const gymId = currentPartner?.gym_id || 'demo-gym-001';
  const partnerId = currentPartner?.id || 'demo-partner-001';

  const todayIso = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [reason, setReason] = useState('');
  const [autoExtend, setAutoExtend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationDays = useMemo(() => {
    try {
      if (!startDate || !endDate) return 0;
      return calculateClosureDays(startDate, endDate);
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the closure');
      return;
    }

    if (durationDays <= 0) {
      setError('End date cannot be before start date');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createGymClosure({
        gym_id: gymId,
        created_by: partnerId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        auto_extend: autoExtend,
      });

      if (!res.success) {
        setError(res.error || 'Failed to record closure');
        setIsSubmitting(false);
        return;
      }

      onClosureAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Record Gym Closure</h2>
              <p className="text-xs text-slate-400">Shutdowns, festivals & maintenance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Closure Reason / Occasion *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diwali Holiday, AC Overhaul, Painting"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Duration Preview Box */}
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-slate-300 font-medium">Calculated Duration:</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                durationDays > 0
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {durationDays > 0 ? `${durationDays} Day${durationDays > 1 ? 's' : ''}` : 'Invalid range'}
            </span>
          </div>

          {/* Auto Extend Option */}
          <div className="p-3 bg-brand-950/30 border border-brand-800/40 rounded-xl space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoExtend}
                onChange={(e) => setAutoExtend(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500 focus:ring-offset-slate-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-brand-200 block">
                  Automatically extend active memberships
                </span>
                <span className="text-[11px] text-brand-300/80 block leading-tight">
                  Pushes current expiry dates forward by {durationDays > 0 ? durationDays : 0} days for
                  all active members whose plans overlap this shutdown.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || durationDays <= 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-brand-500/20"
            >
              <span>{isSubmitting ? 'Saving...' : 'Confirm Closure'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
