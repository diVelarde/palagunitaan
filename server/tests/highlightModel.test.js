jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { findActive } = require('../models/highlightModel');

describe('highlightModel.findActive', () => {
  beforeEach(() => db.query.mockReset());

  it('includes the highlighted entry content and cover image', async () => {
    const row = {
      id: 2,
      title: 'A story',
      raw_content: 'The first sentence. The second sentence.',
      euphemistic_content: 'An educational version of the story.',
      cover_image_url: 'https://images.example/story.jpg',
    };
    db.query.mockResolvedValueOnce([[row]]);

    await expect(findActive('week')).resolves.toEqual(row);
    expect(db.query.mock.calls[0][0]).toContain('he.cover_image_url');
    expect(db.query.mock.calls[0][0]).toContain('he.raw_content');
    expect(db.query.mock.calls[0][0]).toContain('he.euphemistic_content');
    expect(db.query.mock.calls[0][0]).toContain("he.status = 'published'");
  });

  it('loads an active heritage site highlight with its display fields', async () => {
    const row = {
      id: 3,
      target_type: 'site',
      site_name: 'Peñafrancia Basilica',
      site_description: 'A historic shrine.',
      site_image_url: 'https://images.example/basilica.jpg',
    };
    db.query.mockResolvedValueOnce([[row]]);

    await expect(findActive('week')).resolves.toEqual(row);
    expect(db.query.mock.calls[0][0]).toContain('hs.name AS site_name');
    expect(db.query.mock.calls[0][0]).toContain('hs.image_url AS site_image_url');
    expect(db.query.mock.calls[0][0]).toContain('LEFT JOIN heritage_sites');
  });

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
