import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Check } from 'lucide-react';
import type { DbMembershipPlan } from '@/types/database';
import { membershipService } from '@/services/membershipService';
import { useAuthStore } from '@/stores/authStore';

export default function PlanSettingsPage() {
  const currentGym = useAuthStore((s) => s.currentGym);
  const [plans, setPlans] = useState<DbMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGym) return;
    membershipService.getPlans(currentGym.id).then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, [currentGym]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Dumbbell className="w-4 h-4 text-brand-500" />
            <span>Membership Plans & Pricing</span>
          </h2>
          <p className="text-xs text-slate-400">Configured plans for Paradise Gym</p>
        </div>
        <button
          onClick={() => alert('New plan creation will be available in full admin settings')}
          className="p-2 bg-brand-500 text-slate-950 rounded-xl font-bold text-xs flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading plans...</div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-brand-500">
                    ₹{(plan.price_paise / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    /{plan.duration_days} days
                  </span>
                </div>
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {plan.features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                    >
                      <Check className="w-2.5 h-2.5 text-brand-500" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

