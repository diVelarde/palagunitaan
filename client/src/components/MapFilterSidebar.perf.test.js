import { applyFilters, defaultFilters } from './MapFilterSidebar';

function generateMarkers(count) {
  const categories = ['Legend', 'Folk Tale', 'Deity or Spirit', 'Ritual or Practice'];
  const statuses = ['verified', 'disputed', 'unverified'];
  return Array.from({ length: count }, (_, i) => ({
    type: i % 5 === 0 ? 'site' : 'entry',
    id: i,
    title: `Marker ${i}`,
    category: categories[i % categories.length],
    verificationStatus: statuses[i % statuses.length],
    latitude: 13 + Math.random(),
    longitude: 123 + Math.random(),
  }));
}

describe('applyFilters performance', () => {
  it('filters 5,000 markers well under a frame budget', () => {
    const markers = generateMarkers(5000);
    const filters = { ...defaultFilters(), verificationStatuses: ['verified'] };
    const start = performance.now();
    const result = applyFilters(markers, filters);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(result.every((m) => m.type !== 'entry' || m.verificationStatus === 'verified')).toBe(true);
  });

  it('is stable under repeated calls (no memory blow-up from accidental recursion/mutation)', () => {
    const markers = generateMarkers(1000);
    const filters = defaultFilters();
    for (let i = 0; i < 100; i++) applyFilters(markers, filters);
    expect(markers).toHaveLength(1000);
  });
});

describe('applyFilters correctness at scale', () => {
  it('type filter and verification filter combine correctly (AND, not OR)', () => {
    const markers = generateMarkers(500);
    const filters = { types: ['entry'], verificationStatuses: ['verified'], categories: [] };
    const result = applyFilters(markers, filters);
    expect(result.every((m) => m.type === 'entry')).toBe(true);
    expect(result.every((m) => m.verificationStatus === 'verified')).toBe(true);
  });

  it('sites are never excluded by the verification-status filter', () => {
    const markers = generateMarkers(500);
    const filters = { types: ['entry', 'site'], verificationStatuses: ['verified'], categories: [] };
    const result = applyFilters(markers, filters);
    const siteCount = markers.filter((m) => m.type === 'site').length;
    const filteredSiteCount = result.filter((m) => m.type === 'site').length;
    expect(filteredSiteCount).toBe(siteCount);
  });
});
