import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StatusPage.css';

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };

export default function ProtectedRoute({ minRole = 'contributor' }) {
  const { user, viewRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="status-page"><p className="status-description">Loading your workspace…</p></div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, reason: 'sign-in-required' }} replace />;
  }

  const effectiveRole = viewRole || user.role;
  if (ROLE_LEVEL[effectiveRole] < ROLE_LEVEL[minRole]) {
    return (
      <div className="status-page">
        <p className="status-eyebrow">Workspace access</p>
        <h1>Access restricted</h1>
        <p className="status-description">
          This page requires the <strong>{minRole}</strong> role or higher.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
