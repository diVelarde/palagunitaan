import RoleBadge from '../components/RoleBadge'; 
import { useAuth } from '../context/AuthContext';

export default function ProfilePanel() {
  const { user } = useAuth();
  if (!user) return null;

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="border border-gray-200 rounded-lg p-6 flex items-center gap-5">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-500">
          {user.name?.[0]?.toUpperCase()}
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <RoleBadge role={user.role} />
        </div>
        <p className="text-sm text-gray-500">{user.email}</p>
        {joined && <p className="text-xs text-gray-400 mt-1">Member since {joined}</p>}
      </div>
    </div>
  );
}