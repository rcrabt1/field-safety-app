import { NavLink, useLocation } from 'react-router-dom';
import { Zap, HardHat, LayoutDashboard } from 'lucide-react';

const PERSONAS = [
  { path: '/observe', label: 'Field Supervisor', icon: HardHat },
  { path: '/dashboard', label: 'Safety Manager', icon: LayoutDashboard },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isSupervisor = pathname.startsWith('/observe');

  return (
    <nav className="bg-brand-navy shadow-md">
      <div className={`mx-auto px-4 sm:px-6 ${isSupervisor ? 'max-w-2xl' : 'max-w-6xl'}`}>
        <div className={`flex items-center justify-between ${isSupervisor ? 'h-14' : 'h-16'}`}>
          <NavLink to="/" className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-brand-cyan" strokeWidth={2.5} fill="currentColor" />
            <span className="font-bold text-sm tracking-tight leading-tight">
              Field Safety
              <span className="block text-[10px] font-medium text-blue-200/80 tracking-wide uppercase -mt-0.5">
                Observation Tool
              </span>
            </span>
          </NavLink>

          {!isHome && (
            <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
              {PERSONAS.map(p => {
                const active = pathname.startsWith(p.path);
                const Icon = p.icon;
                return (
                  <NavLink
                    key={p.path}
                    to={p.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      active ? 'bg-brand-green text-white' : 'text-blue-100 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                    <span className="hidden sm:inline">{p.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
