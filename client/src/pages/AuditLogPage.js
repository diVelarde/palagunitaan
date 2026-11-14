import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reviewService from '../services/reviewService';

const ACTION_STYLES = {
  approved: 'bg-green-100 text-green-800',
  approved_unverified: 'bg-green-100 text-green-800',
  disputed: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  commented: 'bg-gray-100 text-gray-700',
};

const ASSESSMENT_FIELDS = [
  ['source_type_fit', 'Source type'],
  ['source_credibility', 'Source credibility'],
  ['corroboration', 'Corroboration'],
  ['claimed_year_supported', 'Claimed year'],
];

function formatAssessmentValue(value) {
  if (value === 'not_met') return 'Not met';
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function ReviewAssessments({ action, fetchEntryHistory }) {
  const [expanded, setExpanded] = useState(false);
  const [assessments, setAssessments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggleAssessments() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (assessments !== null) return;

    setLoading(true);
    setError('');
    try {
      const history = await fetchEntryHistory(action.heritage_entry_id);
      setAssessments((history.assessments || []).filter(
        (assessment) => Number(assessment.editorial_action_id) === Number(action.id)
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load claim assessments.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggleAssessments}
        aria-expanded={expanded}
        className="text-xs font-semibold text-[#ad482d] hover:underline"
      >
        {expanded ? 'Hide claim assessments' : 'Show claim assessments'}
      </button>
      {expanded && (
        <div className="mt-2 border-l-2 border-[#ad482d] bg-[#f4eee6] p-3">
          {loading && <p className="text-xs text-gray-500">Loading assessments…</p>}
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          {!loading && !error && assessments?.length === 0 && (
            <p className="text-xs text-gray-600">No claim assessments were recorded for this decision.</p>
          )}
          {!loading && !error && assessments?.map((assessment) => (
            <article key={assessment.id} className="mb-3 last:mb-0">
              <h3 className="text-xs font-semibold text-gray-900">
                Claimed origin year: {assessment.claimed_year}
              </h3>
              {assessment.source_description && (
                <p className="mt-1 text-xs text-gray-600">{assessment.source_description}</p>
              )}
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {ASSESSMENT_FIELDS.map(([field, label]) => (
                  <div key={field} className="contents">
                    <dt className="text-gray-600">{label}</dt>
                    <dd className="m-0 font-medium text-gray-800">
                      {formatAssessmentValue(assessment[field])}
                    </dd>
                  </div>
                ))}
              </dl>
              {assessment.notes && (
                <p className="mt-2 text-xs text-gray-700">
                  <strong>Notes:</strong> {assessment.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage({
  fetchAuditLog = async () => [],
  fetchEntryHistory = reviewService.getEntryHistory,
}) {
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
          <div key={action.id} className="py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ACTION_STYLES[action.action_type] || ACTION_STYLES.commented}`}>
                    {action.action_type === 'approved_unverified' ? 'Approved as Unverified' : action.action_type}
                  </span>
                  {action.blog_post_id ? (
                    <Link to={`/blog/${action.blog_post_id}`} className="text-sm text-gray-900 hover:underline">
                      Blog post: {action.blog_post_title}
                    </Link>
                  ) : (
                    <Link to={`/entries/${action.heritage_entry_id}`} className="text-sm text-gray-900 hover:underline">
                      {action.entry_title}
                    </Link>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  by {action.validator_name}{action.comment && <span> — "{action.comment}"</span>}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{new Date(action.action_date).toLocaleString()}</span>
            </div>
            {action.heritage_entry_id && (
              <ReviewAssessments action={action} fetchEntryHistory={fetchEntryHistory} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}