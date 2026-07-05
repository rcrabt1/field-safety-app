import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

// ── Form field constants ───────────────────────────────────────────
const WEATHER_OPTIONS = ['Clear','Overcast','Rain/Wet','High Wind','Extreme Heat','Extreme Cold','Low Visibility'];
const WORK_TYPES = ['Overhead Line','Underground Line','Substation','Transformer/Switching','Storm Response','Preventive Maintenance','Other'];
const ENERGIZED_OPTIONS = ['Energized','De-Energized','Unknown'];
const OBS_CATEGORIES = ['Safe Behavior','At-Risk Behavior','Near Miss','Positive Reinforcement'];
const SAFETY_RATINGS = ['Satisfactory','Needs Improvement','Unsatisfactory'];
const PPE_OPTIONS = ['Compliant','Non-Compliant'];
const YES_NO = ['Yes','No'];
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

const STEPS = ['Header & Crew', 'Classification', 'PPE & Practices', 'Behavior', 'Follow-Up'];

// ── Default state ──────────────────────────────────────────────────
const defaultForm = {
  observed_at: new Date().toISOString().slice(0, 16),
  work_site: '',
  work_order_number: '',
  weather_condition: '',
  supervisor_name: '',
  crew_name: '',
  workers_observed: '',
  work_type: '',
  task_observed: '',
  energized_status: '',
  observation_category: '',
  safety_rating: '',
  ppe_hard_hat: '',
  ppe_safety_glasses: '',
  ppe_arc_flash: '',
  ppe_high_vis_vest: '',
  ppe_rubber_gloves: '',
  ppe_fall_protection: '',
  ppe_grounding: '',
  job_briefing_conducted: '',
  loto_applied: '',
  work_zone_established: '',
  tools_inspected: '',
  emergency_contacts_known: '',
  safe_behaviors_observed: '',
  at_risk_behaviors_observed: '',
  root_causes: [],
  immediate_corrective_action: '',
  follow_up_required: '',
  follow_up_owner: '',
  follow_up_due_date: '',
  worker_acknowledged: '',
  supervisor_notes: '',
};

