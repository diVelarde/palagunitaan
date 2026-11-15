const ROLE_LABELS = {
  public: 'Public',
  contributor: 'Contributor',
  validator: 'Validator',
  admin: 'Administrator',
};

const ROLE_COLORS = {
  public: 'bg-paper text-muted',
  contributor: 'bg-accent text-paper',
  validator: 'bg-ink text-paper',
  admin: 'bg-surface text-accent',
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
