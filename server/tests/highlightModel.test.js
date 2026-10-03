jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { findActive } = require('../models/highlightModel');

describe('highlightModel.findActive', () => {
  beforeEach(() => db.query.mockReset());

  it('retries a transient database connection reset once', async () => {
    const row = { id: 2, title: 'A story' };
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    db.query
      .mockRejectedValueOnce(Object.assign(new Error('socket reset'), { code: 'ECONNRESET' }))
      .mockResolvedValueOnce([[row]]);

    await expect(findActive('week')).resolves.toEqual(row);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('retrying once (ECONNRESET)'));
    warning.mockRestore();
  });

  it('surfaces the error if the retry also fails', async () => {
    const firstError = Object.assign(new Error('socket reset'), { code: 'ECONNRESET' });
    const retryError = Object.assign(new Error('database unavailable'), { code: 'ECONNRESET' });
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    db.query.mockRejectedValueOnce(firstError).mockRejectedValueOnce(retryError);

    await expect(findActive('month')).rejects.toBe(retryError);
    expect(db.query).toHaveBeenCalledTimes(2);
    warning.mockRestore();
  });

  it('does not retry non-connection errors', async () => {
    const error = Object.assign(new Error('invalid query'), { code: 'ER_PARSE_ERROR' });
    db.query.mockRejectedValueOnce(error);

    await expect(findActive('week')).rejects.toBe(error);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
