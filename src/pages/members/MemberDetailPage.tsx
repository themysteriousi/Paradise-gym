import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Calendar, Clock, Archive, QrCode, RefreshCw } from 'lucide-react';
import type { DbMember } from '@/types/database';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import RenewalModal from '@/components/memberships/RenewalModal';
import DigitalCard from '@/components/members/DigitalCard';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
}

export default function MemberDetailPage({ memberId, onBack }: MemberDetailPageProps) {
  const [member, setMember] = useState<DbMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const currentPartner = useAuthStore((s) => s.currentPartner);

  const loadMember = useCallback(async () => {
    try {
      setLoading(true);
      const data = await memberService.getMemberById(memberId);
      setMember(data);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
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

  const isExpired = member.status === 'expired';
  const isArchived = member.status === 'archived';

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
        {!isArchived && (
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
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono capitalize tracking-wide ${
              isArchived
                ? 'bg-white/[0.04] text-zinc-400 border border-white/[0.08]'
                : isExpired
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {member.status}
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

      {/* Recent History */}
      <div className="bg-[#14161c] border border-white/[0.08] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Membership & Activity Timeline</span>
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="p-3 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-200">Monthly Standard Plan</p>
                <p className="text-[11px] text-zinc-500 font-mono">₹1,500 Paid via UPI</p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsRenewalOpen(true)}
          className="h-10 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Renew Plan</span>
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
        isOpen={isCardOpen}
        onClose={() => setIsCardOpen(false)}
      />
    </div>
  );
}
