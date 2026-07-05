import { Link } from 'react-router-dom';
import { HardHat, LayoutDashboard, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-16 bg-surface">
      <div className="text-center mb-12 max-w-xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-3 tracking-tight">
          Field Safety Observation Tool
        </h1>
        <p className="text-base text-gray-500">
          One app, two completely different jobs. Pick the one you want to try.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link
          to="/observe"
          className="group relative overflow-hidden rounded-2xl bg-brand-navy text-white p-8 flex flex-col justify-between min-h-[220px] transition-transform hover:-translate-y-1"
        >
          <HardHat className="w-9 h-9 text-brand-cyan mb-4" strokeWidth={1.75} />
          <div>
            <h2 className="text-xl font-bold mb-1">Field Supervisor</h2>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Submit a safety observation from the field. Built for tough conditions, spotty internet, and quick completion.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-brand-cyan group-hover:gap-2 transition-all">
            Enter the field <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/dashboard"
          className="group relative overflow-hidden rounded-2xl border border-hairline bg-white p-8 flex flex-col justify-between min-h-[220px] transition-transform hover:-translate-y-1"
        >
          <LayoutDashboard className="w-9 h-9 text-brand-navy mb-4" strokeWidth={1.75} />
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Safety Manager</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Analyze safety performance across the enterprise and implement safer procedures.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-brand-navy group-hover:gap-2 transition-all">
            Open dashboard <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-10 text-center max-w-md">
        This is a portfolio demo. Every crew, site, and number you see here is made up.
      </p>
    </div>
  );
}
