import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ACTION_STYLES = {
  approved: 'bg-green-100 text-green-800',
  disputed: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  commented: 'bg-gray-100 text-gray-700',
};

export default function AuditLogPage({ fetchAuditLog = async () => [] }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAuditLog()
      .then((data) => { if (active) setEntries(data || []); })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load the audit log.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchAuditLog]);

  return (
    <div className="dashboard-admin-audit-log">
      <p className="dashboard-page-eyebrow">Editorial record</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Audit log</h1>
      <p className="text-sm text-gray-600 mb-8">Every editorial decision, across every entry.</p>

      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && entries.length === 0 && <p className="text-sm text-gray-500">No editorial actions recorded yet.</p>}

      <div className="space-y-3">
        {entries.map((action) => (
          <div key={action.id} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ACTION_STYLES[action.action_type] || ACTION_STYLES.commented}`}>
                  {action.action_type}
                </span>
                <Link to={`/entries/${action.heritage_entry_id}`} className="text-sm text-gray-900 hover:underline">{action.entry_title}</Link>
              </div>
              <p className="text-xs text-gray-500">
                by {action.validator_name}{action.comment && <span> — "{action.comment}"</span>}
              </p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{new Date(action.action_date).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}