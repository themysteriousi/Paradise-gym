import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'brand' | 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

const VALUE_COLORS: Record<string, string> = {
  brand: 'text-[#ededed]',
  sky: 'text-[#ededed]',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  purple: 'text-[#ededed]',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'brand',
  onClick,
}: MetricCardProps) {
  const valueColor = VALUE_COLORS[variant] || 'text-[#ededed]';

  return (
    <div
      onClick={onClick}
      className={`bg-[#14161c] border border-white/[0.08] p-4 rounded-2xl flex flex-col justify-between transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:border-white/[0.16]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#a1a1a6]">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#a1a1a6] flex items-center justify-center">
          <Icon className="w-4 h-4 stroke-[1.75]" />
        </div>
      </div>

      <div className="mt-2.5">
        <p className={`text-2xl font-semibold tracking-normal tabular-nums ${valueColor}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#71717a] mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

