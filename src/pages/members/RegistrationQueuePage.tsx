import { useState, useEffect, useCallback } from 'react';
import { Check, X, Phone, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { registrationService, RegistrationSubmission } from '@/services/registrationService';
import { useAuthStore } from '@/stores/authStore';

interface RegistrationQueuePageProps {
  onBack: () => void;
  onMemberApproved?: () => void;
}

export default function RegistrationQueuePage({ onBack, onMemberApproved }: RegistrationQueuePageProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!currentGym) return;
    try {
      setLoading(true);
      const data = await registrationService.getPendingSubmissions(currentGym.id);
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }, [currentGym]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleApprove = async (sub: RegistrationSubmission) => {
    if (!currentPartner) return;
    try {
      setActionLoading(sub.id);
      await registrationService.approveSubmission(sub.id, currentPartner.id);
      await fetchQueue();
      if (onMemberApproved) onMemberApproved();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sub: RegistrationSubmission) => {
    if (!currentPartner) return;
    const reason = window.prompt('Reason for rejection (optional):');
    try {
      setActionLoading(sub.id);
      await registrationService.rejectSubmission(sub.id, currentPartner.id, reason || undefined);
      await fetchQueue();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
          {submissions.length} Pending
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
        <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Self-Registration Queue</h2>
          <p className="text-xs text-slate-400">Review requests submitted via public QR or link</p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading queue...</div>
        ) : submissions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-200">No Pending Submissions</p>
            <p className="text-xs text-slate-500">
              When members scan your gym self-registration QR code, their requests will appear here for 1-tap approval.
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const isProcessing = actionLoading === sub.id;

            return (
              <div
                key={sub.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{sub.full_name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sub.phone}</span>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800/60">
                    Pending
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 capitalize">
                    {sub.selected_plan_id.replace('plan-', '')} Plan
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReject(sub)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-xl border border-slate-700/60 transition flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(sub)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1 shadow-sm shadow-brand-500/20"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
