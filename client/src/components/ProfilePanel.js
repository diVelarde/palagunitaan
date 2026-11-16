import RoleBadge from './RoleBadge';
import { useAuth } from '../context/AuthContext';

export default function ProfilePanel({ showIdentity = true }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="profile-panel border border-gray-200 rounded-lg p-6 flex items-center gap-5">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="profile-panel-avatar h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="profile-panel-avatar profile-panel-avatar-fallback flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold">
          {user.name?.trim()?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="profile-panel-details">
        {showIdentity && (
          <div className="flex items-center gap-2 mb-1">
            <h2 className="profile-panel-name text-lg font-semibold">{user.name}</h2>
            <RoleBadge role={user.role} />
          </div>
        )}
        <p className="profile-panel-email text-sm">{user.email}</p>
        {joined && <p className="profile-panel-joined mt-1 text-xs">Member since {joined}</p>}
      </div>
      <button type="button" onClick={logout} className="dashboard-action-link profile-panel-logout">
        Log out
      </button>
    </div>
  );
}