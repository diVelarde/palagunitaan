import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };

export default function ProtectedRoute({ minRole = 'contributor' }) {
  const { user, viewRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, reason: 'sign-in-required' }} replace />;
  }

  const effectiveRole = viewRole || user.role;
  if (ROLE_LEVEL[effectiveRole] < ROLE_LEVEL[minRole]) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access restricted</h2>
        <p className="text-gray-500">
          This page requires the <strong>{minRole}</strong> role or higher.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
