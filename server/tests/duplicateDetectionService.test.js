jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { normalize, similarity, findPossibleDuplicates } = require('../services/duplicateDetectionService');

describe('normalize', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalize('The Aswang, of San Isidro!')).toBe('the aswang of san isidro');
  });
  it('collapses repeated whitespace', () => {
    expect(normalize('Too   many    spaces')).toBe('too many spaces');
  });
});

describe('similarity', () => {
  it('returns 1 for identical strings', () => {
    expect(similarity('aswang legend', 'aswang legend')).toBe(1);
  });
  it('returns a high score for near-duplicates (one-word difference)', () => {
    expect(similarity('the aswang of san isidro', 'the aswang of san isidoro')).toBeGreaterThan(0.75);
  });
  it('returns a low score for unrelated strings', () => {
    expect(similarity('the aswang of san isidro', 'peafrancia festival origins')).toBeLessThan(0.5);
  });
});

describe('findPossibleDuplicates', () => {
  beforeEach(() => db.query.mockReset());

  it('filters out candidates below the similarity threshold', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, title: 'The Aswang of San Isidro' },
      { id: 2, title: 'The Tikbalang of Naga' },
    ]]);
    const results = await findPossibleDuplicates('The Aswang of San Isidoro');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('excludes the entry itself when excludeEntryId is passed', async () => {
    db.query.mockResolvedValueOnce([[]]);
    await findPossibleDuplicates('Some title', 42);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([42]));
  });
});