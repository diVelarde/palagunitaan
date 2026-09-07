import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function BecomeContributorPrompt() {
  const { user, refresh } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user || user.role !== 'public' || dismissed) return null;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/become-contributor');
      await refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md">
      <p className="text-sm text-blue-900">
        Know a story that belongs here? <span className="font-medium">Become a contributor</span> to submit it.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Upgrading…' : 'Become a contributor'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-sm text-blue-700 hover:text-blue-900" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
