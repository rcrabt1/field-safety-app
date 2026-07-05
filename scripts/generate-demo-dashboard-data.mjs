/**
 * Generates the static demo dataset behind the Safety Manager dashboard.
 *
 * This is deliberately NOT run at build time or runtime. It's a one-off
 * generator: run it, commit the output to public/data/observations.json,
 * and the dashboard reads that file forever after. That keeps the dashboard
 * fast (no network round trip to a database), free of any keep-alive cron
 * dependency, and identical no matter when or how often someone loads it.
 *
 * The data spans a fixed 182-day window ending at DATA_END, not "today" at
 * generation time, so the charts never drift.
 *
 * It also bakes in a deliberate storyline so the charts have something
 * worth talking about instead of flat, uniform lines:
 *   - Echo Crew's at-risk rate and job-briefing rate both worsen steadily
 *     over the 26 weeks, so the weekly trend and crew comparison charts
 *     show a crew that clearly needs attention.
 *   - Echo Crew's rubber glove compliance falls well below the 85% target,
 *     showing a specific PPE behavior that needs correction.
 *   - "Time Pressure / Rushing" is the dominant root cause across at-risk
 *     and near miss observations company-wide.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'observations.json');

const DATA_END = new Date('2026-07-06T00:00:00.000Z');
const WEEKS = 26;

const GOOD_CREWS = [
  'Alpha Crew', 'Bravo Crew', 'Charlie Crew', 'Delta Crew', 'Foxtrot Crew',
  'Golf Crew', 'Hotel Crew', 'India Crew', 'Juliett Crew', 'Kilo Crew',
  'Lima Crew', 'Mike Crew', 'November Crew', 'Oscar Crew',
];
const PROBLEM_CREW = 'Echo Crew';

const ROOT_CAUSES = [
  'Time Pressure / Rushing',
  'Complacency / Habit',
  'Lack of Knowledge',
  'Distraction',
  'Peer Pressure / Normalization',
  'Environmental Factor',
  'Unclear Procedure',
  'Other',
];

const PPE_KEYS = [
  'ppe_hard_hat', 'ppe_safety_glasses', 'ppe_arc_flash',
  'ppe_high_vis_vest', 'ppe_rubber_gloves', 'ppe_fall_protection', 'ppe_grounding',
];

const rand = () => Math.random();
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const lerp = (a, b, t) => a + (b - a) * t;

function pickCategory(atRiskRate) {
  const nonRisk = 1 - atRiskRate;
  const pSafe = nonRisk * 0.722;
  const pPositive = nonRisk * 0.278;
  const pAtRisk = atRiskRate * 0.786;
  const r = rand();
  if (r < pSafe) return 'Safe Behavior';
  if (r < pSafe + pPositive) return 'Positive Reinforcement';
  if (r < pSafe + pPositive + pAtRisk) return 'At-Risk Behavior';
  return 'Near Miss';
}

function pickRootCauses() {
  const count = randInt(1, 2);
  const causes = new Set();
  while (causes.size < count) {
    // "Time Pressure / Rushing" is weighted heavily to dominate the chart.
    causes.add(rand() < 0.45 ? ROOT_CAUSES[0] : ROOT_CAUSES[randInt(1, ROOT_CAUSES.length - 1)]);
  }
  return [...causes];
}

function ppeStatus(complianceRate, allowNA) {
  if (allowNA && rand() < 0.35) return 'N/A';
  return rand() < complianceRate ? 'Compliant' : 'Non-Compliant';
}

function generateRow(crewName, week, { atRiskRate, briefingYesRate, rubberGlovesCompliance, otherPpeCompliance }) {
  const dayOffsetInWeek = randInt(0, 6);
  const daysAgo = (WEEKS - 1 - week) * 7 + dayOffsetInWeek;
  const observed = new Date(DATA_END);
  observed.setUTCDate(observed.getUTCDate() - daysAgo);
  observed.setUTCHours(randInt(6, 17), randInt(0, 59), 0, 0);

  const category = pickCategory(atRiskRate);
  const isAtRisk = category === 'At-Risk Behavior' || category === 'Near Miss';
  const followUpRequired = isAtRisk && rand() < 0.7 ? 'Yes' : 'No';

  const row = {
    observed_at: observed.toISOString(),
    crew_name: crewName,
    observation_category: category,
    follow_up_required: followUpRequired,
    follow_up_completed: followUpRequired === 'Yes' && rand() < 0.65,
    job_briefing_conducted: rand() < briefingYesRate ? 'Yes' : 'No',
    root_causes: isAtRisk ? pickRootCauses() : null,
  };

  for (const key of PPE_KEYS) {
    const rate = key === 'ppe_rubber_gloves' ? rubberGlovesCompliance : otherPpeCompliance;
    row[key] = ppeStatus(rate, key === 'ppe_fall_protection');
  }

  return row;
}

const rows = [];

for (let week = 0; week < WEEKS; week++) {
  const t = week / (WEEKS - 1);

  for (const crew of GOOD_CREWS) {
    const obsCount = randInt(11, 17);
    for (let i = 0; i < obsCount; i++) {
      rows.push(generateRow(crew, week, {
        atRiskRate: 0.15 + (rand() * 0.04 - 0.02),
        briefingYesRate: 0.97,
        rubberGlovesCompliance: 0.92,
        otherPpeCompliance: 0.93,
      }));
    }
  }

  const echoObsCount = randInt(13, 19);
  for (let i = 0; i < echoObsCount; i++) {
    rows.push(generateRow(PROBLEM_CREW, week, {
      atRiskRate: lerp(0.15, 0.50, t),
      briefingYesRate: lerp(0.90, 0.68, t),
      rubberGlovesCompliance: lerp(0.88, 0.40, t),
      otherPpeCompliance: lerp(0.92, 0.87, t),
    }));
  }
}

rows.sort((a, b) => new Date(a.observed_at) - new Date(b.observed_at));

writeFileSync(OUT_PATH, JSON.stringify({ dataEnd: DATA_END.toISOString(), rows }));

console.log(`Wrote ${rows.length} rows to ${OUT_PATH}`);
