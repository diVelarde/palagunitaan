import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };

const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Overview', minRole: 'public', end: true },
  { to: '/dashboard/submissions', label: 'My Submissions', minRole: 'contributor' },
  { to: '/validate', label: 'Validation Queue', minRole: 'validator' },
  { to: '/admin', label: 'Admin', minRole: 'admin' },
];

function linkClass({ isActive }) {
  return `block px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-600 hover:bg-gray-50'
  }`;
}

export default function DashboardLayout() {
  const { user, viewRole } = useAuth();
  const effectiveRole = viewRole || user?.role || 'public';

  const links = SIDEBAR_LINKS.filter((l) => ROLE_LEVEL[effectiveRole] >= ROLE_LEVEL[l.minRole]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
      <aside>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
