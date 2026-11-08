import { useState } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const enableDemoMode = useAuthStore((s) => s.enableDemoMode);
  const setPartner = useAuthStore((s) => s.setPartner);

  const handleDemoAccess = () => {
    useDemoStore.getState().resetToDefault();
    enableDemoMode();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase credentials not configured in environment. Please use Demo Mode below.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      // Fetch partner profile linked to auth user
      const { data: partner, error: partnerErr } = await supabase
        .from('partners')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (partnerErr || !partner) {
        throw new Error('No partner account found for this user.');
      }

      // Fetch gym details linked to partner
      const { data: gymRecord } = await supabase
        .from('gym')
        .select('*')
        .eq('id', partner.gym_id)
        .single();

      // Clear demo mock data when logging into real live database
      useDemoStore.getState().clearForLiveMode();

      setPartner(partner, gymRecord || {
        id: partner.gym_id,
        name: 'Paradise Gym',
        address: null,
        phone: null,
        email: null,
        gst_number: null,
        logo_url: null,
        timezone: 'Asia/Kolkata',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('Login error:', err);
      let msg = 'Login failed. Please check credentials.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        msg = (o.message as string) || (o.details as string) || (o.error_description as string) || msg;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0d0f12] text-[#ededed] flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="max-w-[360px] w-full mx-auto space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400 items-center justify-center">
            <Dumbbell className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-normal text-[#ededed]">Paradise Gym</h1>
            <p className="text-xs text-[#a1a1a6] mt-0.5">Front-desk operations terminal</p>
          </div>
        </div>

        {/* Terminal Card */}
        <div className="bg-[#14161c] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a] border-b border-white/[0.06] pb-3">
            <span>Terminal 01</span>
            <span className="flex items-center gap-1.5 text-[#a1a1a6]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Ready
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#a1a1a6]">Partner email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@paradisegym.com"
                className="w-full h-10 px-3 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-[#ededed] placeholder-[#52525b] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#a1a1a6]">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-[#0d0f12] border border-white/[0.08] rounded-lg text-sm text-[#ededed] placeholder-[#52525b] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 px-4 bg-emerald-500 hover:bg-emerald-450 active:bg-emerald-600 disabled:opacity-50 text-slate-950 font-medium text-xs rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </form>

          {/* Quiet Demo Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#14161c] px-2 text-[#71717a]">or</span>
            </div>
          </div>

          {/* Instant Demo Terminal Access */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full h-9 px-4 bg-white/[0.03] hover:bg-white/[0.06] text-[#ededed] border border-white/[0.08] font-medium text-xs rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <span>Launch demo mode</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-[#71717a] font-mono">
          Paradise Gym Operations · Station 01
        </p>
      </div>
    </div>
  );
}

