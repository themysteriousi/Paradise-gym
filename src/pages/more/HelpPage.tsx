import { useState } from 'react';
import {
  HelpCircle,
  CreditCard,
  UserCheck,
  WifiOff,
  CalendarOff,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>('daily-routine');

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const HELP_SECTIONS = [
    {
      id: 'daily-routine',
      title: 'Daily Gym Routine & Cash Reconciliation',
      icon: CheckCircle,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Morning Opening:</strong> Open the PWA on your desk phone or tablet. Check the
            Dashboard for members expiring in the next 3 days and those with overdue fee balances. Tap
            <strong> Attendance → Start Camera Scanner</strong> to enable touchless QR check-ins.
          </p>
          <p>
            <strong>Evening Closing:</strong> Tap <strong>Dashboard</strong> to inspect today's total
            collections broken down into <strong>Cash</strong> vs <strong>UPI</strong>. Count physical cash in
            the register to match the app's figure.
          </p>
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-slate-300">
            <strong>Pro Tip:</strong> Any petty cash spent on floor cleaning or drinking water should be
            logged in <strong>More → Operating Expenses</strong> immediately.
          </div>
        </div>
      ),
    },
    {
      id: 'member-onboarding',
      title: 'Member Self-Registration & Digital Cards',
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            New members can register themselves by scanning the gym entrance QR code on their own smartphones,
            filling out their contact details without touching front desk equipment.
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-400">
            <li>Go to <strong>More → Public Registration Queue</strong>.</li>
            <li>Review applicant's contact information and emergency phone number.</li>
            <li>Tap <strong>Approve & Assign Plan</strong>, select a membership duration, and record payment.</li>
            <li>Tap <strong>Share WhatsApp Card</strong> to send them their digital membership card with QR token!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'payments-renewals',
      title: 'Payments, Split Cash/UPI & Early Renewals',
      icon: CreditCard,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Split Payments:</strong> If a member pays part cash and part UPI (e.g., ₹500 cash + ₹1,000 UPI),
            switch to <em>Split Payment</em> in the payment modal. Both entries are grouped under one receipt.
          </p>
          <p>
            <strong>Early Renewal Protection:</strong> If a member's plan ends on Dec 20, but they pay on Dec 10,
            the app <em>never cheats the member</em> out of remaining days. The renewal starts on Dec 20 and
            preserves all 10 remaining days automatically.
          </p>
        </div>
      ),
    },
    {
      id: 'offline-scanner',
      title: 'Offline Attendance & Wi-Fi Outages',
      icon: WifiOff,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Paradise Gym uses an offline-first IndexedDB engine. If the gym internet cuts out:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>The app continues scanning QR codes without interruption.</li>
            <li>Check-ins are stored safely on the device memory.</li>
            <li>An <strong>Offline Mode</strong> badge appears at the top.</li>
            <li>As soon as Wi-Fi or cellular network returns, records automatically sync to the cloud.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'closures-extensions',
      title: 'Gym Closures & Fair Auto-Extensions',
      icon: CalendarOff,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            When closing for festivals (Diwali, Holi, New Year) or equipment servicing:
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-400">
            <li>Navigate to <strong>More → Gym Closures & Extensions</strong>.</li>
            <li>Tap <strong>Record Closure</strong>, choose the start and end dates.</li>
            <li>Ensure <strong>"Automatically extend active memberships"</strong> is checked.</li>
            <li>Tap <strong>Confirm Closure</strong>. The app immediately shifts all active members' end dates forward!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'backups-recovery',
      title: 'Data Backups & Complete Data Sovereignty',
      icon: DownloadCloud,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            You own 100% of your gym's records. You can download spreadsheets (CSV) or complete database backups (JSON)
            at any time from <strong>More → Business Data Export</strong>.
          </p>
          <p className="text-slate-400">
            Keep a weekly JSON backup on your personal computer or Google Drive. In case your phone is broken or lost,
            your entire gym can be restored in under 15 minutes.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <HelpCircle className="w-6 h-6 text-brand-400" />
          <span>Partner Help & Operational Guides</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Step-by-step instructions for front-desk operations, offline mode, and accounting
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {HELP_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div
              key={section.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl border ${section.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-100">{section.title}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 bg-slate-900/50 animate-in fade-in duration-200">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
