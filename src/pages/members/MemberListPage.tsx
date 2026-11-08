import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Phone, ChevronRight, UserCheck, Upload } from 'lucide-react';
import type { DbMember, MemberStatus } from '@/types/database';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import MemberFormModal from '@/components/members/MemberFormModal';
import MemberDetailPage from './MemberDetailPage';
import RegistrationQueuePage from './RegistrationQueuePage';
import MemberImportPage from './MemberImportPage';

type StatusFilter = MemberStatus | 'all';

export default function MemberListPage() {
  const currentGym = useAuthStore((s) => s.currentGym);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Debounce search query to keep typing at 60fps with zero lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMembers = useCallback(async () => {
    if (!currentGym) return;
    try {
      setLoading(true);
      const data = await memberService.getMembers({
        gymId: currentGym.id,
        query: debouncedQuery,
        status: statusFilter,
      });
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [currentGym, debouncedQuery, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (isImportOpen) {
    return (
      <MemberImportPage
        onBack={() => setIsImportOpen(false)}
        onImportComplete={fetchMembers}
      />
    );
  }

  if (isQueueOpen) {
    return (
      <RegistrationQueuePage
        onBack={() => setIsQueueOpen(false)}
        onMemberApproved={fetchMembers}
      />
    );
  }

  if (selectedMemberId) {
    return (
      <MemberDetailPage
        memberId={selectedMemberId}
        onBack={() => setSelectedMemberId(null)}
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Search & Action Header */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#14161c] border border-white/[0.08] rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>
        <button
          onClick={() => setIsImportOpen(true)}
          className="h-9 px-3 bg-[#14161c] hover:bg-[#1a1d24] text-zinc-300 border border-white/[0.08] rounded-lg text-xs font-medium transition flex items-center justify-center"
          title="Import CSV"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
        </button>
        <button
          onClick={() => setIsQueueOpen(true)}
          className="h-9 px-3 bg-[#14161c] hover:bg-[#1a1d24] text-zinc-300 border border-white/[0.08] rounded-lg text-xs font-medium transition flex items-center justify-center"
          title="Self-Registration Queue"
        >
          <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
          title="Add Member"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-1 overflow-x-auto pb-0.5 scrollbar-none text-xs">
        {(['all', 'active', 'expired', 'archived'] as StatusFilter[]).map((tab) => {
          const isActive = statusFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Member Count Summary */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-0.5">
        <span>{members.length} member{members.length === 1 ? '' : 's'} listed</span>
      </div>

      {/* Members List */}
      <div className="space-y-1.5 touch-pan-y">
        {loading ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#14161c] border border-white/[0.05] p-3 rounded-xl flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-white/[0.04]" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-white/[0.06] rounded" />
                    <div className="w-20 h-2.5 bg-white/[0.04] rounded" />
                  </div>
                </div>
                <div className="w-14 h-5 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="bg-[#14161c] border border-white/[0.07] rounded-xl p-8 text-center space-y-1.5">
            <p className="text-xs font-medium text-zinc-300">No members found</p>
            <p className="text-[11px] text-zinc-500">
              {searchQuery ? 'Try adjusting your search query' : 'Register your first gym member'}
            </p>
          </div>
        ) : (
          members.map((member) => {
            const isExpired = member.status === 'expired';
            const isArchived = member.status === 'archived';

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className="bg-[#14161c] border border-white/[0.07] hover:border-white/[0.14] p-3 rounded-xl flex items-center justify-between transition cursor-pointer select-none touch-pan-y"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-xs text-zinc-300">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-zinc-100 leading-tight">
                      {member.full_name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                      <span className="flex items-center space-x-1 font-mono">
                        <Phone className="w-3 h-3 text-zinc-600" />
                        <span>{member.phone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
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
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <MemberFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMemberCreated={fetchMembers}
      />
    </div>
  );
}
