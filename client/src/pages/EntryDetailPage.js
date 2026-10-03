import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TranslationPanel from '../components/TranslationPanel';
import { useAuth } from '../context/AuthContext';
import heritageService from '../services/heritageService';
import MediaUploader from '../components/MediaUploader';
import './EntryDetailPage.css';

const VERIFICATION_STYLES = {
  verified: 'entry-status-verified',
  disputed: 'entry-status-disputed',
  unverified: 'entry-status-unverified',
};

function formatLocation(entry) {
  return [entry.location_name, entry.region_name, entry.region_province]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');
}

export default function EntryDetailPage({ fetchEntry = async () => null }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [entry, setEntry] = useState(undefined);
  const [view, setView] = useState('educational');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setEntry(undefined);
    setError('');
    fetchEntry(id)
      .then((data) => {
        if (active) setEntry(data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load this heritage entry. Please try again later.');
      });
    return () => {
      active = false;
    };
  }, [id, fetchEntry]);

  if (entry === undefined) {
    return <div className="entry-detail-message">Loading heritage entry…</div>;
  }

  if (error || entry === null) {
    return (
      <div className="entry-detail-message" role={error ? 'alert' : undefined}>
        <p>{error || "This entry doesn't exist, or hasn't been published yet."}</p>
        <Link to="/browse">← Back to Browse</Link>
      </div>
    );
  }

  const location = formatLocation(entry);
  const hasEducationalVersion = Boolean(entry.euphemistic_content?.trim());
  const bodyText = view === 'educational' && hasEducationalVersion
    ? entry.euphemistic_content
    : entry.raw_content;
  const mapUrl = entry.latitude != null && entry.longitude != null
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(entry.latitude)}&mlon=${encodeURIComponent(entry.longitude)}#map=14/${encodeURIComponent(entry.latitude)}/${encodeURIComponent(entry.longitude)}`
    : null;

  return (
    <main className="entry-detail-page">
      <header
        className="entry-detail-hero"
        style={entry.cover_image_url ? { '--entry-hero-image': `url("${entry.cover_image_url}")` } : undefined}
      >
        <div className="entry-detail-hero-inner">
          <Link to="/browse" className="entry-back-link">← Back to Browse</Link>
          <h1>{entry.title}</h1>
          <div className="entry-hero-meta">
            {entry.category_auto && <span>{entry.category_auto}</span>}
            {location && <span>⌖ &nbsp;{location}</span>}
            {entry.historical_period && <span>◷ &nbsp;{entry.historical_period}</span>}
          </div>
        </div>
      </header>

      <div className="entry-detail-layout">
        <article className="entry-story-card">
          {entry.cover_image_url && (
            <img className="entry-cover-image" src={entry.cover_image_url} alt={`Cover for ${entry.title}`} />
          )}

          <div className="entry-status-row">
            {entry.verification_status && (
              <span className={`entry-status ${VERIFICATION_STYLES[entry.verification_status] || VERIFICATION_STYLES.unverified}`}>
                {entry.verification_status}
              </span>
            )}
            {entry.category_auto && <span className="entry-category-label">{entry.category_auto}</span>}
          </div>

          <section className="entry-reading-copy" aria-live="polite">
            {view === 'community' && (
              <p className="entry-reading-label">RAW FIELD ACCOUNT · UNEDITED</p>
            )}
            <p className="entry-story-text">{bodyText}</p>
            {view === 'educational' && hasEducationalVersion && entry.raw_content !== entry.euphemistic_content && (
              <p className="entry-editorial-note">
                This educational summary was AI-generated from the original community account.
              </p>
            )}
            {view === 'educational' && !hasEducationalVersion && (
              <p className="entry-editorial-note">
                An educational summary is not available yet, so the original account is shown.
              </p>
            )}
          </section>

          {entry.source_description && (
            <p className="entry-source-note"><strong>Source notes:</strong> {entry.source_description}</p>
          )}
          {entry.history_claims?.length > 0 && (
            <section className="entry-history">
              <h2>History &amp; sources</h2>
              <p className="entry-history-intro">
                These are source-backed claims about when the story originated. The source's own publication or recording year is shown separately.
              </p>
              {new Set(entry.history_claims.map((claim) => claim.claimed_year)).size > 1 && (
                <p className="entry-history-difference" role="note">
                  Sources give different claimed origin years. The archive preserves these differences rather than choosing one as definitive.
                </p>
              )}
              <ol className="entry-history-list">
                {entry.history_claims.map((claim) => (
                  <li key={claim.id}>
                    <strong>Claimed origin year: {claim.claimed_year}</strong>
                    {claim.source_type && <span className="entry-history-source-type">{claim.source_type}</span>}
                    <p>{claim.source_description}</p>
                    {claim.source_year && <span>Source recorded/published: {claim.source_year}</span>}
                    {claim.source_url && (
                      <a href={claim.source_url} target="_blank" rel="noreferrer">
                        View source →
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>

        <aside className="entry-detail-sidebar">
          <section className="entry-info-card">
            <h2>Entry Details</h2>
            <dl>
              {entry.category_auto && <div><dt>Category</dt><dd>{entry.category_auto}</dd></div>}
              {location && <div><dt>Region</dt><dd>{location}</dd></div>}
              {entry.historical_period && <div><dt>Period</dt><dd>{entry.historical_period}</dd></div>}
              <div><dt>Verification</dt><dd>{entry.verification_status || 'Not yet reviewed'}</dd></div>
              {entry.source_type && <div><dt>Source</dt><dd>{entry.source_type}</dd></div>}
            </dl>
          </section>

          <section className="entry-info-card entry-reading-mode-card">
            <h2>Reading Mode</h2>
            <p>Read the public educational summary or switch to the original account collected in the field.</p>
            <div className="entry-reading-switch" role="group" aria-label="Choose reading mode">
              <button
                type="button"
                aria-pressed={view === 'educational'}
                className={view === 'educational' ? 'entry-reading-active' : ''}
                onClick={() => setView('educational')}
              >
                Educational
              </button>
              <button
                type="button"
                aria-pressed={view === 'community'}
                className={view === 'community' ? 'entry-reading-active' : ''}
                onClick={() => setView('community')}
              >
                Community Voice
              </button>
            </div>
          </section>

          <section className="entry-info-card">
            <h2>Location</h2>
            {location ? <p>{location}</p> : <p>No location has been pinned for this entry.</p>}
            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer">View pinned location on map →</a>}
          </section>
        </aside>
      </div>

      <div className="entry-detail-extras">
        <MediaUploader
          entryId={entry.id}
          disabled={!user || (entry.user_id !== user.id && user.role !== 'admin')}
        />
        {(user?.role === 'validator' || user?.role === 'admin') && (
          <TranslationPanel
            entryId={entry.id}
            initialTranslation={entry.translated_content}
            initialLanguage={entry.translated_language}
            translateEntry={heritageService.translateEntry}
          />
        )}
      </div>
    </main>
  );
}
