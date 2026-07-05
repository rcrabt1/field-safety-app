import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * KPICard, the top-row summary metric tile.
 * trend: 'up' | 'down' | null
 * intent: 'good' | 'bad' | 'neutral', whether "up" is positive
 */
export default function KPICard({ label, value, sub, trend, intent = 'neutral' }) {
  const trendColor =
    trend === 'up'
      ? intent === 'good' ? 'text-brand-green' : 'text-red-500'
      : trend === 'down'
        ? intent === 'good' ? 'text-red-500' : 'text-brand-green'
        : 'text-gray-400';

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : null;

  return (
    <div className="bg-white rounded-xl border border-hairline px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-brand-navy leading-none mb-1">{value}</p>
      {(sub || trend) && (
        <p className="text-sm text-gray-500 flex items-center gap-1">
          {sub}
          {TrendIcon && <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} strokeWidth={2.5} />}
        </p>
      )}
    </div>
  );
}
