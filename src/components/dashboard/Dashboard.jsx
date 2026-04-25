import { useMemo, useState } from 'react';
import { useObservations } from '../../hooks/useObservations';
import KPICard from './KPICard';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Color palette (matches brand) ────────────────────────────────
const COLORS = {
  'Safe Behavior':         '#22c55e',
  'Positive Reinforcement':'#3b82f6',
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
const BRAND_BLUE = '#1B4F8A';
const BRAND_BLUE_MID = '#2E75B6';

// ── Helpers ──────────────────────────────────────────────────────
const isoWeek = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return `W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7).toString().padStart(2, '0')}`;
};
const pct = (num, den) => den === 0 ? '—' : `${Math.round((num / den) * 100)}%`;

// ── Filters bar ──────────────────────────────────────────────────
function FiltersBar({ days, setDays, crew, setCrew, crews }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-gray-500">Filter:</span>

      {/* Date range */}
      <div className="flex gap-1">
        {DATE_RANGES.map(r => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              days === r.days
                ? 'bg-brand-blue text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Crew */}
      <select
        value={crew}
        onChange={e => setCrew(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue-mid"
      >
        <option value="all">All Crews</option>
        {crews.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <div className="ml-auto text-xs text-gray-400">
        Live data · refreshes on new submissions
      </div>
    </div>
  );
}

// ── Chart wrapper ────────────────────────────────────────────────
function ChartCard({ title, children, span = 1 }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-5 ${span === 2 ? 'lg:col-span-2' : ''}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const [days, setDays] = useState(180);
  const [crew, setCrew] = useState('all');

  const { data, loading, error } = useObservations({ days, crewName: crew });

  // Derive unique crews for the filter dropdown
  const allCrews = useMemo(() => {
    const { data: all } = { data }; // re-use same hook data — just unique names
    return [...new Set(data.map(r => r.crew_name))].sort();
  }, [data]);

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
  const weeklyTrend = useMemo(() => {
    const map = {};
    data.forEach(r => {
      const wk = isoWeek(r.observed_at);
      if (!map[wk]) map[wk] = { week: wk, 'Safe Behavior': 0, 'At-Risk Behavior': 0, 'Near Miss': 0, 'Positive Reinforcement': 0 };
      map[wk][r.observation_category] = (map[wk][r.observation_category] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

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
  const rootCauses = useMemo(() => {
    const map = {};
    data.forEach(r => {
      (r.root_causes || []).forEach(cause => {
        map[cause] = (map[cause] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([cause, count]) => ({ cause: cause.replace(' / ', '/'), count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // ── Loading / error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⚡</div>
          <p className="text-sm">Loading observations…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium mb-1">Failed to load data</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Filters */}
      <FiltersBar days={days} setDays={setDays} crew={crew} setCrew={setCrew} crews={allCrews} />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Observations"  value={kpis.total}                    sub={`last ${days}d`} />
        <KPICard label="Safe : At-Risk"       value={`${kpis.ratio}:1`}             sub="ratio" intent="good" />
        <KPICard label="At-Risk + Near Miss"  value={kpis.atRisk}                   sub={pct(kpis.atRisk, kpis.total)} trend={kpis.atRisk > 30 ? 'up' : null} intent="bad" />
        <KPICard label="Near Misses"          value={kpis.nearMiss}                 sub="total reported" intent="bad" />
        <KPICard label="Follow-Up Closure"    value={pct(kpis.closedFU, kpis.followUps)} sub={`${kpis.closedFU}/${kpis.followUps} closed`} intent="good" />
        <KPICard label="Briefing Non-Comply"  value={kpis.briefingNo}               sub="job briefings missed" intent="bad" />
      </div>

      {/* Charts — row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Weekly trend — spans 2 cols */}
        <ChartCard title="Weekly Observation Trend by Category" span={2}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(COLORS).map(([cat, color]) => (
                <Line key={cat} type="monotone" dataKey={cat} stroke={color} strokeWidth={2} dot={false} />
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

      {/* Charts — row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* PPE compliance */}
        <ChartCard title="PPE Compliance Rate by Item (% applicable observations)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ppeCompliance} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`${val}%`, 'Compliance Rate']} />
              <Bar dataKey="rate" fill={BRAND_BLUE_MID} radius={[0, 4, 4, 0]}>
                {ppeCompliance.map((entry) => (
                  <Cell key={entry.label} fill={entry.rate < 85 ? '#ef4444' : entry.rate < 92 ? '#f59e0b' : BRAND_BLUE_MID} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Crew comparison */}
        <ChartCard title="Observations by Crew (total vs. at-risk %)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={crewComparison} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="crew" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="total"      name="Total Obs"   fill={BRAND_BLUE}     radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="atRiskPct"  name="At-Risk %"   fill="#f59e0b"        radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Root cause breakdown */}
      {rootCauses.length > 0 && (
        <ChartCard title="Root Cause Distribution (at-risk & near miss observations only)" span={2}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rootCauses} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cause" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </div>
  );
}
