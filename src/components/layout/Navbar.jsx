import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white text-brand-blue'
        : 'text-blue-100 hover:text-white hover:bg-brand-blue-mid'
    }`;

  return (
    <nav className="bg-brand-blue shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / brand */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-white font-semibold text-base leading-tight">
              ⚡ Field Safety<br />
              <span className="text-blue-200 font-normal text-xs">Observation Tool</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavLink to="/observe"   className={linkClass}>Submit Observation</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
