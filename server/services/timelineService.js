const CANONICAL_ORDER = [
  'Pre-Colonial', 'Spanish Colonial Period', 'American Occupation',
  'Japanese Occupation', 'Post-Independence', 'Contemporary', 'Unknown',
];

function normalizePeriodLabel(period) {
  const match = CANONICAL_ORDER.find((p) => p.toLowerCase() === period.trim().toLowerCase());
  return match || period.trim();
}

function periodRank(period) {
  const idx = CANONICAL_ORDER.indexOf(period);
  return idx === -1 ? CANONICAL_ORDER.length : idx;
}

function buildTimeline(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const label = normalizePeriodLabel(entry.historical_period);
    const key = CANONICAL_ORDER.includes(label) ? label : 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  const known = [...groups.entries()].filter(([period]) => period !== 'Other').sort((a, b) => periodRank(a[0]) - periodRank(b[0]));
  const other = groups.has('Other') ? [['Other', groups.get('Other')]] : [];

  return [...known, ...other].map(([period, periodEntries]) => ({ period, entries: periodEntries }));
}

module.exports = { buildTimeline, CANONICAL_ORDER, normalizePeriodLabel };
