/**
 * KPICard — top-row summary metric tile.
 * trend: 'up' | 'down' | null
 * intent: 'good' | 'bad' | 'neutral' — whether "up" is positive
 */
export default function KPICard({ label, value, sub, trend, intent = 'neutral' }) {
  const trendColor =
    trend === 'up'
      ? intent === 'good' ? 'text-green-600' : 'text-red-500'
      : trend === 'down'
        ? intent === 'good' ? 'text-red-500' : 'text-green-600'
        : 'text-gray-400';

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</p>
      {(sub || trend) && (
        <p className="text-sm text-gray-500">
          {sub}
          {trend && <span className={`ml-1 font-semibold ${trendColor}`}>{trendSymbol}</span>}
        </p>
      )}
    </div>
  );
}
