const ROLE_LABELS = {
  public: 'Public',
  contributor: 'Contributor',
  validator: 'Validator',
  admin: 'Administrator',
};

const ROLE_COLORS = {
  public: 'bg-gray-100 text-gray-700',
  contributor: 'bg-green-100 text-green-700',
  validator: 'bg-blue-100 text-blue-700',
  admin: 'bg-amber-100 text-amber-700',
};

export default function RoleBadge({ role }) {
  if (!role) return null;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        ROLE_COLORS[role] || ROLE_COLORS.public
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
