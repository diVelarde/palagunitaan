import { useEffect, useState } from 'react';

const PAGE_SIZE = 100;
const EMPTY_FETCH = async () => [];
const EMPTY_CREATE = async (data) => ({ id: Date.now(), ...data });

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateAfter(startDate, days) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toISODate(value) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return String(value || '').slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(`${toISODate(date)}T00:00:00`).toLocaleDateString();
}

function getDurationDays(startsOn, endsOn) {
  if (!startsOn || !endsOn) return null;
  const start = new Date(`${toISODate(startsOn)}T00:00:00`);
  const end = new Date(`${toISODate(endsOn)}T00:00:00`);
  return Math.round((end - start) / 86400000) + 1;
}

function getScheduleState(item) {
  const today = todayISO();
  if (today < toISODate(item.starts_on)) return 'Scheduled';
  if (today <= toISODate(item.ends_on)) return 'Current';
  return 'Past';
}

export default function HighlightSelector({
  fetchHeritageEntries = EMPTY_FETCH,
  fetchSites = EMPTY_FETCH,
  fetchHighlightHistory = EMPTY_FETCH,
  createHighlight = EMPTY_CREATE,
}) {
  const [entries, setEntries] = useState([]);
  const [sites, setSites] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [periodType, setPeriodType] = useState('week');
  const [startsOn, setStartsOn] = useState(todayISO());
  const [endsOn, setEndsOn] = useState(dateAfter(todayISO(), 6));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadHistory() {
    const allHighlights = [];
    let offset = 0;
    let page = [];
    do {
      page = await fetchHighlightHistory({ limit: PAGE_SIZE, offset });
      allHighlights.push(...(page || []));
      offset += PAGE_SIZE;
    } while (page?.length === PAGE_SIZE);
    setHighlights(allHighlights);
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const allEntries = [];
        let offset = 0;
        let page = [];
        do {
          page = await fetchHeritageEntries({ limit: PAGE_SIZE, offset });
          allEntries.push(...(page || []));
          offset += PAGE_SIZE;
        } while (page?.length === PAGE_SIZE);

        const allSites = await fetchSites();
        const allHighlights = [];
        offset = 0;
        do {
          page = await fetchHighlightHistory({ limit: PAGE_SIZE, offset });
          allHighlights.push(...(page || []));
          offset += PAGE_SIZE;
        } while (page?.length === PAGE_SIZE);

        if (active) {
          setEntries(allEntries);
          setSites(allSites || []);
          setHighlights(allHighlights);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Could not load entries and highlight schedules.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [fetchHeritageEntries, fetchSites, fetchHighlightHistory]);

  function handlePeriodChange(type) {
    setPeriodType(type);
    setEndsOn(dateAfter(startsOn, type === 'week' ? 6 : 29));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedItem) {
      setMessage({ type: 'error', text: 'Select a heritage entry or site first.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createHighlight({
        ...(selectedItem.targetType === 'entry'
          ? { heritageEntryId: selectedItem.id }
          : { heritageSiteId: selectedItem.id }),
        periodType,
        startsOn,
        endsOn,
      });
      setMessage({ type: 'success', text: `"${selectedItem.title}" is now scheduled as the ${periodType} highlight.` });
      setSelectedItem(null);
      try {
        await loadHistory();
      } catch (err) {
        setMessage({
          type: 'error',
          text: `The highlight was set, but schedules could not be refreshed: ${err.response?.data?.message || err.message}`,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not set this highlight.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`} role="status">
          {message.text}
        </p>
      )}

      {selectedItem && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Schedule: {selectedItem.title}</h3>
            <button type="button" onClick={() => setSelectedItem(null)} className="text-xs text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            {['week', 'month'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handlePeriodChange(type)}
                className={`px-3 py-1.5 text-sm rounded-md ${periodType === type ? 'bg-[#ad482d] text-white' : 'bg-[#f4eee6] text-[#71655c]'}`}
              >
                {type === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="highlight-start-date">Starts</label>
              <input
                id="highlight-start-date"
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="highlight-end-date">Ends</label>
              <input
                id="highlight-end-date"
                type="date"
                value={endsOn}
                min={startsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
                required
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Duration: {getDurationDays(startsOn, endsOn) || '—'} days · {formatDate(startsOn)} – {formatDate(endsOn)}
          </p>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#ad482d] text-white text-sm rounded-md hover:bg-[#873720] disabled:opacity-50">
            {submitting ? 'Saving…' : 'Set highlight'}
          </button>
        </form>
      )}

      {loading ? <p className="text-sm text-gray-500">Loading heritage entries and sites…</p> : entries.length + sites.length === 0 ? (
        <p className="text-sm text-gray-500">No heritage entries or sites found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Heritage entry or site</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Highlight schedule</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...entries.map((entry) => ({ ...entry, targetType: 'entry', title: entry.title, imageUrl: entry.cover_image_url })),
                ...sites.map((site) => ({ ...site, targetType: 'site', title: site.name, imageUrl: site.image_url }))].map((item) => {
                const schedules = highlights.filter((schedule) => (
                  item.targetType === 'entry'
                    ? schedule.target_type === 'entry' && String(schedule.heritage_entry_id) === String(item.id)
                    : schedule.target_type === 'site' && String(schedule.heritage_site_id) === String(item.id)
                ));
                const canHighlight = item.targetType === 'site' || item.status === 'published';
                return (
                  <tr key={`${item.targetType}-${item.id}`} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
                        ) : (
                          <span className="grid h-14 w-14 place-items-center rounded-md bg-[#f4eee6] text-lg text-[#71655c]" aria-hidden="true">
                            {item.title?.charAt(0) || 'P'}
                          </span>
                        )}
                        <span>
                          <strong className="block">{item.title}</strong>
                          <small className="text-gray-500">{item.targetType === 'site' ? 'Heritage site' : item.category_auto}</small>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 capitalize">{item.targetType === 'site' ? 'Site' : item.status}</td>
                    <td className="py-3 pr-3">
                      {schedules.length ? schedules.map((schedule) => (
                        <p key={schedule.id} className="mb-2 last:mb-0">
                          <strong className="capitalize">{schedule.period_type}</strong>
                          {' · '}{getScheduleState(schedule)}
                          <br />
                          {formatDate(schedule.starts_on)} – {formatDate(schedule.ends_on)}
                          {' · '}{getDurationDays(schedule.starts_on, schedule.ends_on)} days
                        </p>
                      )) : <span className="text-gray-500">No highlights scheduled</span>}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={!canHighlight}
                        onClick={() => {
                          setSelectedItem(item);
                          setMessage(null);
                        }}
                        className="rounded-md border border-[#e6d6c1] px-3 py-1.5 text-xs text-[#572b18] disabled:cursor-not-allowed disabled:opacity-50"
                        title={!canHighlight ? 'Only published entries can be highlighted.' : undefined}
                      >
                        {canHighlight ? 'Set highlight' : 'Not published'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
