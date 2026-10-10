import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HistoricalPeriodSelector from '../components/HistoricalPeriodSelector';
import heritageService from '../services/heritageService';
import mapService from '../services/mapService';
import './BrowsePage.css';

const VERIFICATION_OPTIONS = ['verified', 'disputed', 'unverified'];
const DEBOUNCE_MS = 350;

const VERIFICATION_STYLES = {
  verified: 'browse-status-verified',
  disputed: 'browse-status-disputed',
  unverified: 'browse-status-unverified',
};

function EntryCard({ entry }) {
  return (
    <Link to={`/entries/${entry.id}`} className="browse-entry-card">
      {entry.cover_image_url && (
        <img
          src={entry.cover_image_url}
          alt=""
          className="browse-entry-image"
        />
      )}
      <div className="browse-entry-copy">
        <div className="browse-entry-meta">
          <span className={`browse-status ${VERIFICATION_STYLES[entry.verification_status] || VERIFICATION_STYLES.unverified}`}>
            {entry.verification_status || 'unverified'}
          </span>
          {entry.category_auto && <span className="browse-entry-category">{entry.category_auto}</span>}
        </div>
        <h2>{entry.title}</h2>
        <p className="browse-entry-excerpt">
          {(entry.euphemistic_content || entry.raw_content || '').slice(0, 160)}
          {(entry.euphemistic_content || entry.raw_content || '').length > 160 ? '…' : ''}
        </p>
      </div>
    </Link>
  );
}

export default function BrowsePage({
  searchEntries = async () => [],
  fetchCategories = heritageService.getCategories,
  fetchRegions = mapService.getRegions,
}) {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [regionId, setRegionId] = useState(() => searchParams.get('regionId') || '');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [historicalPeriod, setHistoricalPeriod] = useState('');
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [taxonomyError, setTaxonomyError] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCategories(), fetchRegions()])
      .then(([categoryList, regionList]) => {
        if (!active) return;
        setCategories(categoryList || []);
        setRegions(regionList || []);
        setTaxonomyError('');
      })
      .catch((err) => {
        if (active) {
          setTaxonomyError(err.response?.data?.message || 'Could not load archive categories and regions.');
        }
      });
    return () => { active = false; };
  }, [fetchCategories, fetchRegions]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSearchError('');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchEntries({ keyword, verificationStatus, historicalPeriod, category, regionId })
        .then((results) => {
          if (active) setEntries(results || []);
        })
        .catch((err) => {
          if (active) setSearchError(err.response?.data?.message || 'Could not search the archive. Please try again.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(debounceRef.current);
    };
  }, [keyword, verificationStatus, historicalPeriod, category, regionId, searchEntries]);

  return (
    <main className="browse-page site-page-surface">
      <div className="browse-page-content">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1">Browse Heritage</h1>
            <p>Explore published folklore and cultural heritage entries from the Bicol Region.</p>
          </div>
        </div>

        <div className="browse-filter-bar">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title or content…"
            aria-label="Search heritage entries"
            className="browse-filter-control browse-search-control"
          />
          <select aria-label="Filter by verification status" value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)} className="browse-filter-control">
            <option value="">Any verification status</option>
            {VERIFICATION_OPTIONS.map((v) => <option key={v} value={v} className="capitalize">{v}</option>)}
          </select>
          <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="browse-filter-control">
            <option value="">Any category</option>
            {categories.map((option) => {
              const name = typeof option === 'string' ? option : option.name;
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
          <select aria-label="Filter by region and province" value={regionId} onChange={(e) => setRegionId(e.target.value)} className="browse-filter-control">
            <option value="">Any region</option>
            {regions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}{option.province ? ` — ${option.province}` : ''}
              </option>
            ))}
          </select>
          <div className="browse-period-select">
            <HistoricalPeriodSelector
              value={historicalPeriod}
              onChange={setHistoricalPeriod}
              includeAllOption
              className="browse-filter-control"
            />
          </div>
        </div>

        {taxonomyError && (
          <p className="browse-page-message browse-page-error" role="status">
            {taxonomyError}
          </p>
        )}
        {searchError && (
          <p className="browse-page-message browse-page-error" role="alert">
            {searchError}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Searching…</p>
        ) : searchError ? null : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No entries match your search.</p>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
          </div>
        )}

      </div>
    </main>
  );
}
