const { buildTimeline, normalizePeriodLabel, CANONICAL_ORDER } = require('../services/timelineService');

function entry(id, period) {
  return { id, historical_period: period, title: `Entry ${id}` };
}

describe('normalizePeriodLabel', () => {
  it('is case-insensitive and trims whitespace', () => {
    expect(normalizePeriodLabel('  pre-colonial  ')).toBe('Pre-Colonial');
    expect(normalizePeriodLabel('SPANISH COLONIAL PERIOD')).toBe('Spanish Colonial Period');
  });
  it('passes through unrecognized labels unchanged (aside from trimming)', () => {
    expect(normalizePeriodLabel('  Made-up Period ')).toBe('Made-up Period');
  });
});

describe('buildTimeline', () => {
  it('orders groups chronologically regardless of input order, with Unknown last', () => {
    const entries = [
      entry(1, 'Contemporary'),
      entry(2, 'Pre-Colonial'),
      entry(3, 'American Occupation'),
      entry(4, 'Spanish Colonial Period'),
      entry(5, 'Unknown'),
      entry(6, 'Post-Independence'),
      entry(7, 'Japanese Occupation'),
    ];

    const timeline = buildTimeline(entries);
    const periodOrder = timeline.map((g) => g.period);

    expect(periodOrder).toEqual([
      'Pre-Colonial',
      'Spanish Colonial Period',
      'American Occupation',
      'Japanese Occupation',
      'Post-Independence',
      'Contemporary',
      'Unknown',
    ]);
  });

  it('normalizes case/whitespace variants into the same group', () => {
    const entries = [entry(1, 'pre-colonial'), entry(2, ' Pre-Colonial '), entry(3, 'PRE-COLONIAL')];
    const timeline = buildTimeline(entries);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].period).toBe('Pre-Colonial');
    expect(timeline[0].entries).toHaveLength(3);
  });

  it('groups genuinely unrecognized values under "Other" as a safety net', () => {
    const entries = [entry(1, 'Pre-Colonial'), entry(2, 'Ancient Times'), entry(3, 'Y2K Era')];
    const timeline = buildTimeline(entries);
    expect(timeline[timeline.length - 1].period).toBe('Other');
    expect(timeline[timeline.length - 1].entries).toHaveLength(2);
  });

  it('returns an empty array for no entries', () => {
    expect(buildTimeline([])).toEqual([]);
  });

  it('every canonical period, if present, appears before "Other"', () => {
    const entries = CANONICAL_ORDER.map((period, i) => entry(i, period)).concat(entry(99, 'Genuinely Unrecognized'));
    const timeline = buildTimeline(entries);
    const otherIndex = timeline.findIndex((g) => g.period === 'Other');
    expect(otherIndex).toBe(timeline.length - 1);
  });
});