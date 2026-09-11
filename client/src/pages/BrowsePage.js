import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HistoricalPeriodSelector from '../components/HistoricalPeriodSelector';

const VERIFICATION_OPTIONS = ['verified', 'disputed', 'unverified'];
const DEBOUNCE_MS = 350;

const VERIFICATION_STYLES = {
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-amber-100 text-amber-800',
  unverified: 'bg-gray-100 text-gray-700',
};

function EntryCard({ entry }) {
  return (
    <Link to={`/entries/${entry.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${VERIFICATION_STYLES[entry.verification_status] || VERIFICATION_STYLES.unverified}`}>
          {entry.verification_status || 'unverified'}
        </span>
        {entry.category_auto && <span className="text-xs text-gray-500 uppercase tracking-wide">{entry.category_auto}</span>}
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{entry.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">
        {(entry.euphemistic_content || entry.raw_content || '').slice(0, 160)}
        {(entry.euphemistic_content || entry.raw_content || '').length > 160 ? '…' : ''}
      </p>
    </Link>
  );
}

export default function BrowsePage({ searchEntries = async () => [] }) {
  const [keyword, setKeyword] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [historicalPeriod, setHistoricalPeriod] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchEntries({ keyword, verificationStatus, historicalPeriod }).then((results) => {
        setEntries(results || []);
        setLoading(false);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, verificationStatus, historicalPeriod, searchEntries]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Browse the archive</h1>
      <p className="text-sm text-gray-600 mb-6">Search documented folklore from across Camarines Sur.</p>

      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by title or content…"
          className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
        />
        <select value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800">
          <option value="">Any verification status</option>
          {VERIFICATION_OPTIONS.map((v) => <option key={v} value={v} className="capitalize">{v}</option>)}
        </select>
        <div className="w-48">
          <HistoricalPeriodSelector value={historicalPeriod} onChange={setHistoricalPeriod} includeAllOption />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Searching…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries match your search.</p>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}
