import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './TimelinePage.css';

const VERIFICATION_STYLES = {
  verified: 'timeline-status-verified',
  disputed: 'timeline-status-disputed',
  unverified: 'timeline-status-unverified',
};

function TimelineEntry({ entry }) {
  return (
    <Link to={`/entries/${entry.id}`} className="timeline-entry">
      <div className="timeline-entry-meta">
        <span className={`timeline-status ${VERIFICATION_STYLES[entry.verification_status] || VERIFICATION_STYLES.unverified}`}>
          {entry.verification_status || 'unverified'}
        </span>
        {entry.category_auto && <span className="timeline-entry-category">{entry.category_auto}</span>}
      </div>
      <p className="timeline-entry-title">{entry.title}</p>
    </Link>
  );
}

function PeriodSection({ period, entries }) {
  return (
    <section className="timeline-period">
      <div className="timeline-period-heading">
        <h2>{period}</h2>
        <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="timeline-period-entries">
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
    <main className="site-page-surface timeline-page">
      <div className="timeline-page-content">
        <p className="timeline-page-eyebrow">The archive, in time</p>
        <h1>Timeline</h1>
        <p className="timeline-page-intro">Entries by historical period, earliest first.</p>

        {loading && <p className="timeline-page-state">Loading…</p>}
        {!loading && timeline.length === 0 && <p className="timeline-page-empty">No entries have a historical period set yet.</p>}
        {!loading && timeline.map((group) => <PeriodSection key={group.period} period={group.period} entries={group.entries} />)}
      </div>
    </main>
  );
}
