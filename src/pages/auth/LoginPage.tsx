import { useState } from 'react';
import { Dumbbell, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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
        email,
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
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex bg-brand-500 p-3 rounded-2xl text-slate-950 shadow-lg shadow-brand-500/20">
            <Dumbbell className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Paradise Gym</h1>
          <p className="text-sm text-slate-400">Partner & Owner Management Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs text-brand-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Partner Access</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Partner Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@paradisegym.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10 active:scale-[0.98]"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or Explore</span>
            </div>
          </div>

          {/* Instant Demo Button */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-medium text-xs rounded-xl transition flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Instant Demo Mode (No Setup Needed)</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-600">
          Zero-cost PWA · Cloudflare Pages & Supabase
        </p>
      </div>
    </div>
  );
}

