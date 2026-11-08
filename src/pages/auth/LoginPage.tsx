import { useState, useEffect } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const setPartner = useAuthStore((s) => s.setPartner);

  useEffect(() => {
    // Check URL parameters for OAuth errors (e.g. user cancelled or Supabase OAuth misconfiguration)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const errorDesc =
      urlParams.get('error_description') ||
      hashParams.get('error_description') ||
      urlParams.get('error') ||
      hashParams.get('error');

    if (errorDesc) {
      setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase is not configured yet with live project keys. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
      );
      return;
    }

    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      let msg = 'Google sign-in failed.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        msg = (o.message as string) || (o.details as string) || (o.error_description as string) || msg;
      }
      setErrorMsg(msg);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase credentials not configured in environment. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
      );
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

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full h-10 px-4 bg-white/[0.03] hover:bg-white/[0.07] active:bg-white/[0.1] text-[#ededed] border border-white/[0.08] font-medium text-xs rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative py-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="bg-[#14161c] px-2 text-[#71717a]">or partner email</span>
            </div>
          </div>

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
        </div>

        <p className="text-center text-[11px] text-[#71717a] font-mono">
          Paradise Gym Operations · Station 01
        </p>
      </div>
    </div>
  );
}
