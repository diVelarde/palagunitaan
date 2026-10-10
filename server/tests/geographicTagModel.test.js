jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

const db = require('../config/db');
const { findTagsForPublishedEntries } = require('../models/geographicTagModel');

describe('findTagsForPublishedEntries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries published pinned entries without relying on an optional region coordinates column', async () => {
    const rows = [{ entry_id: 1, latitude: 13.6, longitude: 123.2 }];
    db.query.mockResolvedValue([rows]);

    await expect(findTagsForPublishedEntries()).resolves.toBe(rows);

    const [query] = db.query.mock.calls[0];
    expect(query).toContain('LEFT JOIN geographic_tags');
    expect(query).toContain('LOWER(TRIM(r.province)) = \'sorsogon\'');
    expect(query).not.toContain('r.coordinates');
  });
});
