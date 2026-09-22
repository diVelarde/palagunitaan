import { useEffect, useRef, useState } from 'react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultEndDate(periodType) {
  const d = new Date();
  d.setDate(d.getDate() + (periodType === 'week' ? 7 : 30));
  return d.toISOString().slice(0, 10);
}

export default function HighlightSelector({
  searchEntries = async () => [],
  createHighlight = async (data) => ({ id: Date.now(), ...data }),
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [periodType, setPeriodType] = useState('week');
  const [startsOn, setStartsOn] = useState(todayISO());
  const [endsOn, setEndsOn] = useState(defaultEndDate('week'));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchEntries({ keyword: query, verificationStatus: 'verified' }).then(setResults);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchEntries]);

  function handlePeriodChange(type) {
    setPeriodType(type);
    setEndsOn(defaultEndDate(type));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedEntry) {
      setMessage({ type: 'error', text: 'Pick an entry to highlight first.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createHighlight({ heritageEntryId: selectedEntry.id, periodType, startsOn, endsOn });
      setMessage({ type: 'success', text: `"${selectedEntry.title}" is now the ${periodType}'s highlight.` });
      setSelectedEntry(null);
      setQuery('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not set this highlight.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Set a highlight</h3>

      {message && <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{message.text}</p>}

      {selectedEntry ? (
        <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
          <span className="text-sm text-gray-800">{selectedEntry.title}</span>
          <button type="button" onClick={() => setSelectedEntry(null)} className="text-xs text-gray-500 hover:text-gray-700">change</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified entries…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {results.length > 0 && (
            <ul className="border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto">
              {results.map((entry) => (
                <li key={entry.id}>
                  <button type="button" onClick={() => { setSelectedEntry(entry); setResults([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                    {entry.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => handlePeriodChange('week')} className={`px-3 py-1.5 text-sm rounded-md ${periodType === 'week' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Week</button>
        <button type="button" onClick={() => handlePeriodChange('month')} className={`px-3 py-1.5 text-sm rounded-md ${periodType === 'month' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'}`}>Month</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Starts</label>
          <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ends</label>
          <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50">
        {submitting ? 'Saving…' : 'Set highlight'}
      </button>
    </form>
  );
}