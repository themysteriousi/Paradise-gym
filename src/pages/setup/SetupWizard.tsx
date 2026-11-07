import { useState } from 'react';
import { Dumbbell, ArrowRight, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [gymName, setGymName] = useState('Paradise Gym');
  const [upiId, setUpiId] = useState('paradisegym@upi');
  const [partner1Email, setPartner1Email] = useState('');
  const [partner2Email, setPartner2Email] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('1500');

  const enableDemoMode = useAuthStore((s) => s.enableDemoMode);

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-brand-500 rounded-2xl text-slate-950 shadow-lg shadow-brand-500/20">
          <Dumbbell className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-white">First-Time Gym Setup</h1>
        <p className="text-xs text-slate-400">Step {step} of 3 · Configure gym operations for both partners</p>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center space-x-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-brand-500' : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Gym Details */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
            <span>Gym Name & UPI Details</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gym Name</label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gym Primary UPI ID (for QR)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="gym@okaxis"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Base Monthly Fee (₹)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10"
          >
            <span>Continue to Partner Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Two Partners */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <span>Two Partner Accounts</span>
          </h2>
          <p className="text-xs text-slate-400">
            Both partners will have equal full administrative access across all records.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Partner 1 Email</label>
              <input
                type="email"
                value={partner1Email}
                onChange={(e) => setPartner1Email(e.target.value)}
                placeholder="partner1@paradisegym.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Partner 2 Email</label>
              <input
                type="email"
                value={partner2Email}
                onChange={(e) => setPartner2Email(e.target.value)}
                placeholder="partner2@paradisegym.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2"
            >
              <span>Continue to Confirmation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete & Go Live */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-center">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Setup Ready!</h2>
          <p className="text-xs text-slate-400">
            Your gym configuration has been prepared with initial membership plans, partner roles, and UPI QR support.
          </p>

          <button
            onClick={enableDemoMode}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition"
          >
            Open Gym Operations Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
