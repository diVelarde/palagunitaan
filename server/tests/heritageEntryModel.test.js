jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const db = require('../config/db');
const {
  create,
  updateAlternateNames,
  findAllPublishedForTimeline,
} = require('../models/heritageEntryModel');

const connection = {
  beginTransaction: jest.fn(),
  query: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

describe('heritageEntryModel alternate names', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.getConnection.mockResolvedValue(connection);
  });

  describe('heritageEntryModel timeline entries', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns the existing timeline rows with preview, region, and claimed-year fields', async () => {
      const rows = [{
        id: 8,
        title: 'The Moon Eater',
        historical_period: 'Pre-Colonial',
        cover_image_url: 'https://example.test/moon-eater.jpg',
        euphemistic_content: 'A short educational account.',
        region_name: 'Bicol',
        region_province: 'Camarines Sur',
        claimed_year_start: 1750,
        claimed_year_end: 1780,
      }];
      db.query.mockResolvedValueOnce([rows]);

      await expect(findAllPublishedForTimeline()).resolves.toEqual(rows);

      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain('he.cover_image_url');
      expect(sql).toContain('he.euphemistic_content');
      expect(sql).toContain('r.name AS region_name');
      expect(sql).toContain('AS claimed_year_start');
      expect(sql).toContain('AS claimed_year_end');
      expect(sql).toContain('ORDER BY he.published_at DESC');
    });
  });

  it('stores alternate names as JSON text and returns them as an array', async () => {
    const alternateNames = ['Aswang', 'Aswong', 'Asuwang'];
    connection.query.mockResolvedValueOnce([{ insertId: 12 }]);
    db.query
      .mockResolvedValueOnce([[{ id: 12, alternate_names: JSON.stringify(alternateNames) }]])
      .mockResolvedValueOnce([[]]);

    const entry = await create({
      userId: 4,
      title: 'The Aswang',
      rawContent: 'A community account about the Aswang and its many names.',
      alternateNames,
    });

    const [sql, params] = connection.query.mock.calls[0];
    expect(sql).toContain('alternate_names');
    expect(params).toContain(JSON.stringify(alternateNames));
    expect(entry.alternate_names).toEqual(alternateNames);
    expect(connection.commit).toHaveBeenCalledTimes(1);
  });

  it('updates alternate names using a bound JSON value', async () => {
    const alternateNames = ['Aswong'];
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 15, alternate_names: JSON.stringify(alternateNames) }]])
      .mockResolvedValueOnce([[]]);

    const entry = await updateAlternateNames(15, alternateNames);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'UPDATE heritage_entries SET alternate_names = ? WHERE id = ?',
      [JSON.stringify(alternateNames), 15]
    );
    expect(entry.alternate_names).toEqual(alternateNames);
  });
});
