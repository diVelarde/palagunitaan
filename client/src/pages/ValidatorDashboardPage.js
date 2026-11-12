import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CLAIM_ASSESSMENT_FIELDS = [
  { field: 'sourceTypeFit', label: 'Source type', helper: 'Is this kind of source suitable for this claim?' },
  { field: 'sourceCredibility', label: 'Source credibility', helper: 'Is the author or recorder reliable on the topic?' },
  { field: 'corroboration', label: 'Corroboration', helper: 'Do other independent sources agree?' },
  { field: 'claimedYearSupported', label: 'Claimed year', helper: 'Does the source actually support this year?' },
];
const ASSESSMENT_OPTIONS = ['met', 'partly', 'not_met'];

function PendingEntryRow({ entry, onReview }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const historyClaims = entry.history_claims || [];
  const [assessments, setAssessments] = useState(() => historyClaims.map((claim) => ({
    historyClaimId: claim.id,
    sourceTypeFit: '',
    sourceCredibility: '',
    corroboration: '',
    claimedYearSupported: '',
    notes: '',
  })));
  const assessmentsComplete = !historyClaims.length || assessments.length === historyClaims.length
    && assessments.every((assessment) => (
      assessment.sourceTypeFit
      && assessment.sourceCredibility
      && assessment.corroboration
      && assessment.claimedYearSupported
    ));
  const suggestVerified = historyClaims.length > 0
    && assessments.every((assessment) => assessment.corroboration === 'met');

  function updateAssessment(historyClaimId, field, value) {
    setAssessments((current) => current.map((assessment) => (
      String(assessment.historyClaimId) === String(historyClaimId)
        ? { ...assessment, [field]: value }
        : assessment
    )));
  }

  async function handleDecision(decision) {
    if (decision === 'disputed' && !comment.trim()) {
      setError('A comment is required when disputing an entry.');
      setExpanded(true);
      return;
    }
    setError(null);
    setSubmitting(decision);
    try {
      await onReview(entry.id, decision, comment, historyClaims.length ? assessments : undefined);
    } catch (err) {
      const selfReviewMessage = 'You cannot review your own submission.';
      const message = err.response?.status === 403
        && err.response?.data?.message === selfReviewMessage
        ? selfReviewMessage
        : err.response?.data?.message || 'Could not submit this review.';
      setError(message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="dashboard-submission-card">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <Link to={`/entries/${entry.id}`} className="font-medium text-gray-900 hover:underline">{entry.title}</Link>
          {entry.category_auto && <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{entry.category_auto}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">Submitted {new Date(entry.submitted_at).toLocaleDateString()}</span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{entry.raw_content}</p>

      {historyClaims.map((claim) => {
        const assessment = assessments.find(
          (item) => String(item.historyClaimId) === String(claim.id)
        );
        if (!assessment) return null;

        return (
          <section key={claim.id} className="mb-4 rounded-md border border-gray-200 bg-[#f4eee6] p-4">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
              Claimed origin year: {claim.claimed_year}
            </h3>
            <p className="mb-4 text-xs text-gray-600">
              {claim.source_description || 'No source description supplied.'}
            </p>
            {CLAIM_ASSESSMENT_FIELDS.map(({ field, label, helper }) => (
              <fieldset
                key={field}
                aria-label={`${label} for claim ${claim.claimed_year}`}
                className="mb-3"
              >
                <legend className="mb-1 text-xs font-semibold text-gray-800">
                  {label}
                  <span className="ml-1 font-normal text-gray-600">{helper}</span>
                </legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {ASSESSMENT_OPTIONS.map((value) => (
                    <label key={value} className="inline-flex items-center gap-1 text-xs text-gray-700">
                      <input
                        type="radio"
                        name={`claim-${claim.id}-${field}`}
                        value={value}
                        checked={assessment[field] === value}
                        onChange={() => updateAssessment(claim.id, field, value)}
                        className="accent-[#ad482d]"
                      />
                      {value === 'not_met' ? 'Not met' : value.charAt(0).toUpperCase() + value.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block text-xs font-semibold text-gray-800">
              Optional notes
              <textarea
                value={assessment.notes}
                onChange={(event) => updateAssessment(claim.id, 'notes', event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal"
              />
            </label>
          </section>
        );
      })}

      {expanded && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Notes for the contributor (required if disputing)"
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
        />
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => handleDecision('approved')} disabled={submitting !== null || !assessmentsComplete} className="dashboard-review-approve disabled:opacity-50">
          {submitting === 'approved' ? 'Approving as Verified…' : 'Approve as Verified'}
          <span className="block text-[10px] font-normal">Source corroborated</span>
          {suggestVerified && <span className="block text-[10px] font-semibold">Suggested</span>}
        </button>
        <button onClick={() => handleDecision('approved_unverified')} disabled={submitting !== null || !assessmentsComplete} className="dashboard-review-approve disabled:opacity-50">
          {submitting === 'approved_unverified' ? 'Approving as Unverified…' : 'Approve as Unverified'}
          <span className="block text-[10px] font-normal">Publish with disclaimer</span>
        </button>
        <button onClick={() => (expanded ? handleDecision('disputed') : setExpanded(true))} disabled={submitting !== null} className="dashboard-review-dispute disabled:opacity-50">
          {submitting === 'disputed' ? 'Flagging…' : 'Dispute'}
        </button>
        <button onClick={() => handleDecision('rejected')} disabled={submitting !== null} className="dashboard-review-reject disabled:opacity-50">
          {submitting === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
        {!expanded && <button onClick={() => setExpanded(true)} className="text-xs text-gray-500 hover:text-gray-700 ml-2">+ add note</button>}
      </div>
    </div>
  );
}

export default function ValidatorDashboardPage({ fetchPending = async () => [], submitReview = async () => {} }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function reload() {
    setLoading(true);
    setError(null);
    return fetchPending()
      .then((data) => setEntries(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load the review queue.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPending]);

  async function handleReview(entryId, decision, comment, assessments) {
    await submitReview(entryId, decision, comment, assessments);
    setEntries((prev) => prev.filter((e) => e.id !== entryId)); // optimistic drop, no full re-fetch
  }

  return (
    <div className="dashboard-page dashboard-validator-page">
      <header className="dashboard-page-heading">
        <p className="dashboard-page-eyebrow">Editorial desk</p>
        <h1 className="mb-1 text-3xl font-semibold">Review Queue</h1>
        <p className="text-sm text-gray-600">Validators cannot review their own entries.</p>
        <p className="text-sm text-gray-600">
        {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} awaiting your review.`}
        </p>
      </header>
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      {!loading && entries.length === 0 && (
        <p className="text-sm text-gray-500">
          No submissions are waiting for you. Your own submissions are not listed here because someone else must review them.
        </p>
      )}
      <div className="space-y-4">
        {entries.map((entry) => <PendingEntryRow key={entry.id} entry={entry} onReview={handleReview} />)}
      </div>
    </div>
  );
}
