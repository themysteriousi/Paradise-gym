import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Calendar, Clock, Archive, QrCode, RefreshCw, Plus, IndianRupee } from 'lucide-react';
import type { DbMember, DbMembership, DbMembershipPlan, DbPayment } from '@/types/database';
import { memberService } from '@/services/memberService';
import { membershipService } from '@/services/membershipService';
import { getPayments } from '@/services/paymentService';
import { useAuthStore } from '@/stores/authStore';
import RenewalModal from '@/components/memberships/RenewalModal';
import DigitalCard from '@/components/members/DigitalCard';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
}

export default function MemberDetailPage({ memberId, onBack }: MemberDetailPageProps) {
  const [member, setMember] = useState<DbMember | null>(null);
  const [activeMembership, setActiveMembership] = useState<DbMembership | null>(null);
  const [planDetails, setPlanDetails] = useState<DbMembershipPlan | null>(null);
  const [memberPayments, setMemberPayments] = useState<DbPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const currentGym = useAuthStore((s) => s.currentGym);

  const loadMember = useCallback(async () => {
    try {
      setLoading(true);
      const data = await memberService.getMemberById(memberId);
      setMember(data);

      if (data) {
        const ms = await membershipService.getMemberActiveMembership(memberId);
        setActiveMembership(ms);

        const gymId = currentGym?.id || data.gym_id;
        const [plans, allPayments] = await Promise.all([
          membershipService.getPlans(gymId),
          getPayments(gymId),
        ]);

        if (ms) {
          const plan = plans.find((p) => p.id === ms.plan_id) || null;
          setPlanDetails(plan);
        } else {
          setPlanDetails(null);
        }

        const pays = allPayments.filter((p) => p.member_id === memberId);
        setMemberPayments(pays);
      }
    } finally {
      setLoading(false);
    }
  }, [memberId, currentGym]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleArchive = async () => {
    if (!member || !currentPartner) return;
    const confirm = window.confirm(`Archive ${member.full_name}? Historical payment and attendance records will remain preserved.`);
    if (!confirm) return;

    await memberService.archiveMember(member.id, currentPartner.id);
    await loadMember();
  };

  const handleUnarchive = async () => {
    if (!member) return;
    await memberService.updateMember(member.id, { status: 'active' });
    await loadMember();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs font-mono">
        Loading member profile...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-red-400">Member not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl"
        >
          Return to List
        </button>
      </div>
    );
  }

  const isArchived = member.status === 'archived';
  const hasMembership = activeMembership !== null;
  const isExpired = hasMembership && new Date(activeMembership.end_date).getTime() < Date.now();
  const hasPendingDue = hasMembership && (activeMembership.balance_paise || 0) > 0;

  // Determine realistic status badge
  let statusLabel = 'Active';
  let statusBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

  if (isArchived) {
    statusLabel = 'Archived';
    statusBadgeStyle = 'bg-white/[0.04] text-zinc-400 border border-white/[0.08]';
  } else if (!hasMembership) {
    statusLabel = 'No Active Plan';
    statusBadgeStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  } else if (isExpired) {
    statusLabel = 'Expired';
    statusBadgeStyle = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  } else if (hasPendingDue) {
    statusLabel = 'Payment Due';
    statusBadgeStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  }

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Members</span>
        </button>
        {isArchived ? (
          <button
            onClick={handleUnarchive}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-md border border-emerald-500/20 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore to Active</span>
          </button>
        ) : (
          <button
            onClick={handleArchive}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md border border-white/[0.08] transition"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-4 space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-zinc-100">{member.full_name}</h2>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <span>{member.phone}</span>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono capitalize tracking-wide ${statusBadgeStyle}`}>
            {statusLabel}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06] text-xs">
          <div className="bg-[#0d0f12] p-2.5 rounded-lg border border-white/[0.06]">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Gender</span>
            <span className="text-zinc-200 capitalize font-medium mt-0.5 block">{member.gender || 'Not specified'}</span>
          </div>
          <div className="bg-[#0d0f12] p-2.5 rounded-lg border border-white/[0.06]">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Joining Date</span>
            <span className="text-zinc-200 font-mono mt-0.5 block">
              {member.join_date ? new Date(member.join_date).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
        </div>

        {member.notes && (
          <div className="p-2.5 bg-[#0d0f12] rounded-lg border border-white/[0.06] text-xs text-zinc-300">
            <span className="text-[10px] text-zinc-500 block font-mono uppercase tracking-wider mb-0.5">Partner Notes</span>
            {member.notes}
          </div>
        )}
      </div>

      {/* Membership & Activity Timeline */}
      <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Membership & Activity Timeline</span>
        </h3>

        {hasMembership ? (
          <div className="space-y-1.5 text-xs">
            <div className="p-3 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-medium text-zinc-200">
                    {planDetails?.name || 'Standard Membership'}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {hasPendingDue
                      ? `₹${(activeMembership.paid_paise / 100).toLocaleString('en-IN')} paid • ₹${(activeMembership.balance_paise / 100).toLocaleString('en-IN')} due`
                      : `₹${(activeMembership.price_paise / 100).toLocaleString('en-IN')} fully paid`}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Valid until {new Date(activeMembership.end_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isExpired
                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                  : hasPendingDue
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              }`}>
                {isExpired ? 'Expired' : hasPendingDue ? 'Due' : 'Active'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#0d0f12] rounded-lg border border-dashed border-white/[0.08] text-center space-y-1">
            <p className="text-xs font-medium text-zinc-300">No active plan assigned</p>
            <p className="text-[11px] text-zinc-500">
              This member has not been assigned a plan yet. Click &quot;Assign Plan&quot; to activate their membership.
            </p>
          </div>
        )}
      </div>

      {/* Payment History */}
      {memberPayments.length > 0 && (
        <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-zinc-400" />
            <span>Payment History</span>
          </h3>
          <div className="space-y-1.5 text-xs">
            {memberPayments.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-200">
                    ₹{(p.amount_paise / 100).toLocaleString('en-IN')} via {p.method.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {new Date(p.paid_at).toLocaleDateString('en-IN')}
                    {p.reference ? ` • Ref: ${p.reference}` : ''}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsRenewalOpen(true)}
          className="h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition"
        >
          {hasMembership ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Renew Plan</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Assign Plan</span>
            </>
          )}
        </button>
        <button
          onClick={() => setIsCardOpen(true)}
          className="h-10 bg-[#14161c] hover:bg-[#1a1d24] text-zinc-200 border border-white/[0.08] font-medium text-xs rounded-lg flex items-center justify-center space-x-1.5 transition"
        >
          <QrCode className="w-3.5 h-3.5 text-zinc-400" />
          <span>Digital Card</span>
        </button>
      </div>

      <RenewalModal
        member={member}
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        onRenewed={loadMember}
      />

      <DigitalCard
        member={member}
        planName={planDetails?.name || 'No Active Plan'}
        expiryDateFormatted={
          activeMembership
            ? new Date(activeMembership.end_date).toLocaleDateString('en-IN')
            : 'No active plan'
        }
        isOpen={isCardOpen}
        onClose={() => setIsCardOpen(false)}
      />
    </div>
  );
}
