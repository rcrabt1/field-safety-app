import Dashboard from '../components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <div className="bg-surface min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Safety Observations Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          I built this reporting layer for the company using Microsoft Power BI.
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Demo dashboard. All figures are simulated and don't represent a real company, crew, or incident.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