// ── Sub-components ─────────────────────────────────────────────────
function GroupLabel({ children }) {
  return (
    <h3 className="text-xs font-bold text-brand-navy tracking-wide uppercase mb-4">{children}</h3>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-brand-navy ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = 'w-full border border-hairline rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent';
const selectClass = inputClass;
const textareaClass = `${inputClass} resize-none`;

function Select({ name, value, onChange, options, required, placeholder = 'Select…' }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`${selectClass} appearance-none pr-10`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function RadioGroup({ name, value, onChange, options, required }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map(o => (
        <label key={o} className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm transition-colors ${
          value === o
            ? 'border-brand-navy bg-brand-navy-lt text-brand-navy font-semibold'
            : 'border-hairline bg-white hover:border-brand-cyan text-gray-700'
        }`}>
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            onChange={onChange}
            required={required}
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
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const isAtRisk = form.observation_category === 'At-Risk Behavior' || form.observation_category === 'Near Miss';
  const needsFollowUp = form.follow_up_required === 'Yes';
  const isLastStep = step === STEPS.length - 1;

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

  // Every field is optional in this demo, but the underlying table still
  // expects a valid value for these columns, so anything left blank falls
  // back to a sensible default rather than blocking the visitor.
  const submitObservation = async () => {
    setStatus('submitting');
    setErrorMsg('');

    const orDefault = (val, fallback) => (val ? val : fallback);

    const payload = {
      ...form,
      observed_at: new Date(form.observed_at || Date.now()).toISOString(),
      work_site: orDefault(form.work_site, 'Not specified'),
      weather_condition: orDefault(form.weather_condition, 'Clear'),
      supervisor_name: orDefault(form.supervisor_name, 'Demo Supervisor'),
      crew_name: orDefault(form.crew_name, 'Demo Crew'),
      workers_observed: parseInt(form.workers_observed, 10) || 1,
      work_type: orDefault(form.work_type, 'Other'),
      task_observed: orDefault(form.task_observed, 'Not specified'),
      energized_status: orDefault(form.energized_status, 'Unknown'),
      observation_category: orDefault(form.observation_category, 'Safe Behavior'),
      safety_rating: orDefault(form.safety_rating, 'Satisfactory'),
      ppe_hard_hat: orDefault(form.ppe_hard_hat, 'N/A'),
      ppe_safety_glasses: orDefault(form.ppe_safety_glasses, 'N/A'),
      ppe_arc_flash: orDefault(form.ppe_arc_flash, 'N/A'),
      ppe_high_vis_vest: orDefault(form.ppe_high_vis_vest, 'N/A'),
      ppe_rubber_gloves: orDefault(form.ppe_rubber_gloves, 'N/A'),
      ppe_fall_protection: orDefault(form.ppe_fall_protection, 'N/A'),
      ppe_grounding: orDefault(form.ppe_grounding, 'N/A'),
      job_briefing_conducted: orDefault(form.job_briefing_conducted, 'Yes'),
      loto_applied: orDefault(form.loto_applied, 'N/A'),
      work_zone_established: orDefault(form.work_zone_established, 'N/A'),
      tools_inspected: orDefault(form.tools_inspected, 'N/A'),
      emergency_contacts_known: orDefault(form.emergency_contacts_known, 'Yes'),
      follow_up_required: orDefault(form.follow_up_required, 'No'),
      worker_acknowledged: orDefault(form.worker_acknowledged, 'Worker Not Present'),
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
      setStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Only the current step's inputs exist in the DOM, so native browser
  // validation on this <form> naturally scopes to the visible step.
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLastStep) {
      submitObservation();
    } else {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Success state ─────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-14 h-14 text-brand-green mx-auto mb-4" strokeWidth={1.75} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Observation Submitted</h2>
        <p className="text-gray-500 mb-8">Your observation has been recorded. It will appear in the dashboard within seconds.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setStatus('idle')}
            className="px-5 py-3 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-cyan hover:text-brand-navy transition-colors"
          >
            Submit Another
          </button>
          <a
            href="/dashboard"
            className="px-5 py-3 border border-brand-navy text-brand-navy rounded-xl text-sm font-semibold hover:bg-brand-navy-lt transition-colors"
          >
            View Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto px-4 pb-28">

      {/* Progress indicator */}
      <div className="pt-2 pb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex-1 h-1.5 mx-0.5 rounded-full ${i <= step ? 'bg-brand-green' : 'bg-hairline'}`} />
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          <strong>Submission failed:</strong> {errorMsg}
        </div>
      )}

      {/* ── Step 1: Header & Crew ──────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <Field label="Date & Time">
              <input type="datetime-local" name="observed_at" value={form.observed_at} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Work Site / Location">
              <input type="text" name="work_site" value={form.work_site} onChange={handleChange} placeholder="Site name or address" className={inputClass} />
            </Field>
            <Field label="Work Order #" hint="Optional, links to the dispatch system">
              <input type="text" name="work_order_number" value={form.work_order_number} onChange={handleChange} placeholder="e.g. WO-48291" className={inputClass} />
            </Field>
            <Field label="Weather Conditions">
              <Select name="weather_condition" value={form.weather_condition} onChange={handleChange} options={WEATHER_OPTIONS} />
            </Field>
          </div>

          <div className="pt-2">
            <GroupLabel>Personnel</GroupLabel>
            <div className="grid grid-cols-1 gap-5">
              <Field label="Supervisor Name">
                <input type="text" name="supervisor_name" value={form.supervisor_name} onChange={handleChange} placeholder="Full name" className={inputClass} />
              </Field>
              <Field label="Crew / Team Name">
                <input type="text" name="crew_name" value={form.crew_name} onChange={handleChange} placeholder="e.g. Alpha Crew" className={inputClass} />
              </Field>
              <Field label="Number of Workers Observed">
                <input type="number" name="workers_observed" value={form.workers_observed} onChange={handleChange} min="1" max="50" placeholder="1 to 50" className={inputClass} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Classification ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <Field label="Work Type">
              <Select name="work_type" value={form.work_type} onChange={handleChange} options={WORK_TYPES} />
            </Field>
            <Field label="Energized Work?">
              <Select name="energized_status" value={form.energized_status} onChange={handleChange} options={ENERGIZED_OPTIONS} />
            </Field>
            <Field label="Specific Task Observed">
              <input type="text" name="task_observed" value={form.task_observed} onChange={handleChange} placeholder="e.g. Phase conductor splice on 12kV distribution line" className={inputClass} />
            </Field>
          </div>

          <div className="pt-2 space-y-5">
            <Field label="Observation Category">
              <RadioGroup name="observation_category" value={form.observation_category} onChange={handleChange} options={OBS_CATEGORIES} />
            </Field>
            <Field label="Overall Safety Rating">
              <RadioGroup name="safety_rating" value={form.safety_rating} onChange={handleChange} options={SAFETY_RATINGS} />
            </Field>
          </div>
        </div>
      )}

      {/* ── Step 3: PPE & Practices ────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <GroupLabel>PPE Compliance</GroupLabel>
            <div className="space-y-4">
              {PPE_ITEMS.map(item => (
                <div key={item.key}>
                  <p className="text-sm font-medium text-gray-700 mb-2">{item.label}</p>
                  <div className="flex gap-2">
                    {PPE_OPTIONS.map(opt => (
                      <label key={opt} className={`flex-1 text-center px-2 py-2.5 rounded-lg border cursor-pointer text-xs font-semibold transition-colors ${
                        form[item.key] === opt
                          ? opt === 'Compliant'
                            ? 'border-brand-green bg-brand-green-lt text-brand-green'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-hairline bg-white text-gray-500 hover:border-brand-cyan'
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
          </div>

          <div>
            <GroupLabel>Safe Work Practices</GroupLabel>
            <div className="space-y-5">
              {[
                { name: 'job_briefing_conducted',  label: 'Job Briefing Conducted', options: YES_NO },
                { name: 'loto_applied',            label: 'LOTO Properly Applied',  options: YES_NO },
                { name: 'work_zone_established',   label: 'Work Zone Established',  options: YES_NO },
                { name: 'tools_inspected',         label: 'Tools & Equipment Inspected', options: YES_NO },
                { name: 'emergency_contacts_known',label: 'Emergency Contacts Known to Crew', options: YES_NO },
              ].map(f => (
                <Field key={f.name} label={f.label}>
                  <RadioGroup name={f.name} value={form[f.name]} onChange={handleChange} options={f.options} />
                </Field>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Behavior Details ───────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <Field label="Safe Behaviors Observed" hint="Describe positive behaviors observed during the task.">
            <textarea name="safe_behaviors_observed" value={form.safe_behaviors_observed} onChange={handleChange} rows={3} maxLength={500} placeholder="e.g. Crew conducted thorough job briefing before starting work. All hazards identified and controls discussed." className={textareaClass} />
          </Field>

          <Field label="At-Risk Behaviors Observed" hint={isAtRisk ? 'Especially helpful for At-Risk or Near Miss entries.' : 'Describe any unsafe behaviors observed.'}>
            <textarea name="at_risk_behaviors_observed" value={form.at_risk_behaviors_observed} onChange={handleChange} rows={3} maxLength={500} placeholder="e.g. Lineman observed not wearing safety glasses during overhead connector installation." className={textareaClass} />
          </Field>

          {isAtRisk && (
            <Field label="Root Cause(s) of At-Risk Behavior" hint="Select all that apply.">
              <div className="flex flex-wrap gap-2">
                {ROOT_CAUSES.map(cause => (
                  <button
                    key={cause}
                    type="button"
                    onClick={() => handleRootCauseToggle(cause)}
                    className={`px-3.5 py-2 rounded-full border text-sm transition-colors ${
                      form.root_causes.includes(cause)
                        ? 'bg-brand-navy text-white border-brand-navy'
                        : 'border-hairline bg-white text-gray-600 hover:border-brand-cyan'
                    }`}
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}

      {/* ── Step 5: Follow-Up ──────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-5">
          <Field label="Immediate Corrective Action Taken" hint="What did you do on the spot?">
            <textarea name="immediate_corrective_action" value={form.immediate_corrective_action} onChange={handleChange} rows={2} maxLength={300} placeholder="e.g. Stopped work, re-briefed crew, confirmed compliance before resuming." className={textareaClass} />
          </Field>

          <Field label="Follow-Up Required?">
            <RadioGroup name="follow_up_required" value={form.follow_up_required} onChange={handleChange} options={YES_NO} />
          </Field>

          {needsFollowUp && (
            <div className="grid grid-cols-1 gap-5 pl-4 border-l-2 border-brand-cyan">
              <Field label="Follow-Up Owner">
                <input type="text" name="follow_up_owner" value={form.follow_up_owner} onChange={handleChange} placeholder="Name or role" className={inputClass} />
              </Field>
              <Field label="Follow-Up Due Date">
                <input type="date" name="follow_up_due_date" value={form.follow_up_due_date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={inputClass} />
              </Field>
            </div>
          )}

          <Field label="Worker Acknowledged Observation">
            <RadioGroup name="worker_acknowledged" value={form.worker_acknowledged} onChange={handleChange} options={WORKER_ACK} />
          </Field>

          <Field label="Supervisor Notes" hint="Any additional context not captured above.">
            <textarea name="supervisor_notes" value={form.supervisor_notes} onChange={handleChange} rows={2} maxLength={300} placeholder="Optional notes…" className={textareaClass} />
          </Field>
        </div>
      )}

      {/* ── Sticky bottom action bar ───────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-hairline px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center justify-center gap-1 px-5 py-3.5 rounded-xl border border-hairline text-gray-700 font-semibold hover:border-brand-navy transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="flex-1 flex items-center justify-center gap-1 px-5 py-3.5 bg-brand-navy text-white font-bold rounded-xl hover:bg-brand-cyan hover:text-brand-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLastStep
              ? (status === 'submitting' ? 'Submitting…' : 'Submit Observation')
              : <>Continue <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </form>
  );
}
