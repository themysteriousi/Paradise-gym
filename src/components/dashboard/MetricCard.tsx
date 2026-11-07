import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'brand' | 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

const VARIANT_STYLES = {
  brand: {
    icon: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    value: 'text-white',
  },
  sky: {
    icon: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    value: 'text-sky-400',
  },
  emerald: {
    icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    value: 'text-emerald-400',
  },
  amber: {
    icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    value: 'text-amber-400',
  },
  rose: {
    icon: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    value: 'text-rose-400',
  },
  purple: {
    icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    value: 'text-purple-400',
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'brand',
  onClick,
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between transition ${
        onClick ? 'cursor-pointer hover:border-slate-700/80 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl border ${styles.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2">
        <p className={`text-2xl font-black tracking-tight ${styles.value}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

