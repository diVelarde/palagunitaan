import { useAuth } from '../context/AuthContext';

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };
const ALL_ROLES = ['public', 'contributor', 'validator', 'admin'];

export default function RoleSwitcher() {
  const { user, viewRole, setViewRole } = useAuth();

  if (!user) return null;

  const availableRoles = ALL_ROLES.filter((r) => ROLE_LEVEL[r] <= ROLE_LEVEL[user.role]);
  if (availableRoles.length <= 1) return null;

  return (
    <select
      value={viewRole || user.role}
      onChange={(e) => setViewRole(e.target.value)}
      className="border border-gray-300 rounded-md text-sm px-2 py-1"
    >
      {availableRoles.map((r) => (
        <option key={r} value={r}>
          View as {r}
        </option>
      ))}
    </select>
  );
}
