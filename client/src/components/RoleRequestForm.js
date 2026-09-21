import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const REQUESTABLE_ROLES = {
  contributor: ['validator'],
  validator: ['admin'],
};

export default function RoleRequestForm({ createRequest = async () => ({}), existingRequest = null }) {
  const { user } = useAuth();
  const [requestedRole, setRequestedRole] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(existingRequest);
  const [error, setError] = useState(null);

  const availableRoles = REQUESTABLE_ROLES[user?.role] || [];
  if (!user || availableRoles.length === 0) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requestedRole) { setError("Choose which role you'd like to request."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const request = await createRequest(requestedRole, message);
      setResult(request);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit this request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.status === 'pending') {
    return (
      <div className="border border-gold/40 bg-gold/10 rounded-lg p-5 text-sm text-ink">
        Your request to become a <strong>{result.requested_role}</strong> is waiting on an administrator.
        You'll get a notification once it's reviewed.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-parchment-300 bg-white rounded-lg p-5 space-y-4">
      <h3 className="font-display text-lg text-ink">Request a role upgrade</h3>
      <p className="text-sm text-muted">Role changes beyond Contributor need an administrator's approval.</p>

      {error && <p className="text-xs text-primary-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-ink mb-1">I'd like to become a…</label>
        <select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value)} className="w-full border border-parchment-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Select a role</option>
          {availableRoles.map((role) => <option key={role} value={role} className="capitalize">{role}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          Why? <span className="text-muted font-normal">(optional, helps the admin decide)</span>
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full border border-parchment-300 rounded-md px-3 py-2 text-sm" />
      </div>

      <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-parchment rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
        {submitting ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}