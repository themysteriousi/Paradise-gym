import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Calendar, Clock, Archive, Sparkles, RefreshCw } from 'lucide-react';
import type { DbMember } from '@/types/database';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import RenewalModal from '@/components/memberships/RenewalModal';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
}

export default function MemberDetailPage({ memberId, onBack }: MemberDetailPageProps) {
  const [member, setMember] = useState<DbMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Members</span>
        </button>
        {!isArchived && (
          <button
            onClick={handleArchive}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg border border-slate-800 transition"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">{member.full_name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span>{member.phone}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
              isArchived
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : isExpired
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Gender</span>
            <span className="text-slate-200 capitalize font-medium">{member.gender || 'Not specified'}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Joining Date</span>
            <span className="text-slate-200 font-medium">
              {member.join_date ? new Date(member.join_date).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
        </div>

        {member.notes && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 text-xs text-slate-300">
            <span className="text-[10px] text-slate-500 block font-bold uppercase mb-0.5">Partner Notes</span>
            {member.notes}
          </div>
        )}
      </div>

      {/* Recent History Tabs Placeholder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-500" />
          <span>Membership & Activity Timeline</span>
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              <div>
                <p className="font-semibold text-white">Monthly Standard Plan</p>
                <p className="text-[11px] text-slate-400">₹1,500 Paid via UPI</p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsRenewalOpen(true)}
          className="py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/10 flex items-center justify-center space-x-1.5 active:scale-[0.98] transition"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          <span>Renew Plan</span>
        </button>
        <button
          onClick={() => alert(`Digital membership card generation will be triggered in Task 2.4`)}
          className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-[0.98] transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Digital Card</span>
        </button>
      </div>

      <RenewalModal
        member={member}
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        onRenewed={loadMember}
      />
    </div>
  );
}
