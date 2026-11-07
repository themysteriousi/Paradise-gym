import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Phone, ChevronRight } from 'lucide-react';
import type { DbMember, MemberStatus } from '@/types/database';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import MemberFormModal from '@/components/members/MemberFormModal';
import MemberDetailPage from './MemberDetailPage';

type StatusFilter = MemberStatus | 'all';

export default function MemberListPage() {
  const currentGym = useAuthStore((s) => s.currentGym);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentGym) return;
    try {
      setLoading(true);
      const data = await memberService.getMembers({
        gymId: currentGym.id,
        query: searchQuery,
        status: statusFilter,
      });
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [currentGym, searchQuery, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (selectedMemberId) {
    return (
      <MemberDetailPage
        memberId={selectedMemberId}
        onBack={() => setSelectedMemberId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Action Header */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl font-bold transition shadow-lg shadow-brand-500/10 active:scale-95 flex items-center justify-center"
          title="Add Member"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Status Filter Badges */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {(['all', 'active', 'expired', 'archived'] as StatusFilter[]).map((tab) => {
          const isActive = statusFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-brand-500 border border-brand-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Member Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {members.length} members</span>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-200">No members found</p>
            <p className="text-xs text-slate-500">
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
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between active:scale-[0.99] transition cursor-pointer shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-brand-500">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {member.full_name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{member.phone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isArchived
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isExpired
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {member.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
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
