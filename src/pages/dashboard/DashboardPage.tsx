import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import {
  computeDashboardMetrics,
  getExpiringMemberships,
  getRecentActivityFeed,
  type ExpiringMemberInfo,
} from '@/services/dashboardService';
import { formatRupees } from '@/services/paymentService';
import { whatsappService } from '@/services/whatsappService';
import MetricCard from '@/components/dashboard/MetricCard';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import RenewalModal from '@/components/memberships/RenewalModal';
import MemberFormModal from '@/components/members/MemberFormModal';
import {
  UserCheck,
  Users,
  IndianRupee,
  AlertCircle,
  QrCode,
  UserPlus,
  TrendingUp,
  MessageCircle,
  RotateCw,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [renewingMember, setRenewingMember] = useState<ExpiringMemberInfo | null>(null);

  const metrics = useMemo(() => computeDashboardMetrics(), []);
  const expiringMembers = useMemo(() => getExpiringMemberships(7), []);
  const activityFeed = useMemo(() => getRecentActivityFeed(8), []);

  const handleSendExpiryReminder = (item: ExpiringMemberInfo) => {
    const text = whatsappService.formatExpiryReminder({
      gymName: 'Paradise Gym',
      memberName: item.member.full_name,
      daysLeft: item.daysRemaining,
      expiryDate: item.expiryDate,
    });
    const link = whatsappService.getWhatsAppLink({
      phone: item.member.phone,
      message: text,
    });
    window.open(link, '_blank');
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-4">
      {/* Top Desk Shift Header */}
      <div className="bg-[#14161c] border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#71717a] mb-1">
            <span>TERMINAL 01</span>
            <span>•</span>
            <span className="text-[#a1a1a6]">{todayStr}</span>
          </div>
          <h1 className="text-base font-semibold text-[#ededed]">
            Floor register
          </h1>
          <p className="text-[11px] text-[#71717a] mt-0.5">
            {currentPartner?.name ? `${currentPartner.name} on desk` : 'Desk terminal'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('attendance')}
          className="h-10 px-3.5 bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 text-slate-950 font-medium text-xs rounded-lg transition-colors duration-150 flex items-center space-x-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          title="Open QR Scanner"
        >
          <QrCode className="w-4 h-4 stroke-[2]" />
          <span>Scan pass</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          title="Today's check-ins"
          value={metrics.todays_checkins_count}
          subtitle="Desk arrivals"
          icon={UserCheck}
          variant="brand"
          onClick={() => setActiveTab('attendance')}
        />
        <MetricCard
          title="Active members"
          value={metrics.active_members_count}
          subtitle={`Total: ${metrics.total_members_count}`}
          icon={Users}
          variant="brand"
          onClick={() => setActiveTab('members')}
        />
        <MetricCard
          title="Today's collections"
          value={formatRupees(metrics.todays_collections_paise)}
          subtitle="Cash & UPI collected"
          icon={IndianRupee}
          variant="emerald"
          onClick={() => setActiveTab('payments')}
        />
        <MetricCard
          title="Pending dues"
          value={formatRupees(metrics.pending_dues_paise)}
          subtitle="Uncollected fees"
          icon={AlertCircle}
          variant="amber"
          onClick={() => setActiveTab('more')}
        />
      </div>

      {/* Quick Desk Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-[#a1a1a6] px-1">
          Quick actions
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="p-3 bg-[#14161c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-[#ededed] flex items-center justify-center">
              <QrCode className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium text-[#ededed]">Scan pass</span>
          </button>

          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="p-3 bg-[#14161c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-[#ededed] flex items-center justify-center">
              <IndianRupee className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium text-[#ededed]">Record fee</span>
          </button>

          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="p-3 bg-[#14161c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-[#ededed] flex items-center justify-center">
              <UserPlus className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium text-[#ededed]">Add member</span>
          </button>

          <button
            onClick={() => setActiveTab('more')}
            className="p-3 bg-[#14161c] border border-white/[0.08] hover:border-white/[0.16] rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-[#ededed] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium text-[#ededed]">P&L report</span>
          </button>
        </div>
      </div>

      {/* Expiring Soon Alert Section */}
      {expiringMembers.length > 0 && (
        <div className="bg-[#14161c] border border-white/[0.08] p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 stroke-[1.75]" />
              <h3 className="text-xs font-semibold text-[#ededed]">Expiring this week</h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {expiringMembers.length} members
            </span>
          </div>

          <div className="space-y-2 touch-pan-y">
            {expiringMembers.map((item) => (
              <div
                key={item.member.id}
                className="bg-[#0d0f12] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between touch-pan-y"
              >
                <div>
                  <p className="text-xs font-medium text-[#ededed]">{item.member.full_name}</p>
                  <p className="text-[11px] text-[#71717a] mt-0.5">
                    {item.planName} •{' '}
                    <span className="text-amber-400/90 font-mono">
                      {item.daysRemaining}d left ({item.expiryDate})
                    </span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleSendExpiryReminder(item)}
                    className="h-8 px-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#ededed] border border-white/[0.08] rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors duration-150"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageCircle className="w-3.5 h-3.5 stroke-[1.75] text-emerald-400" />
                    <span className="text-[11px] hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setRenewingMember(item)}
                    className="h-8 px-2.5 bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 text-slate-950 font-medium rounded-lg text-xs flex items-center space-x-1 transition-colors duration-150"
                  >
                    <RotateCw className="w-3.5 h-3.5 stroke-[2]" />
                    <span className="text-[11px]">Renew</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Floor Activity Stream */}
      <div className="bg-[#14161c] border border-white/[0.08] p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#a1a1a6] stroke-[1.75]" />
            <h3 className="text-xs font-semibold text-[#ededed]">Live arrivals & actions</h3>
          </div>
          <span className="text-[10px] text-[#71717a] font-mono">Live</span>
        </div>

        <div className="space-y-2 touch-pan-y">
          {activityFeed.length === 0 ? (
            <p className="text-xs text-[#71717a] italic py-2 text-center">
              No recent activity recorded yet today.
            </p>
          ) : (
            activityFeed.map((act) => {
              const time = new Date(act.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={act.id}
                  className="bg-[#0d0f12] p-2.5 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#a1a1a6]">
                      {act.iconType === 'checkin' ? (
                        <QrCode className="w-3.5 h-3.5 stroke-[1.75]" />
                      ) : (
                        <IndianRupee className="w-3.5 h-3.5 stroke-[1.75] text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#ededed] leading-tight">{act.title}</p>
                      <p className="text-[11px] text-[#71717a] mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#71717a] shrink-0">{time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => setIsRecordPaymentOpen(false)}
      />

      <MemberFormModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberCreated={() => setIsAddMemberOpen(false)}
      />

      {renewingMember && (
        <RenewalModal
          isOpen={true}
          member={renewingMember.member}
          onClose={() => setRenewingMember(null)}
          onRenewed={() => setRenewingMember(null)}
        />
      )}
    </div>
  );
}
