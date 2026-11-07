import { useState } from 'react';
import {
  DownloadCloud,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  CheckCircle,
  Users,
  CreditCard,
  Receipt,
  QrCode,
  Loader2,
} from 'lucide-react';
import {
  exportMembersCsv,
  exportPaymentsCsv,
  exportExpensesCsv,
  exportAttendanceCsv,
  exportFullDatabaseJson,
} from '@/services/exportService';
import { useAuthStore } from '@/stores/authStore';

export default function ExportsPage() {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const gymId = currentPartner?.gym_id || 'demo-gym-001';

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleExport = async (
    id: string,
    exportFn: (gymId: string) => Promise<void>
  ) => {
    setDownloadingId(id);
    setSuccessId(null);
    try {
      await exportFn(gymId);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const EXPORT_OPTIONS = [
    {
      id: 'members',
      title: 'Members Directory',
      desc: 'All active, expired, and pending members with phone numbers, join dates, and notes.',
      format: 'CSV (Excel Compatible)',
      icon: Users,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
      action: () => handleExport('members', exportMembersCsv),
    },
    {
      id: 'payments',
      title: 'Payments & Revenue Ledger',
      desc: 'Every fee collection with receipt ID, member name, payment method (Cash, UPI), and ₹ amount.',
      format: 'CSV (Excel Compatible)',
      icon: CreditCard,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => handleExport('payments', exportPaymentsCsv),
    },
    {
      id: 'expenses',
      title: 'Operating Expenses',
      desc: 'Gym rent, electricity bills, equipment maintenance, and staff payroll records.',
      format: 'CSV (Excel Compatible)',
      icon: Receipt,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      action: () => handleExport('expenses', exportExpensesCsv),
    },
    {
      id: 'attendance',
      title: 'Daily Attendance Logs',
      desc: 'Every check-in timestamp with member name, attendance method (QR scan / manual), and device ID.',
      format: 'CSV (Excel Compatible)',
      icon: QrCode,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      action: () => handleExport('attendance', exportAttendanceCsv),
    },
    {
      id: 'full-json',
      title: 'Complete Database Snapshot',
      desc: 'Raw unredacted JSON archive containing all gym tables for disaster recovery and offline safe-keeping.',
      format: 'JSON Backup Archive',
      icon: FileJson,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      action: () => handleExport('full-json', exportFullDatabaseJson),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <DownloadCloud className="w-6 h-6 text-brand-400" />
          <span>Business Data Export & Backups</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Download complete spreadsheets and full disaster-recovery database backups anytime with 1 tap
        </p>
      </div>

      {/* Trust & Sovereignty Banner */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start space-x-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-200">Zero Lock-In & Total Data Sovereignty</h2>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Paradise Gym runs on open formats. All CSV exports include UTF-8 Byte Order Marks (BOM) to open cleanly
            in Microsoft Excel, Apple Numbers, and Google Sheets without garbled text.
          </p>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="space-y-3">
        {EXPORT_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isDownloading = downloadingId === item.id;
          const isSuccess = successId === item.id;

          return (
            <div
              key={item.id}
              className="p-4 bg-slate-900 border border-slate-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700/80 transition"
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-2xl border shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                      {item.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={item.action}
                disabled={isDownloading}
                className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    <span>Preparing Export...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                    <span>Download {item.id === 'full-json' ? 'JSON' : 'CSV'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
