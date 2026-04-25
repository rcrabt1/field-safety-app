import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="text-5xl mb-4">⚡</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Field Safety Observation Tool</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          A working recreation of a native iOS/Android app I shipped for a US utility company,
          rebuilt as a responsive web app with a live reporting dashboard.
        </p>
      </div>

      {/* Two entry-point cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        <Link to="/observe" className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-blue transition-all p-7">
          <div className="text-3xl mb-3">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors">Submit an Observation</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Experience the field supervisor view. Fill out a safety observation form exactly as a linework supervisor would in the field.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-brand-blue-mid group-hover:translate-x-1 transition-transform">
            Open form →
          </span>
        </Link>

        <Link to="/dashboard" className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-blue transition-all p-7">
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors">View the Dashboard</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            The safety manager view — real-time aggregated reporting across crews, replacing the original Power BI layer.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-brand-blue-mid group-hover:translate-x-1 transition-transform">
            Open dashboard →
          </span>
        </Link>
      </div>

      {/* PM backstory */}
      <div className="bg-brand-blue-lt border border-brand-blue-lt rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-brand-blue mb-4">About This Project</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-700 leading-relaxed">
          <div>
            <p className="font-semibold text-gray-900 mb-1">The Original Product</p>
            <p>A native iOS/Android app used by field supervisors at a US utility company to document safety observations of overhead and underground power line crews in real time.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">What I Did</p>
            <p>Led product discovery, defined the data model across 30+ fields, designed the mobile UX for gloved-hand field use, and defined the Power BI reporting layer for safety managers.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">This Recreation</p>
            <p>Rebuilt as a responsive React web app with Supabase backend and Recharts dashboard. All data shown is synthetic — no real crew names, sites, or client information.</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Built by Ryan Crabtree · Director of Product Management ·{' '}
          <a href="https://ryancrabtree.me" className="underline hover:text-brand-blue">ryancrabtree.me</a>
        </p>
      </div>
    </div>
  );
}
