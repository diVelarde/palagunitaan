jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const db = require('../config/db');
const { create, updateAlternateNames } = require('../models/heritageEntryModel');

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
