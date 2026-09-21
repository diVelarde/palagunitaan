import { useEffect, useState } from 'react';

export default function RoleRequestsTab({ fetchPending = async () => [], reviewRequest = async () => {} }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPending().then((data) => { setRequests(data || []); setLoading(false); });
  }, [fetchPending]);

  async function handleDecision(id, decision) {
    setError(null);
    setDecidingId(id);
    try {
      await reviewRequest(id, decision);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process this request.');
    } finally {
      setDecidingId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading requests…</p>;

  return (
    <div>
      <h4 className="font-display text-lg text-ink mb-1">Role upgrade requests</h4>
      <p className="text-sm text-muted mb-4">{requests.length === 0 ? 'Nothing waiting on you right now.' : `${requests.length} pending.`}</p>

      {error && <p className="text-sm text-primary-600 mb-3">{error}</p>}

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-4 border border-parchment-300 rounded-lg p-4">
            <div>
              <p className="text-sm text-ink">
                <strong>{req.user_name}</strong> ({req.user_email}) wants to become a{' '}
                <span className="capitalize font-medium">{req.requested_role}</span>
                <span className="text-muted"> — currently {req.current_role}</span>
              </p>
              {req.message && <p className="text-xs text-muted mt-1 italic">"{req.message}"</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleDecision(req.id, 'approved')} disabled={decidingId === req.id} className="px-3 py-1.5 bg-forest-700 text-parchment text-sm rounded-md hover:bg-forest-800 disabled:opacity-50">Approve</button>
              <button onClick={() => handleDecision(req.id, 'denied')} disabled={decidingId === req.id} className="px-3 py-1.5 border border-parchment-300 text-ink text-sm rounded-md hover:bg-parchment-200 disabled:opacity-50">Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}