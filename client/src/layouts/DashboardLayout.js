import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const ROLE_WORKSPACES = {
  public: [
    { to: '/dashboard', label: 'Overview', end: true },
  ],
  contributor: [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/dashboard/submissions', label: 'My Submissions' },
    { to: '/dashboard/submit', label: 'Submit an Entry' },
  ],
  validator: [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/validate', label: 'Validation Queue' },
    { to: '/dashboard/submissions', label: 'My Submissions' },
    { to: '/dashboard/submit', label: 'Submit an Entry' },
  ],
  admin: [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/admin', label: 'Admin' },
    { to: '/dashboard/submissions', label: 'My Submissions' },
    { to: '/dashboard/submit', label: 'Submit an Entry' },
  ],
};

function linkClass({ isActive }) {
  return `dashboard-nav-link ${
    isActive ? 'dashboard-nav-link-active' : ''
  }`;
}

export default function DashboardLayout() {
  const { user, viewRole } = useAuth();
  const effectiveRole = viewRole || user?.role || 'public';
  const links = ROLE_WORKSPACES[effectiveRole] || ROLE_WORKSPACES.public;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-heading">
          <img
            src="/Palagunitaan - Logo/3.png"
            alt=""
            aria-hidden="true"
            className="dashboard-brand-mark"
          />
          <div>
            <p>PALAGUNITAAN</p>
            <span>Heritage workspace</span>
          </div>
        </div>
        <p className="dashboard-nav-label">YOUR WORKSPACE</p>
        <nav className="dashboard-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              <span className="dashboard-nav-indicator" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar-note">
          <span>Stories worth keeping.</span>
          <p>Document and share the living heritage of Bicol.</p>
        </div>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
