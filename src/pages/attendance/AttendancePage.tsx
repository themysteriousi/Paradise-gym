import { useState, useMemo } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import {
  processMemberCheckIn,
  getTodaysAttendanceLog,
  type CheckInResult,
} from '@/services/attendanceService';
import CameraScanner from '@/components/attendance/CameraScanner';
import CheckInResultModal from '@/components/attendance/CheckInResultModal';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import {
  QrCode,
  Search,
  UserCheck,
  AlertCircle,
  Flame,
} from 'lucide-react';

export default function AttendancePage() {
  const members = useDemoStore((s) => s.members);
  const attendance = useDemoStore((s) => s.attendance);
  const currentPartner = useAuthStore((s) => s.currentPartner);

  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [manualQuery, setManualQuery] = useState('');
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentModalMemberId, setPaymentModalMemberId] = useState<string | null>(null);

  // Compute member lookup map
  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m.id, m]));
  }, [members]);

  // Today's attendance log
  const todaysLogs = useMemo(() => {
    return getTodaysAttendanceLog();
  }, [attendance]);

  // Manual search results
  const searchResults = useMemo(() => {
    if (!manualQuery.trim()) return [];
    const q = manualQuery.toLowerCase();
    return members
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.id.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [members, manualQuery]);

  // Handle scanned QR token
  const handleScanSuccess = async (tokenString: string) => {
    setErrorMessage(null);
    try {
      const res = await processMemberCheckIn({
        gym_id: currentPartner?.gym_id || 'demo-gym-001',
        tokenString,
        method: 'qr_scan',
        checked_in_by: currentPartner?.id || 'desk-scanner',
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Check-in failed');
        return;
      }

      setCheckInResult(res);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing scan');
    }
  };

  // Handle manual member check-in
  const handleManualCheckIn = async (memberId: string) => {
    setErrorMessage(null);
    try {
      const res = await processMemberCheckIn({
        gym_id: currentPartner?.gym_id || 'demo-gym-001',
        member_id: memberId,
        method: 'manual',
        checked_in_by: currentPartner?.id || 'demo-partner-001',
        note: 'Manual front-desk check-in',
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Manual check-in failed');
        return;
      }

      setCheckInResult(res);
      setManualQuery('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing check-in');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">QR Attendance Scanner</h1>
          <p className="text-xs text-slate-400">Desk check-in & automated attendance logs</p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-xs rounded-xl">
          <Flame className="w-4 h-4 text-brand-500" />
          <span>{todaysLogs.length} Checked In Today</span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveMode('camera')}
          className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition ${
            activeMode === 'camera'
              ? 'bg-brand-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Camera Scanner</span>
        </button>
        <button
          onClick={() => setActiveMode('manual')}
          className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition ${
            activeMode === 'manual'
              ? 'bg-brand-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Manual Search Desk</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Camera View Mode */}
      {activeMode === 'camera' && (
        <div className="space-y-3">
          <CameraScanner
            onScanSuccess={handleScanSuccess}
            onCameraUnavailable={() => setActiveMode('manual')}
          />
        </div>
      )}

      {/* Manual Search Check-In Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Fast search member by name or phone to check in..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            {searchResults.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{m.full_name}</p>
                  <p className="text-[11px] text-slate-400">{m.phone}</p>
                </div>
                <button
                  onClick={() => handleManualCheckIn(m.id)}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Check In</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Live Feed */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Today&apos;s Live Check-in Feed</h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {todaysLogs.length} verified
          </span>
        </div>

        <div className="space-y-2 touch-pan-y">
          {todaysLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
              No check-ins recorded yet today. Scan a QR code or use manual check-in.
            </p>
          ) : (
            todaysLogs.map((log) => {
              const member = memberMap.get(log.member_id);
              const time = new Date(log.checked_in_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                      {member?.full_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {member?.full_name || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-400">{member?.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-300">{time}</span>
                    <div className="mt-0.5">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          log.method === 'qr_scan'
                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {log.method === 'qr_scan' ? 'QR Pass' : 'Desk'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Check In Feedback Modal */}
      <CheckInResultModal
        result={checkInResult}
        onClose={() => setCheckInResult(null)}
        onCollectPayment={(memberId) => setPaymentModalMemberId(memberId)}
      />

      {/* Quick Collect Payment Modal if dues triggered */}
      {paymentModalMemberId && (
        <RecordPaymentModal
          isOpen={true}
          initialMemberId={paymentModalMemberId}
          onClose={() => setPaymentModalMemberId(null)}
          onSuccess={() => setPaymentModalMemberId(null)}
        />
      )}
    </div>
  );
}
