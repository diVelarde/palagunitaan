import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const VERIFICATION_STYLES = {
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-amber-100 text-amber-800',
  unverified: 'bg-gray-100 text-gray-700',
};

function VerificationBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${VERIFICATION_STYLES[status] || VERIFICATION_STYLES.unverified}`}>
      {status || 'unverified'}
    </span>
  );
}

export default function EntryDetailPage({ fetchEntry = async () => null }) {
  const { id } = useParams();
  const [entry, setEntry] = useState(undefined); // undefined = loading, null = not found
  const [view, setView] = useState('plain'); // 'plain' | 'raw'

  useEffect(() => {
    let active = true;
    setEntry(undefined);
    fetchEntry(id).then((data) => { if (active) setEntry(data); });
    return () => { active = false; };
  }, [id, fetchEntry]);

  if (entry === undefined) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-gray-500">Loading…</div>;
  }

  if (entry === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-600 mb-4">This entry doesn't exist, or hasn't been published yet.</p>
        <Link to="/browse" className="text-blue-800 text-sm hover:underline">Back to the archive</Link>
      </div>
    );
  }

  const hasBothVersions = Boolean(entry.euphemistic_content) && entry.euphemistic_content !== entry.raw_content;
  const bodyText = view === 'plain' && entry.euphemistic_content ? entry.euphemistic_content : entry.raw_content;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-4">
        <VerificationBadge status={entry.verification_status} />
        {entry.category_auto && <span className="text-xs text-gray-500 uppercase tracking-wide">{entry.category_auto}</span>}
      </div>

      <h1 className="text-3xl font-semibold text-gray-900 mb-4">{entry.title}</h1>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-8">
        {entry.historical_period && (
          <div><dt className="inline font-medium text-gray-700">Period: </dt><dd className="inline">{entry.historical_period}</dd></div>
        )}
        {entry.source_type && (
          <div><dt className="inline font-medium text-gray-700">Source: </dt><dd className="inline">{entry.source_type}</dd></div>
        )}
      </dl>

      {hasBothVersions && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => setView('plain')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'plain' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Plain-language version
          </button>
          <button onClick={() => setView('raw')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'raw' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
            As submitted
          </button>
        </div>
      )}

      <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
        {bodyText}
      </div>

      {entry.source_description && (
        <p className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Source notes: </span>{entry.source_description}
        </p>
      )}
    </article>
  );
}
