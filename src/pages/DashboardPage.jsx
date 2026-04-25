import AboutBanner from '../components/AboutBanner';
import Dashboard from '../components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <>
      <AboutBanner page="dashboard" />
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Safety Observations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Aggregated reporting across all field observation submissions. Filters apply globally to all charts below.
          </p>
        </div>
        <Dashboard />
      </div>
    </>
  );
}
