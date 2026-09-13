import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function PendingEntryRow({ entry, onReview }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function handleDecision(decision) {
    if (decision === 'disputed' && !comment.trim()) {
      setError('A comment is required when disputing an entry.');
      setExpanded(true);
      return;
    }
    setError(null);
    setSubmitting(decision);
    try {
      await onReview(entry.id, decision, comment);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit this review.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <Link to={`/entries/${entry.id}`} className="font-medium text-gray-900 hover:underline">{entry.title}</Link>
          {entry.category_auto && <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{entry.category_auto}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">Submitted {new Date(entry.submitted_at).toLocaleDateString()}</span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{entry.raw_content}</p>

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

      <div className="flex items-center gap-2">
        <button onClick={() => handleDecision('approved')} disabled={submitting !== null} className="px-3 py-1.5 bg-green-700 text-white text-sm rounded-md hover:bg-green-800 disabled:opacity-50">
          {submitting === 'approved' ? 'Approving…' : 'Approve'}
        </button>
        <button onClick={() => (expanded ? handleDecision('disputed') : setExpanded(true))} disabled={submitting !== null} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 disabled:opacity-50">
          {submitting === 'disputed' ? 'Flagging…' : 'Dispute'}
        </button>
        <button onClick={() => handleDecision('rejected')} disabled={submitting !== null} className="px-3 py-1.5 bg-red-700 text-white text-sm rounded-md hover:bg-red-800 disabled:opacity-50">
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

  function reload() {
    setLoading(true);
    return fetchPending().then((data) => { setEntries(data || []); setLoading(false); });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPending]);

  async function handleReview(entryId, decision, comment) {
    await submitReview(entryId, decision, comment);
    setEntries((prev) => prev.filter((e) => e.id !== entryId)); // optimistic drop, no full re-fetch
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Pending review</h1>
      <p className="text-sm text-gray-600 mb-8">
        {loading ? 'Loading…' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} awaiting your review.`}
      </p>
      {!loading && entries.length === 0 && <p className="text-sm text-gray-500">Nothing waiting on you right now.</p>}
      <div className="space-y-4">
        {entries.map((entry) => <PendingEntryRow key={entry.id} entry={entry} onReview={handleReview} />)}
      </div>
    </div>
  );
}
