import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useInView from '../hooks/useInView';
import './TimelinePage.css';

const VERIFICATION_STYLES = {
  verified: 'timeline-status-verified',
  disputed: 'timeline-status-disputed',
  unverified: 'timeline-status-unverified',
};

const VERIFICATION_LABELS = {
  verified: 'Verified',
  disputed: 'Disputed',
  unverified: 'Unverified',
};

const UNDATED_LABEL = 'Year not recorded';

function getEntryYear(entry) {
  const start = entry.claimed_year_start ?? entry.claimed_year;
  const end = entry.claimed_year_end;
  const hasStart = start !== undefined && start !== null && String(start).trim() !== '';
  const hasEnd = end !== undefined && end !== null && String(end).trim() !== '';
  if (hasStart && hasEnd && Number(start) !== Number(end)) return `${start}–${end}`;
  if (hasStart || hasEnd) return String(hasStart ? start : end);
  return UNDATED_LABEL;
}

function getEntryDescription(entry) {
  const description = entry.euphemistic_content || entry.description
    || 'Summary coming soon';
  return description.length > 180 ? `${description.slice(0, 180).trimEnd()}…` : description;
}

function getEntryRegion(entry) {
  return entry.region_province || entry.region_name;
}

function EntryArchiveMeta({ entry }) {
  const verificationStatus = VERIFICATION_STYLES[entry.verification_status]
    ? entry.verification_status
    : 'unverified';
  const region = getEntryRegion(entry);

  return (
    <div className="timeline-entry-meta">
      <span className={`timeline-status ${VERIFICATION_STYLES[verificationStatus]}`}>
        {VERIFICATION_LABELS[verificationStatus]}
      </span>
      {entry.category_auto && <span className="timeline-entry-category">{entry.category_auto}</span>}
      {region && <span className="timeline-entry-region">{region}</span>}
    </div>
  );
}

function TimelineEntry({ entry, side, dated = false }) {
  const [ref, isInView] = useInView();

  return (
    <li
      ref={ref}
      className={`timeline-item timeline-item-${side}${isInView ? ' timeline-item-visible' : ''}`}
    >
      <Link to={`/entries/${entry.id}`} className="timeline-entry-link">
        {dated && <span className="timeline-entry-year">{getEntryYear(entry)}</span>}
        <EntryArchiveMeta entry={entry} />
        <h3 className="timeline-entry-title">{entry.title}</h3>
        <p className="timeline-entry-description">{getEntryDescription(entry)}</p>
        {entry.cover_image_url && (
          <img className="timeline-entry-image sepia-photo" src={entry.cover_image_url} alt="" />
        )}
      </Link>
    </li>
  );
}

function PeriodSection({ period, entries }) {
  const datedEntries = entries.filter((entry) => getEntryYear(entry) !== UNDATED_LABEL);
  const undatedEntries = entries.filter((entry) => getEntryYear(entry) === UNDATED_LABEL);
  const undatedHeadingId = `undated-${period.replace(/\W+/g, '-').toLowerCase()}`;

  return (
    <section className="timeline-period">
      <div className="timeline-period-heading">
        <h2>{period}</h2>
        <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="timeline-period-track">
        <ol className="timeline-list" aria-label={`Dated entries in ${period}`}>
          {datedEntries.map((entry, index) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              side={index % 2 === 0 ? 'right' : 'left'}
              dated
            />
          ))}
        </ol>
        {undatedEntries.length > 0 && (
          <>
            <h3 id={undatedHeadingId} className="timeline-undated-label">Undated</h3>
            <ul className="timeline-undated-list" aria-label={`Undated entries in ${period}`}>
              {undatedEntries.map((entry, index) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  side={index % 2 === 0 ? 'right' : 'left'}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

export default function TimelinePage({ fetchTimeline = async () => [] }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const queryPeriod = searchParams.get('period') || '';
  const [periodFilter, setPeriodFilter] = useState(queryPeriod);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    setPeriodFilter(queryPeriod);
  }, [queryPeriod]);

  const availableCategories = useMemo(() => [...new Set(
    timeline.flatMap((group) => group.entries.map((entry) => entry.category_auto).filter(Boolean))
  )].sort(), [timeline]);
  const availableRegions = useMemo(() => [...new Set(
    timeline.flatMap((group) => group.entries
      .map(getEntryRegion)
      .filter(Boolean))
  )].sort(), [timeline]);
  const visibleTimeline = useMemo(() => timeline
    .filter((group) => !periodFilter || group.period === periodFilter)
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => (
        (!categoryFilter || entry.category_auto === categoryFilter)
        && (!regionFilter || getEntryRegion(entry) === regionFilter)
      )),
    }))
    .filter((group) => (
      (!categoryFilter && !regionFilter) || group.entries.length > 0
    )), [timeline, periodFilter, categoryFilter, regionFilter]);

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
        <p className="timeline-page-intro">
          {periodFilter
            ? `Entries in ${periodFilter}.`
            : 'Entries by historical period, earliest first.'}
        </p>
        {queryPeriod && <Link to="/timeline" className="timeline-page-all-link">View all periods</Link>}

        <div className="timeline-filter-bar" aria-label="Filter timeline">
          <label>
            <span>Period</span>
            <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
              <option value="">All periods</option>
              {timeline.map((group) => <option key={group.period} value={group.period}>{group.period}</option>)}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>Region</span>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option value="">All regions</option>
              {availableRegions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>
        </div>

        {loading && <p className="timeline-page-state">Loading…</p>}
        {!loading && timeline.length === 0 && <p className="timeline-page-empty">No entries have a historical period set yet.</p>}
        {!loading && timeline.length > 0 && visibleTimeline.length === 0 && (
          <p className="timeline-page-empty">No entries match these filters.</p>
        )}
        {!loading && (
          <div className="timeline-journey">
            {visibleTimeline.map((group) => (
              <PeriodSection key={group.period} period={group.period} entries={group.entries} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
