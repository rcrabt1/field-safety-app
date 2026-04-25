import { useState } from 'react';
import { supabase } from '../../lib/supabase';

// ── Form field constants ───────────────────────────────────────────
const WEATHER_OPTIONS = ['Clear','Overcast','Rain/Wet','High Wind','Extreme Heat','Extreme Cold','Low Visibility'];
const WORK_TYPES = ['Overhead Line','Underground Line','Substation','Transformer/Switching','Storm Response','Preventive Maintenance','Other'];
const ENERGIZED_OPTIONS = ['Energized','De-Energized','Unknown'];
const OBS_CATEGORIES = ['Safe Behavior','At-Risk Behavior','Near Miss','Positive Reinforcement'];
const SAFETY_RATINGS = ['Satisfactory','Needs Improvement','Unsatisfactory'];
const PPE_OPTIONS = ['Compliant','Non-Compliant','N/A'];
const YES_NO = ['Yes','No'];
const YES_NO_NA = ['Yes','No','N/A'];
const WORKER_ACK = ['Yes','No','Worker Not Present'];
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
const PPE_ITEMS = [
  { key: 'ppe_hard_hat',       label: 'Hard Hat' },
  { key: 'ppe_safety_glasses', label: 'Safety Glasses / Face Shield' },
  { key: 'ppe_arc_flash',      label: 'Arc Flash / FR Clothing' },
  { key: 'ppe_high_vis_vest',  label: 'High-Visibility Vest' },
  { key: 'ppe_rubber_gloves',  label: 'Rubber Insulating Gloves & Sleeves' },
  { key: 'ppe_fall_protection',label: 'Fall Protection' },
  { key: 'ppe_grounding',      label: 'Protective Grounds' },
];

// ── Default state ──────────────────────────────────────────────────
const defaultForm = {
  // Section A
  observed_at: new Date().toISOString().slice(0, 16),
  work_site: '',
  work_order_number: '',
  weather_condition: '',
  // Section B
  supervisor_name: '',
  crew_name: '',
  workers_observed: '',
  // Section C
  work_type: '',
  task_observed: '',
  energized_status: '',
  // Section D
  observation_category: '',
  safety_rating: '',
  // Section E - PPE
  ppe_hard_hat: '',
  ppe_safety_glasses: '',
  ppe_arc_flash: '',
  ppe_high_vis_vest: '',
  ppe_rubber_gloves: '',
  ppe_fall_protection: '',
  ppe_grounding: '',
  // Section F
  job_briefing_conducted: '',
  loto_applied: '',
  work_zone_established: '',
  tools_inspected: '',
  emergency_contacts_known: '',
  // Section G
  safe_behaviors_observed: '',
  at_risk_behaviors_observed: '',
  root_causes: [],
  // Section H
  immediate_corrective_action: '',
  follow_up_required: '',
  follow_up_owner: '',
  follow_up_due_date: '',
  worker_acknowledged: '',
  supervisor_notes: '',
};

// ── Sub-components ─────────────────────────────────────────────────
function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">
        {number}
      </span>
      <h2 className="text-base font-semibold text-brand-blue tracking-wide uppercase text-sm">
        {title}
      </h2>
      <div className="flex-1 h-px bg-brand-blue-lt" />
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-mid focus:border-transparent';
const selectClass = inputClass;
const textareaClass = `${inputClass} resize-none`;

