jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { search } = require('../models/heritageEntryModel');

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

  it('respects limit/offset with sane defaults', async () => {
    await search({});
    const [, params] = db.query.mock.calls[0];
    expect(params.slice(-2)).toEqual([20, 0]);
  });
});
