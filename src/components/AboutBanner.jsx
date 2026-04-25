import { useState } from 'react';

/**
 * AboutBanner — shown on both the Form and Dashboard pages.
 * Gives portfolio reviewers context without cluttering the core UI.
 * Dismissible per session (state only, no localStorage).
 */
export default function AboutBanner({ page = 'form' }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const isForm = page === 'form';

  return (
    <div className="bg-brand-blue-lt border-l-4 border-brand-blue-mid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="text-brand-blue-mid text-xl mt-0.5 flex-shrink-0">ℹ️</span>

            <div>
              <p className="text-sm font-semibold text-brand-blue">
                Portfolio Demo — {isForm ? 'Field Supervisor View' : 'Safety Manager View'}
              </p>
              <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                {isForm
                  ? <>
                      This is a working recreation of a <strong>native iOS/Android app</strong> I shipped for a US utility company.
                      Field supervisors used it to submit safety observations of overhead and underground line crews in the field.
                      Submissions feed into the <a href="/dashboard" className="text-brand-blue-mid underline font-medium">live dashboard →</a>
                    </>
                  : <>
                      This dashboard replaces the <strong>Power BI reporting</strong> layer from the original product.
                      It aggregates all observation submissions in real time.
                      Data shown is fully <strong>synthetic</strong> — no real crew names, sites, or client data.
                      Try submitting a form to see your data appear here.{' '}
                      <a href="/observe" className="text-brand-blue-mid underline font-medium">Submit an observation →</a>
                    </>
                }
              </p>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