function Select({ name, value, onChange, options, placeholder = 'Select…' }) {
  return (
    <select name={name} value={value} onChange={onChange} className={selectClass}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(o => (
        <label key={o} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
          value === o
            ? 'border-brand-blue bg-brand-blue-lt text-brand-blue font-medium'
            : 'border-gray-200 hover:border-gray-300 text-gray-700'
        }`}>
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            onChange={onChange}
            className="sr-only"
          />
          {o}
        </label>
      ))}
    </div>
  );
}

// ── Main form component ────────────────────────────────────────────
export default function ObservationForm() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const isAtRisk = form.observation_category === 'At-Risk Behavior' || form.observation_category === 'Near Miss';
  const needsFollowUp = form.follow_up_required === 'Yes';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRootCauseToggle = (cause) => {
    setForm(prev => ({
      ...prev,
      root_causes: prev.root_causes.includes(cause)
        ? prev.root_causes.filter(c => c !== cause)
        : [...prev.root_causes, cause],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    // Build payload — coerce types, strip empty strings to null
    const payload = {
      ...form,
      observed_at: new Date(form.observed_at).toISOString(),
      workers_observed: parseInt(form.workers_observed, 10) || null,
      work_order_number:          form.work_order_number || null,
      safe_behaviors_observed:    form.safe_behaviors_observed || null,
      at_risk_behaviors_observed: form.at_risk_behaviors_observed || null,
      root_causes:                form.root_causes.length > 0 ? form.root_causes : null,
      immediate_corrective_action: form.immediate_corrective_action || null,
      follow_up_owner:            form.follow_up_owner || null,
      follow_up_due_date:         form.follow_up_due_date || null,
      follow_up_completed:        false,
      supervisor_notes:           form.supervisor_notes || null,
    };

    const { error } = await supabase.from('observations').insert([payload]);

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('success');
      setForm(defaultForm);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Success state ─────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Observation Submitted</h2>
        <p className="text-gray-500 mb-8">Your observation has been recorded. It will appear in the dashboard within seconds.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setStatus('idle')}
            className="px-5 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-mid transition-colors"
          >
            Submit Another
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2 border border-brand-blue text-brand-blue rounded-lg text-sm font-medium hover:bg-brand-blue-lt transition-colors"
          >
            View Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Error banner */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Submission failed:</strong> {errorMsg}
        </div>
      )}

      {/* ── Section A: Observation Header ──────────────────────── */}
      <section>
        <SectionHeader number="A" title="Observation Header" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Date & Time" required>
            <input
              type="datetime-local"
              name="observed_at"
              value={form.observed_at}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Work Site / Location" required>
            <input type="text" name="work_site" value={form.work_site} onChange={handleChange} required placeholder="Site name or address" className={inputClass} />
          </Field>

          <Field label="Work Order #" hint="Optional — link to dispatch system">
            <input type="text" name="work_order_number" value={form.work_order_number} onChange={handleChange} placeholder="e.g. WO-48291" className={inputClass} />
          </Field>

          <Field label="Weather Conditions" required>
            <Select name="weather_condition" value={form.weather_condition} onChange={handleChange} options={WEATHER_OPTIONS} />
          </Field>
        </div>
      </section>

      {/* ── Section B: Personnel ───────────────────────────────── */}
      <section>
        <SectionHeader number="B" title="Personnel" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Supervisor Name" required>
            <input type="text" name="supervisor_name" value={form.supervisor_name} onChange={handleChange} required placeholder="Full name" className={inputClass} />
          </Field>

          <Field label="Crew / Team Name" required>
            <input type="text" name="crew_name" value={form.crew_name} onChange={handleChange} required placeholder="e.g. Alpha Crew" className={inputClass} />
          </Field>

          <Field label="Number of Workers Observed" required>
            <input type="number" name="workers_observed" value={form.workers_observed} onChange={handleChange} required min="1" max="50" placeholder="1–50" className={inputClass} />
          </Field>
        </div>
      </section>

      {/* ── Section C: Work Classification ────────────────────── */}
      <section>
        <SectionHeader number="C" title="Work Classification" />
        <div className="grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Work Type" required>
              <Select name="work_type" value={form.work_type} onChange={handleChange} options={WORK_TYPES} />
            </Field>
            <Field label="Energized Work?" required>
              <Select name="energized_status" value={form.energized_status} onChange={handleChange} options={ENERGIZED_OPTIONS} />
            </Field>
          </div>
          <Field label="Specific Task Observed" required>
            <input type="text" name="task_observed" value={form.task_observed} onChange={handleChange} required placeholder="e.g. Phase conductor splice on 12kV distribution line" className={inputClass} />
          </Field>
        </div>
      </section>

      {/* ── Section D: Observation Classification ─────────────── */}
      <section>
        <SectionHeader number="D" title="Observation Classification" />
        <div className="space-y-5">
          <Field label="Observation Category" required>
            <RadioGroup name="observation_category" value={form.observation_category} onChange={handleChange} options={OBS_CATEGORIES} />
          </Field>
          <Field label="Overall Safety Rating" required>
            <RadioGroup name="safety_rating" value={form.safety_rating} onChange={handleChange} options={SAFETY_RATINGS} />
          </Field>
        </div>
      </section>

      {/* ── Section E: PPE Compliance ─────────────────────────── */}
      <section>
        <SectionHeader number="E" title="PPE Compliance" />
        <div className="space-y-3">
          {PPE_ITEMS.map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm font-medium text-gray-700 w-56">{item.label}</span>
              <div className="flex gap-2">
                {PPE_OPTIONS.map(opt => (
                  <label key={opt} className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-medium transition-colors ${
                    form[item.key] === opt
                      ? opt === 'Compliant'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : opt === 'Non-Compliant'
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-400 bg-gray-100 text-gray-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name={item.key}
                      value={opt}
                      checked={form[item.key] === opt}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section F: Safe Work Practices ────────────────────── */}
      <section>
        <SectionHeader number="F" title="Safe Work Practices" />
        <div className="space-y-5">
          {[
            { name: 'job_briefing_conducted',  label: 'Job Briefing Conducted', required: true, options: YES_NO },
            { name: 'loto_applied',            label: 'LOTO Properly Applied',  required: true, options: YES_NO_NA },
            { name: 'work_zone_established',   label: 'Work Zone Established',  required: true, options: YES_NO_NA },
            { name: 'tools_inspected',         label: 'Tools & Equipment Inspected', required: true, options: YES_NO_NA },
            { name: 'emergency_contacts_known',label: 'Emergency Contacts Known to Crew', required: true, options: YES_NO },
          ].map(f => (
            <Field key={f.name} label={f.label} required={f.required}>
              <RadioGroup name={f.name} value={form[f.name]} onChange={handleChange} options={f.options} />
            </Field>
          ))}
        </div>
      </section>

      {/* ── Section G: Behavior Details ───────────────────────── */}
      <section>
        <SectionHeader number="G" title="Behavior Details" />
        <div className="space-y-5">
          <Field label="Safe Behaviors Observed" hint="Describe positive behaviors observed during the task.">
            <textarea name="safe_behaviors_observed" value={form.safe_behaviors_observed} onChange={handleChange} rows={3} maxLength={500} placeholder="e.g. Crew conducted thorough job briefing before starting work. All hazards identified and controls discussed." className={textareaClass} />
          </Field>

          <Field label="At-Risk Behaviors Observed" hint={isAtRisk ? 'Required for At-Risk / Near Miss observations.' : 'Describe any unsafe behaviors observed.'}>
            <textarea name="at_risk_behaviors_observed" value={form.at_risk_behaviors_observed} onChange={handleChange} rows={3} maxLength={500} required={isAtRisk} placeholder="e.g. Lineman observed not wearing safety glasses during overhead connector installation." className={textareaClass} />
          </Field>

          {isAtRisk && (
            <Field label="Root Cause(s) of At-Risk Behavior" hint="Select all that apply.">
              <div className="flex flex-wrap gap-2">
                {ROOT_CAUSES.map(cause => (
                  <button
                    key={cause}
                    type="button"
                    onClick={() => handleRootCauseToggle(cause)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      form.root_causes.includes(cause)
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'border-gray-300 text-gray-600 hover:border-brand-blue-mid'
                    }`}
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      </section>

      {/* ── Section H: Corrective Action & Follow-Up ──────────── */}
      <section>
        <SectionHeader number="H" title="Corrective Action & Follow-Up" />
        <div className="space-y-5">
          <Field label="Immediate Corrective Action Taken" hint="What did you do on the spot?">
            <textarea name="immediate_corrective_action" value={form.immediate_corrective_action} onChange={handleChange} rows={2} maxLength={300} placeholder="e.g. Stopped work, re-briefed crew, confirmed compliance before resuming." className={textareaClass} />
          </Field>

          <Field label="Follow-Up Required?" required>
            <RadioGroup name="follow_up_required" value={form.follow_up_required} onChange={handleChange} options={YES_NO} />
          </Field>

          {needsFollowUp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pl-4 border-l-2 border-brand-blue-lt">
              <Field label="Follow-Up Owner" required>
                <input type="text" name="follow_up_owner" value={form.follow_up_owner} onChange={handleChange} required={needsFollowUp} placeholder="Name or role" className={inputClass} />
              </Field>
              <Field label="Follow-Up Due Date" required>
                <input type="date" name="follow_up_due_date" value={form.follow_up_due_date} onChange={handleChange} required={needsFollowUp} min={new Date().toISOString().split('T')[0]} className={inputClass} />
              </Field>
            </div>
          )}

          <Field label="Worker Acknowledged Observation" required>
            <RadioGroup name="worker_acknowledged" value={form.worker_acknowledged} onChange={handleChange} options={WORKER_ACK} />
          </Field>

          <Field label="Supervisor Notes" hint="Any additional context not captured above.">
            <textarea name="supervisor_notes" value={form.supervisor_notes} onChange={handleChange} rows={2} maxLength={300} placeholder="Optional notes…" className={textareaClass} />
          </Field>
        </div>
      </section>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className="pt-2 pb-8">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full sm:w-auto px-8 py-3 bg-brand-blue text-white font-semibold rounded-lg hover:bg-brand-blue-mid transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Observation'}
        </button>
      </div>
    </form>
  );
}
