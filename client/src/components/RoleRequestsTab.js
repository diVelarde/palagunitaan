import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_CRITERIA } from '../utils/roleCriteria';

export default function RoleRequestsTab({ fetchPending = async () => [], reviewRequest = async () => {} }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [error, setError] = useState(null);
  const [denialReasons, setDenialReasons] = useState({});

  useEffect(() => {
    let active = true;
    fetchPending()
      .then((data) => { if (active) setRequests(data || []); })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load role upgrade requests.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchPending]);

  async function handleDecision(id, decision) {
    setError(null);
    setDecidingId(id);
    try {
      if (decision === 'denied') {
        await reviewRequest(id, decision, (denialReasons[id] || '').trim());
      } else {
        await reviewRequest(id, decision);
      }
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
      {error && <p className="text-sm text-primary-600 mb-3">{error}</p>}
      <p className="text-sm text-muted mb-4">
        {error ? 'The request queue could not be loaded.' : requests.length === 0 ? 'Nothing waiting on you right now.' : `${requests.length} pending.`}
      </p>

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="border border-parchment-300 rounded-lg p-4">
            <div>
              <p className="text-sm text-ink">
                <strong>{req.user_name}</strong> ({req.user_email}) wants to become a{' '}
                <span className="capitalize font-medium">{req.requested_role}</span>
                <span className="text-muted"> — currently {req.applicant_role}</span>
              </p>
              <p className="text-sm text-ink mt-2">
                <strong>Qualifications:</strong> {req.qualifications || 'Not provided.'}
              </p>
              <p className="text-sm text-ink mt-1">
                <strong>Message:</strong> {req.message || 'Not provided.'}
              </p>
              {ROLE_CRITERIA[req.requested_role] && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-ink">{ROLE_CRITERIA[req.requested_role].label} approval checklist</h5>
                  <ul className="mt-1 space-y-1">
                    {ROLE_CRITERIA[req.requested_role].items.map((item) => (
                      <li key={item}>
                        <label className="flex items-start gap-2 text-sm text-ink">
                          <input type="checkbox" className="mt-1 accent-[#ad482d]" />
                          <span>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {Number(req.user_id) === Number(user?.id) ? (
              <p className="mt-3 text-sm text-muted">Another administrator must decide your request.</p>
            ) : (
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-[16rem] flex-1">
                  <label className="block text-sm font-medium text-ink mb-1" htmlFor={`denial-reason-${req.id}`}>
                    Reason for denial
                  </label>
                  <textarea
                    id={`denial-reason-${req.id}`}
                    value={denialReasons[req.id] || ''}
                    onChange={(e) => setDenialReasons((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    rows={2}
                    className="w-full border border-parchment-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Explain why this request is not approved."
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleDecision(req.id, 'approved')} disabled={decidingId === req.id} className="px-3 py-1.5 bg-forest-700 text-parchment text-sm rounded-md hover:bg-forest-800 disabled:opacity-50">Approve</button>
                  <button onClick={() => handleDecision(req.id, 'denied')} disabled={decidingId === req.id || !(denialReasons[req.id] || '').trim()} className="px-3 py-1.5 border border-parchment-300 text-ink text-sm rounded-md hover:bg-parchment-200 disabled:opacity-50">Deny</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}