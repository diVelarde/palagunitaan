import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import RoleSwitcher from './RoleSwitcher';
import NotificationDropdown from './NotificationDropdown';

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };

const NAV_LINKS = [
  { to: '/browse', label: 'Browse', minRole: 'public' },
  { to: '/map', label: 'Map', minRole: 'public' },
  { to: '/timeline', label: 'Timeline', minRole: 'public' },
  { to: '/blog', label: 'Community Blog', minRole: 'public' },
  { to: '/submit', label: 'Submit Entry', minRole: 'contributor' },
  { to: '/validate', label: 'Validation Queue', minRole: 'validator' },
  { to: '/admin', label: 'Admin', minRole: 'admin' },
];

function linkClass({ isActive }) {
  return `text-sm font-medium transition ${
    isActive ? 'text-blue-900' : 'text-gray-600 hover:text-gray-900'
  }`;
}

export default function Navbar() {
  const { user, viewRole, loading, login, logout } = useAuth();
  const effectiveRole = viewRole || 'public';

  const visibleLinks = NAV_LINKS.filter(
    (link) => ROLE_LEVEL[effectiveRole] >= ROLE_LEVEL[link.minRole]
  );

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-bold text-gray-900">
          Palagunitaan
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <NotificationDropdown />
              <RoleBadge role={viewRole} />
              <RoleSwitcher />
              <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {user.name}
              </Link>
              <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 rounded-md bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
