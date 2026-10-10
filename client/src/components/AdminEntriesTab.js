import { useEffect, useState } from 'react';

const PAGE_SIZE = 50;

export default function AdminEntriesTab({ fetchEntries, deleteEntry, setEducationalAiExcluded }) {
  const [entries, setEntries] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingAiExclusionId, setUpdatingAiExclusionId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchEntries({ limit: PAGE_SIZE, offset })
      .then((items) => { if (active) setEntries(items || []); })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load heritage entries.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchEntries, offset]);

  async function handleDelete(entry) {
    setError('');
    setDeletingId(entry.id);
    try {
      await deleteEntry(entry.id);
      const remaining = entries.filter((item) => item.id !== entry.id);
      if (remaining.length === 0 && offset > 0) {
        setOffset((current) => Math.max(0, current - PAGE_SIZE));
      } else {
        setEntries(remaining);
      }
      setConfirmingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this entry.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAiExclusionChange(entry, excluded) {
    setError('');
    setUpdatingAiExclusionId(entry.id);
    try {
      const updated = await setEducationalAiExcluded(entry.id, excluded);
      setEntries((current) => current.map((item) => (
        item.id === entry.id ? { ...item, ...updated } : item
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the educational AI exclusion.');
    } finally {
      setUpdatingAiExclusionId(null);
    }
  }

  return (
    <section className="dashboard-admin-panel">
      <h2>Manage Heritage Entries</h2>
      <p>Delete entries that should no longer be part of the archive. This permanently removes the entry and its associated records.</p>
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading entries…</p> : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries on this page.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[850px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Educational AI</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      {entry.cover_image_url && (
                        <img src={entry.cover_image_url} alt="" className="h-12 w-12 rounded object-cover" />
                      )}
                      <span>
                        <strong className="block">{entry.title}</strong>
                        {entry.category_auto && <small className="text-gray-500">{entry.category_auto}</small>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 capitalize">{entry.status}</td>
                  <td className="py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.ai_educational_excluded)}
                        disabled={updatingAiExclusionId === entry.id}
                        onChange={(event) => handleAiExclusionChange(entry, event.target.checked)}
                      />
                      <span>Bypass AI rewrite</span>
                    </label>
                  </td>
                  <td className="py-3">{entry.submitted_at ? new Date(entry.submitted_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    {confirmingId === entry.id ? (
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="dashboard-admin-delete"
                        >
                          {deletingId === entry.id ? 'Deleting…' : 'Confirm delete'}
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)} disabled={deletingId === entry.id}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmingId(entry.id)} className="dashboard-admin-delete">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))} disabled={loading || offset === 0}>
          Previous
        </button>
        <span className="text-sm text-gray-500">Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
        <button type="button" onClick={() => setOffset((current) => current + PAGE_SIZE)} disabled={loading || entries.length < PAGE_SIZE}>
          Next
        </button>
      </div>
    </section>
  );
}
