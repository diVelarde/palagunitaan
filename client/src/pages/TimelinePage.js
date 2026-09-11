import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const VERIFICATION_STYLES = {
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-amber-100 text-amber-800',
  unverified: 'bg-gray-100 text-gray-700',
};

function TimelineEntry({ entry }) {
  return (
    <Link to={`/entries/${entry.id}`} className="block py-3 px-4 border-l-2 border-gray-200 hover:border-blue-800 hover:bg-gray-50 transition-colors -ml-px">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${VERIFICATION_STYLES[entry.verification_status] || VERIFICATION_STYLES.unverified}`}>
          {entry.verification_status || 'unverified'}
        </span>
        {entry.category_auto && <span className="text-xs text-gray-500 uppercase tracking-wide">{entry.category_auto}</span>}
      </div>
      <p className="text-sm font-medium text-gray-900">{entry.title}</p>
    </Link>
  );
}

function PeriodSection({ period, entries }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-display font-semibold text-gray-900">{period}</h2>
        <span className="text-xs text-gray-400">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry) => <TimelineEntry key={entry.id} entry={entry} />)}
      </div>
    </section>
  );
}

export default function TimelinePage({ fetchTimeline = async () => [] }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchTimeline().then((data) => {
      if (active) { setTimeline(data || []); setLoading(false); }
    });
    return () => { active = false; };
  }, [fetchTimeline]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Timeline</h1>
      <p className="text-sm text-gray-600 mb-8">Entries by historical period, earliest first.</p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && timeline.length === 0 && <p className="text-sm text-gray-500">No entries have a historical period set yet.</p>}
      {!loading && timeline.map((group) => <PeriodSection key={group.period} period={group.period} entries={group.entries} />)}
    </div>
  );
}
