jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { findByUser, findPending, search } = require('../models/heritageEntryModel');

describe('heritageEntryModel.findByUser', () => {
  beforeEach(() => db.query.mockReset().mockResolvedValue([[]]));

  it('orders a user’s submissions by the timestamp set when submissions are created', async () => {
    await findByUser(7);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM heritage_entries WHERE user_id = ? ORDER BY submitted_at DESC',
      [7]
    );
  });
});

describe('heritageEntryModel.findPending', () => {
  beforeEach(() => db.query.mockReset().mockResolvedValue([[]]));

  it('excludes the selected user with a parameterized condition and keeps ordering', async () => {
    await findPending({ excludeUserId: 7 });
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/user_id <> \?/);
    expect(sql).toMatch(/ORDER BY submitted_at ASC$/);
    expect(params).toEqual([7]);
  });

  it('keeps the query unchanged when no exclusion is provided', async () => {
    await findPending();
    expect(db.query).toHaveBeenCalledWith(
      "SELECT * FROM heritage_entries WHERE status = 'pending' ORDER BY submitted_at ASC",
      []
    );
  });
});

describe('heritageEntryModel.search', () => {
  beforeEach(() => db.query.mockReset().mockResolvedValue([[]]));

  it('always restricts to published entries even with no filters', async () => {
    await search({});
    const [sql] = db.query.mock.calls[0];
    expect(sql).toMatch(/status = 'published'/);
  });

  it('parameterizes the keyword — never string-interpolates it into the SQL', async () => {
    await search({ keyword: "'; DROP TABLE heritage_entries; --" });
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).not.toContain('DROP TABLE');
    expect(params).toContain("%'; DROP TABLE heritage_entries; --%");
  });

  it('combines multiple filters with AND', async () => {
    await search({ keyword: 'aswang', verificationStatus: 'verified', historicalPeriod: 'Spanish Era' });
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/title LIKE \? OR raw_content LIKE \? OR euphemistic_content LIKE \?/);
    expect(sql).toMatch(/verification_status = \?/);
    expect(sql).toMatch(/historical_period = \?/);
    expect(params).toEqual(expect.arrayContaining(['%aswang%', '%aswang%', '%aswang%', 'verified', 'Spanish Era']));
  });

  it('omits a condition entirely when its filter is not provided', async () => {
    await search({ keyword: 'aswang' });
    const [sql] = db.query.mock.calls[0];
    expect(sql).not.toMatch(/verification_status/);
    expect(sql).not.toMatch(/historical_period/);
  });

  it('filters by the selected region name through the regions table', async () => {
    await search({ region: 'Camarines Sur' });
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/region_id IN \(SELECT id FROM regions WHERE name = \? OR province = \?\)/);
    expect(sql).toMatch(/gt\.location_name = \?/);
    expect(params).toEqual(expect.arrayContaining(['Camarines Sur', 'Camarines Sur', 'Camarines Sur']));
  });

  it('respects limit/offset with sane defaults', async () => {
    await search({});
    const [, params] = db.query.mock.calls[0];
    expect(params.slice(-2)).toEqual([20, 0]);
  });
});
