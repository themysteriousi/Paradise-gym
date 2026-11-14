import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Phone, UserCheck, AlertCircle, ArrowLeft, QrCode, Copy, ExternalLink, Download } from 'lucide-react';
import { registrationService, RegistrationSubmission } from '@/services/registrationService';
import { cardGeneratorService } from '@/services/cardGeneratorService';
import { membershipService } from '@/services/membershipService';
import type { DbMembershipPlan } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';

interface RegistrationQueuePageProps {
  onBack: () => void;
  onMemberApproved?: () => void;
}

export default function RegistrationQueuePage({ onBack, onMemberApproved }: RegistrationQueuePageProps) {
  const currentGym = useAuthStore((s) => s.currentGym);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [plans, setPlans] = useState<DbMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [entranceQrDataUrl, setEntranceQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const qrPosterRef = useRef<HTMLDivElement>(null);

  const baseOrigin = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://paradise-gym-e3f.pages.dev'
        : window.location.origin)
    : 'https://paradise-gym-e3f.pages.dev';

  const registrationUrl = `${baseOrigin}/?register=true&gym=${currentGym?.id || 'demo-gym-001'}`;

  useEffect(() => {
    if (registrationUrl) {
      cardGeneratorService.generateQRCodeDataUrl(registrationUrl).then(setEntranceQrDataUrl);
    }
  }, [registrationUrl]);

  const fetchQueue = useCallback(async () => {
    if (!currentGym) return;
    try {
      setLoading(true);
      const [queueData, plansData] = await Promise.all([
        registrationService.getPendingSubmissions(currentGym.id),
        membershipService.getPlans(currentGym.id),
      ]);
      setSubmissions(queueData);
      setPlans(plansData);
    } finally {
      setLoading(false);
    }
  }, [currentGym]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
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

  const handleCopyLink = () => {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPoster = async () => {
    if (!qrPosterRef.current) return;
    await cardGeneratorService.downloadCardAsPNG({
      element: qrPosterRef.current,
      fileName: 'Paradise_Gym_Entrance_QR.png',
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setShowQrModal(true)}
          className="h-8 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Entrance QR Sign</span>
        </button>
      </div>

      <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Self-Registration Queue</h2>
            <p className="text-[11px] text-zinc-500">Review requests submitted via public entrance QR</p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          {submissions.length} Pending
        </span>
      </div>

      {/* Submissions List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 font-mono text-xs">Loading queue...</div>
        ) : submissions.length === 0 ? (
          <div className="bg-[#14161c] border border-white/[0.07] rounded-xl p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-semibold text-zinc-200">No Pending Submissions</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              When prospective members scan your entrance QR code, their requests will appear here for 1-tap approval.
            </p>
          </div>
        ) : (
          submissions.map((sub) => {
            const isProcessing = actionLoading === sub.id;

            return (
              <div
                key={sub.id}
                className="bg-[#14161c] border border-white/[0.07] p-3.5 rounded-xl space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100">{sub.full_name}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      <span>{sub.phone}</span>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <div>
                    {(() => {
                      const matchedPlan = plans.find((p) => p.id === sub.selected_plan_id);
                      return matchedPlan ? (
                        <div className="space-y-0.5">
                          <p className="text-zinc-200 font-medium text-xs">{matchedPlan.name}</p>
                          <p className="text-emerald-400 font-mono text-[11px] font-semibold">
                            ₹{(matchedPlan.price_paise / 100).toLocaleString('en-IN')} • {matchedPlan.duration_days} days
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-400 capitalize font-mono text-[11px]">
                          Plan: {sub.selected_plan_id.replace('plan-', '')}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReject(sub)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-[#0d0f12] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 text-xs font-medium rounded-lg border border-white/[0.08] transition flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(sub)}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg transition flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{isProcessing ? 'Approving...' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Entrance QR Sign Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#14161c] border border-white/[0.1] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2 text-zinc-100">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">Entrance Self-Registration Sign</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Sign Content */}
            <div
              ref={qrPosterRef}
              className="bg-[#0e1014] border border-white/[0.12] rounded-xl p-5 text-center space-y-3"
            >
              <h4 className="text-base font-bold text-zinc-100">
                {currentGym?.name || 'Paradise Gym'}
              </h4>
              <p className="text-[11px] text-zinc-400">
                Scan with your smartphone camera to register and get your digital pass
              </p>

              <div className="bg-white p-3 rounded-xl inline-block shadow-sm">
                {entranceQrDataUrl ? (
                  <img src={entranceQrDataUrl} alt="Entrance Registration QR" className="w-40 h-40 mx-auto" />
                ) : (
                  <div className="w-40 h-40 bg-zinc-200 animate-pulse rounded-lg" />
                )}
              </div>

              <p className="text-[10px] font-mono text-zinc-500">Contactless Member Self-Registration</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 h-9 bg-[#0d0f12] hover:bg-white/[0.06] text-zinc-200 border border-white/[0.08] rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 bg-[#0d0f12] hover:bg-white/[0.06] text-zinc-200 border border-white/[0.08] rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                  title="Open Form"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>

              <button
                onClick={handleDownloadPoster}
                className="w-full h-9 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Printable Sign (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

