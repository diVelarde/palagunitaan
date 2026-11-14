import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function reportTargetLink(report) {
  if (report.target_type === 'entry') return `/entries/${report.target_id}`;
  return `/blog/${report.target_id}`;
}

export default function ContentReportsQueue({
  fetchReports = async () => [],
  closeReport = async () => {},
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closingId, setClosingId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchReports()
      .then((data) => { if (active) setReports(data || []); })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load open reports.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchReports]);

  async function handleClose(id) {
    setClosingId(id);
    setError('');
    try {
      await closeReport(id);
      setReports((current) => current.filter((report) => report.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close this report.');
    } finally {
      setClosingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading open reports…</p>;

  return (
    <section aria-label="Open content reports">
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {!error && reports.length === 0 && <p className="text-sm text-gray-500">No open reports.</p>}
      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className="rounded-lg border border-[#e1d7ca] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {report.target_type === 'entry' ? 'Heritage entry' : 'Blog post'} · Reported by {report.reporter_name}
                </p>
                <Link to={reportTargetLink(report)} className="mt-1 inline-block font-semibold text-[#493126] hover:underline">
                  {report.target_title || `${report.target_type} #${report.target_id}`}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => handleClose(report.id)}
                disabled={closingId === report.id}
                className="rounded-md border border-[#e1d7ca] px-3 py-1.5 text-sm text-[#493126] hover:bg-[#f4eee6] disabled:opacity-50"
              >
                {closingId === report.id ? 'Closing…' : 'Close'}
              </button>
            </div>
            <p className="mt-2 text-sm text-[#493126]"><strong>Reason:</strong> {report.reason}</p>
            {report.message && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{report.message}</p>}
            <time className="mt-2 block text-xs text-gray-500">
              {report.created_at ? new Date(report.created_at).toLocaleString() : ''}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
