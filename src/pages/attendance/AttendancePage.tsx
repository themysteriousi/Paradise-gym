import { useState, useMemo, useRef, useEffect } from 'react';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import {
  processMemberCheckIn,
  getTodaysAttendanceLog,
  type CheckInResult,
} from '@/services/attendanceService';
import { cardGeneratorService } from '@/services/cardGeneratorService';
import CameraScanner from '@/components/attendance/CameraScanner';
import CheckInResultModal from '@/components/attendance/CheckInResultModal';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import {
  QrCode,
  Search,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
  X,
  Dumbbell,
} from 'lucide-react';

export default function AttendancePage() {
  const members = useDemoStore((s) => s.members);
  const attendance = useDemoStore((s) => s.attendance);
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const currentGym = useAuthStore((s) => s.currentGym);

  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [manualQuery, setManualQuery] = useState('');
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentModalMemberId, setPaymentModalMemberId] = useState<string | null>(null);

  // Wall QR Poster state
  const [showWallQrModal, setShowWallQrModal] = useState(false);
  const [wallQrDataUrl, setWallQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const wallPosterRef = useRef<HTMLDivElement>(null);

  const baseOrigin = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://paradise-gym-e3f.pages.dev'
        : window.location.origin)
    : 'https://paradise-gym-e3f.pages.dev';

  const checkInUrl = `${baseOrigin}/?checkin=true&gym=${currentGym?.id || currentPartner?.gym_id || 'demo-gym-001'}`;

  useEffect(() => {
    if (checkInUrl) {
      cardGeneratorService.generateQRCodeDataUrl(checkInUrl).then(setWallQrDataUrl);
    }
  }, [checkInUrl]);

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
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Attendance Desk</h1>
          <p className="text-[11px] font-mono text-zinc-500">QR scanning & arrival logs</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWallQrModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
            title="Download printable Wall QR poster for self check-in"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-950" />
            <span>Wall QR Sign</span>
          </button>
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-mono text-xs rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{todaysLogs.length} checked in today</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#14161c] p-1 rounded-lg border border-white/[0.08]">
        <button
          onClick={() => setActiveMode('camera')}
          className={`py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMode === 'camera'
              ? 'bg-white/[0.08] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Camera Scanner</span>
        </button>
        <button
          onClick={() => setActiveMode('manual')}
          className={`py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMode === 'manual'
              ? 'bg-white/[0.08] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Manual Search</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 font-mono text-xs flex items-center space-x-2">
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
      <div className="bg-[#14161c] border border-white/[0.08] p-3.5 rounded-xl space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Search member by name or phone to check in..."
            className="w-full bg-[#0d0f12] border border-white/[0.08] rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
            {searchResults.map((m) => (
              <div
                key={m.id}
                className="p-2 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-100">{m.full_name}</p>
                  <p className="text-[11px] font-mono text-zinc-500">{m.phone}</p>
                </div>
                <button
                  onClick={() => handleManualCheckIn(m.id)}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-md transition flex items-center space-x-1"
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
      <div className="bg-[#14161c] border border-white/[0.08] p-3.5 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-zinc-200">Today&apos;s Live Check-in Feed</h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            {todaysLogs.length} verified
          </span>
        </div>

        <div className="space-y-1.5 touch-pan-y">
          {todaysLogs.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2 text-center">
              No check-ins recorded yet today. Scan a QR code or use manual search.
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
                  className="p-2.5 bg-[#0d0f12] rounded-lg border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-zinc-300 text-xs">
                      {member?.full_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-100">
                        {member?.full_name || 'Member'}
                      </p>
                      <p className="text-[11px] text-slate-400">{member?.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-zinc-300">{time}</span>
                    <div className="mt-0.5">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          log.method === 'qr_scan'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.method === 'kiosk'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-white/[0.04] text-zinc-400 border border-white/[0.08]'
                        }`}
                      >
                        {log.method === 'qr_scan' ? 'QR Pass' : log.method === 'kiosk' ? 'Wall QR' : 'Desk'}
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

      {/* Printable Wall QR Poster Modal */}
      {showWallQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#14161c] border border-white/[0.12] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Wall QR Self Check-In Poster</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Print & stick this at your gym entrance for unassisted member check-in
                </p>
              </div>
              <button
                onClick={() => setShowWallQrModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Poster Card Preview */}
            <div className="p-1 bg-black/40 rounded-xl border border-white/[0.06] flex justify-center">
              <div
                ref={wallPosterRef}
                className="w-full max-w-[340px] bg-gradient-to-b from-[#0d0f12] via-[#12141a] to-[#090a0d] border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden"
              >
                {/* Decorative accent */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Gym Brand Header */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-wider uppercase text-zinc-100">
                    {currentGym?.name || 'PARADISE GYM'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Self-Service Check-In
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-white uppercase">
                    Scan With Phone Camera
                  </h2>
                  <p className="text-[11px] text-zinc-400 max-w-[240px] mx-auto">
                    Mark your daily workout attendance in 2 seconds
                  </p>
                </div>

                {/* QR Container */}
                <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
                  {wallQrDataUrl ? (
                    <img
                      src={wallQrDataUrl}
                      alt="Wall Check-In QR Code"
                      className="w-44 h-44 object-contain block mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-zinc-500 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* 3 Step Instructions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-left">
                  <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">1</span>
                    <p className="text-[10px] text-zinc-300 leading-tight">Scan with Camera</p>
                  </div>
                  <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">2</span>
                    <p className="text-[10px] text-zinc-300 leading-tight">Enter Mobile #</p>
                  </div>
                  <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5">3</span>
                    <p className="text-[10px] text-zinc-300 leading-tight">Tap Check-In</p>
                  </div>
                </div>

                <p className="text-[9px] font-mono text-zinc-500 pt-1">
                  Powered by Paradise Gym OS • No app install needed
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={async () => {
                  if (wallPosterRef.current) {
                    const gymNameSlug = (currentGym?.name || 'paradise-gym')
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-');
                    await cardGeneratorService.downloadCardAsPNG({
                      element: wallPosterRef.current,
                      fileName: `${gymNameSlug}-wall-checkin-sign.png`,
                    });
                  }
                }}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable Poster (PNG)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    if (checkInUrl) {
                      await navigator.clipboard.writeText(checkInUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="py-2 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs rounded-lg transition flex items-center justify-center space-x-1.5 border border-white/[0.08] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
                <a
                  href={checkInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs rounded-lg transition flex items-center justify-center space-x-1.5 border border-white/[0.08]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Check-in</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
