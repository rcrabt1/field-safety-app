import { useMemo, useState } from 'react';
import { useRawObservations } from '../../hooks/useObservations';
import KPICard from './KPICard';
import { Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Color palette (matches brand) ────────────────────────────────
const COLORS = {
  'Safe Behavior':         '#50BB40', // brand-green
  'Positive Reinforcement':'#14BCD9', // brand-cyan
  'At-Risk Behavior':      '#f59e0b',
  'Near Miss':             '#ef4444',
};
const PPE_LABELS = [
  { key: 'ppe_hard_hat',        label: 'Hard Hat' },
  { key: 'ppe_safety_glasses',  label: 'Safety Glasses' },
  { key: 'ppe_arc_flash',       label: 'Arc Flash' },
  { key: 'ppe_high_vis_vest',   label: 'Hi-Vis Vest' },
  { key: 'ppe_rubber_gloves',   label: 'Rubber Gloves' },
  { key: 'ppe_fall_protection', label: 'Fall Protection' },
  { key: 'ppe_grounding',       label: 'Grounding' },
];
const DATE_RANGES = [
  { label: '30 days',  days: 30 },
  { label: '90 days',  days: 90 },
  { label: '6 months', days: 180 },
];
const BRAND_NAVY = '#005984';
const BRAND_GREEN = '#50BB40';

const pct = (num, den) => den === 0 ? 'N/A' : `${Math.round((num / den) * 100)}%`;

// ── Filters bar ──────────────────────────────────────────────────
function FiltersBar({ days, setDays, crew, setCrew, crews }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-hairline rounded-xl px-4 py-3">
      <span className="text-sm font-medium text-gray-500">Filter:</span>

      {/* Date range */}
      <div className="flex gap-1">
        {DATE_RANGES.map(r => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              days === r.days
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-hairline" />

      {/* Crew */}
      <select
        value={crew}
        onChange={e => setCrew(e.target.value)}
        className="border border-hairline rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
      >
        <option value="all">All Crews</option>
        {crews.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <div className="ml-auto text-xs text-gray-400">
        Demo dataset, trends shown are illustrative
      </div>
    </div>
  );
}

// ── Chart wrapper ────────────────────────────────────────────────
function ChartCard({ title, children, span = 1 }) {
  return (
    <div className={`bg-white border border-hairline rounded-2xl p-5 ${span === 2 ? 'lg:col-span-2' : ''}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const [days, setDays] = useState(180);
  const [crew, setCrew] = useState('all');

  const { data: dataset, loading, error, refetch } = useRawObservations();

  const data = useMemo(() => {
    if (!dataset) return [];
    const anchor = new Date(dataset.dataEnd);
    const since = new Date(anchor);
    since.setUTCDate(since.getUTCDate() - days);
    return dataset.rows.filter(r => {
      if (new Date(r.observed_at) < since) return false;
      if (crew !== 'all' && r.crew_name !== crew) return false;
      return true;
    });
  }, [dataset, days, crew]);

  const allCrews = useMemo(() => {
    if (!dataset) return [];
    return [...new Set(dataset.rows.map(r => r.crew_name))].sort();
  }, [dataset]);

  // ── KPI derivations ──────────────────────────────────────────
  const kpis = useMemo(() => {
    const total       = data.length;
    const atRisk      = data.filter(r => r.observation_category === 'At-Risk Behavior' || r.observation_category === 'Near Miss').length;
    const nearMiss    = data.filter(r => r.observation_category === 'Near Miss').length;
    const safe        = data.filter(r => r.observation_category === 'Safe Behavior').length;
    const ratio       = atRisk === 0 ? '∞' : (safe / atRisk).toFixed(1);
    const followUps   = data.filter(r => r.follow_up_required === 'Yes');
    const closedFU    = followUps.filter(r => r.follow_up_completed).length;
    const briefingNo  = data.filter(r => r.job_briefing_conducted === 'No').length;
    return { total, atRisk, nearMiss, ratio, followUps: followUps.length, closedFU, briefingNo };
  }, [data]);

  // ── Weekly trend ─────────────────────────────────────────────
  // Buckets are measured in whole weeks back from the dataset's fixed end
  // date, not calendar weeks, so every bucket covers a full 7 days and the
  // chart never shows an artificial dip from a partial trailing week.
  const weeklyTrend = useMemo(() => {
    if (!dataset) return [];
    const dayOnly = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const anchorDay = dayOnly(new Date(dataset.dataEnd));
    const map = {};
    data.forEach(r => {
      const daysAgo = Math.round((anchorDay - dayOnly(new Date(r.observed_at))) / 86400000);
      const weeksAgo = Math.floor(daysAgo / 7);
      if (!map[weeksAgo]) map[weeksAgo] = { weeksAgo, 'Safe Behavior': 0, 'At-Risk Behavior': 0, 'Near Miss': 0, 'Positive Reinforcement': 0 };
      map[weeksAgo][r.observation_category] = (map[weeksAgo][r.observation_category] || 0) + 1;
    });
    return Object.values(map)
      .sort((a, b) => b.weeksAgo - a.weeksAgo)
      .map((w, i) => ({ ...w, week: `W${(i + 1).toString().padStart(2, '0')}` }));
  }, [data, dataset]);

  // ── Category pie ─────────────────────────────────────────────
  const categoryPie = useMemo(() => {
    const map = {};
    data.forEach(r => { map[r.observation_category] = (map[r.observation_category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  // ── PPE compliance rates ──────────────────────────────────────
  const ppeCompliance = useMemo(() => {
    return PPE_LABELS.map(({ key, label }) => {
      const applicable = data.filter(r => r[key] !== 'N/A');
      const compliant  = applicable.filter(r => r[key] === 'Compliant').length;
      const rate       = applicable.length === 0 ? 0 : Math.round((compliant / applicable.length) * 100);
      return { label, rate, applicable: applicable.length };
    });
  }, [data]);

  // ── Crew comparison ───────────────────────────────────────────
  const crewComparison = useMemo(() => {
    const map = {};
    data.forEach(r => {
      if (!map[r.crew_name]) map[r.crew_name] = { crew: r.crew_name, total: 0, atRisk: 0 };
      map[r.crew_name].total++;
      if (r.observation_category === 'At-Risk Behavior' || r.observation_category === 'Near Miss') {
        map[r.crew_name].atRisk++;
      }
    });
    return Object.values(map)
      .map(c => ({ ...c, atRiskPct: Math.round((c.atRisk / c.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  // ── Root cause breakdown ──────────────────────────────────────
  // Capped to the top 6 so the chart always shows a consistent, readable
  // set of labels rather than however many distinct causes happen to show
  // up in a given filter.
  const rootCauses = useMemo(() => {
    const map = {};
    data.forEach(r => {
      (r.root_causes || []).forEach(cause => {
        map[cause] = (map[cause] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([cause, count]) => ({ cause: cause.replace(' / ', '/'), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [data]);

  // ── Loading / error states ────────────────────────────────────
  if (loading || !dataset) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <Loader2 className="w-7 h-7 mx-auto mb-2 text-brand-cyan animate-spin" strokeWidth={2.5} />
          <p className="text-sm">Loading observations…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white border border-hairline rounded-2xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-brand-navy" strokeWidth={1.75} />
        <p className="text-gray-900 font-semibold mb-1">Dashboard data is temporarily unavailable</p>
        <p className="text-gray-500 text-sm mb-5">The demo dataset didn't load. This usually clears up on a retry.</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-cyan hover:text-brand-navy transition-colors"
        >
          <RotateCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Filters */}
      <FiltersBar days={days} setDays={setDays} crew={crew} setCrew={setCrew} crews={allCrews} />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Observations"  value={kpis.total.toLocaleString()}   sub={`last ${days}d`} />
        <KPICard label="Safe : At-Risk"       value={`${kpis.ratio}:1`}             sub="ratio" intent="good" />
        <KPICard label="At-Risk + Near Miss"  value={kpis.atRisk.toLocaleString()}  sub={pct(kpis.atRisk, kpis.total)} trend={kpis.atRisk / kpis.total > 0.3 ? 'up' : null} intent="bad" />
        <KPICard label="Near Misses"          value={kpis.nearMiss.toLocaleString()} sub="total reported" intent="bad" />
        <KPICard label="Follow-Up Closure"    value={pct(kpis.closedFU, kpis.followUps)} sub={`${kpis.closedFU}/${kpis.followUps} closed`} intent="good" />
        <KPICard label="Briefing Non-Comply"  value={kpis.briefingNo.toLocaleString()} sub="job briefings missed" intent="bad" />
      </div>

      {/* Charts, row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Weekly trend, spans 2 cols */}
        <ChartCard title="Weekly Observation Trend by Category" span={2}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(COLORS).map(([cat, color]) => (
                <Line key={cat} type="linear" dataKey={cat} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category breakdown pie */}
        <ChartCard title="Observation Category Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                {categoryPie.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts, row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* PPE compliance */}
        <ChartCard title="PPE Compliance Rate by Item (% applicable observations)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ppeCompliance} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`${val}%`, 'Compliance Rate']} />
              <Bar dataKey="rate" fill={BRAND_GREEN} radius={[0, 4, 4, 0]}>
                {ppeCompliance.map((entry) => (
                  <Cell key={entry.label} fill={entry.rate < 85 ? '#ef4444' : entry.rate < 92 ? '#f59e0b' : BRAND_GREEN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Crew comparison */}
        <ChartCard title="Observations by Crew (total vs. at-risk %)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={crewComparison.slice(0, 15)} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="crew" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="total"      name="Total Obs"   fill={BRAND_NAVY}     radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="atRiskPct"  name="At-Risk %"   fill="#f59e0b"        radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Root cause breakdown */}
      {rootCauses.length > 0 && (
        <ChartCard title="Top Root Causes (at-risk & near miss observations only)" span={2}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={rootCauses} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cause" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={80} padding={{ left: 30, right: 30 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <p className="text-center text-xs text-gray-400">
        Showing {kpis.total.toLocaleString()} observations across {crewComparison.length} crews. Top 15 crews charted above.
      </p>

    </div>
  );
}
