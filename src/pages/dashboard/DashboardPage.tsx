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
  Flame,
  Users,
  IndianRupee,
  AlertCircle,
  QrCode,
  UserPlus,
  TrendingUp,
  MessageCircle,
  RotateCw,
  Clock,
  Sparkles,
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

  return (
    <div className="space-y-4">
      {/* Top Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-brand-400 font-bold mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paradise Gym Operations</span>
          </div>
          <h1 className="text-lg font-black text-white">
            Welcome, {currentPartner?.name?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-[11px] text-slate-400">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}{' '}
            • Single-Location Desk
          </p>
        </div>

        <button
          onClick={() => setActiveTab('attendance')}
          className="p-3 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition flex items-center space-x-1.5"
          title="Open QR Scanner"
        >
          <QrCode className="w-5 h-5" />
          <span className="text-xs font-black hidden sm:inline">Scan QR</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          title="Today's Check-ins"
          value={metrics.todays_checkins_count}
          subtitle="Gym floor traffic"
          icon={Flame}
          variant="brand"
          onClick={() => setActiveTab('attendance')}
        />
        <MetricCard
          title="Active Members"
          value={metrics.active_members_count}
          subtitle={`Total: ${metrics.total_members_count}`}
          icon={Users}
          variant="sky"
          onClick={() => setActiveTab('members')}
        />
        <MetricCard
          title="Today's Collections"
          value={formatRupees(metrics.todays_collections_paise)}
          subtitle="Cash & UPI in desk"
          icon={IndianRupee}
          variant="emerald"
          onClick={() => setActiveTab('payments')}
        />
        <MetricCard
          title="Pending Dues"
          value={formatRupees(metrics.pending_dues_paise)}
          subtitle="Uncollected fees"
          icon={AlertCircle}
          variant="amber"
          onClick={() => setActiveTab('more')}
        />
      </div>

      {/* Quick Desk Actions */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Quick Desk Actions
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 transition active:scale-95"
          >
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">Scan Pass</span>
          </button>

          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 transition active:scale-95"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">Collect Fee</span>
          </button>

          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 transition active:scale-95"
          >
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">New Member</span>
          </button>

          <button
            onClick={() => setActiveTab('more')}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 transition active:scale-95"
          >
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">P&L Report</span>
          </button>
        </div>
      </div>

      {/* Expiring Soon Alert Section */}
      {expiringMembers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Expiring This Week</h3>
            </div>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {expiringMembers.length} Members
            </span>
          </div>

          <div className="space-y-2 touch-pan-y">
            {expiringMembers.map((item) => (
              <div
                key={item.member.id}
                className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between touch-pan-y"
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.member.full_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.planName} •{' '}
                    <span className="text-amber-400 font-semibold">
                      {item.daysRemaining} days left (Exp: {item.expiryDate})
                    </span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleSendExpiryReminder(item)}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center space-x-1 transition"
                    title="WhatsApp Reminder"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setRenewingMember(item)}
                    className="p-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Renew</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Floor Activity Stream */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Live Floor Activity</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
        </div>

        <div className="space-y-2 touch-pan-y">
          {activityFeed.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
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
                  className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        act.iconType === 'checkin'
                          ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {act.iconType === 'checkin' ? (
                        <QrCode className="w-3.5 h-3.5" />
                      ) : (
                        <IndianRupee className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">{act.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{time}</span>
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
