jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const {
  findAll,
  findById,
  incrementViewCount,
  findByUser,
  findPending,
  markReviewed,
  create,
} = require('../models/blogPostModel');

describe('blogPostModel.findAll', () => {
  beforeEach(() => db.query.mockReset());

  it('only returns published posts when no viewer is provided', async () => {
    db.query.mockResolvedValue([[]]);

    await expect(findAll({ limit: 5, offset: 10 })).resolves.toEqual([]);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('WHERE bp.status = ?');
    expect(sql).toContain('ORDER BY bp.created_at DESC, bp.id DESC');
    expect(params).toEqual(['published', 5, 10]);
  });

  it('filters by author id or exact author name with bound values', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({ authorId: 12 });
    expect(db.query.mock.calls[0][0]).toContain('bp.user_id = ?');
    expect(db.query.mock.calls[0][1]).toEqual(['published', 12, 20, 0]);

    db.query.mockClear();
    await findAll({ authorName: 'María Santos' });
    expect(db.query.mock.calls[0][0]).toContain('u.name = ?');
    expect(db.query.mock.calls[0][1]).toEqual(['published', 'María Santos', 20, 0]);
  });

  it('binds keyword terms and escapes LIKE wildcards instead of interpolating them into SQL', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({ q: "' OR 1=1 --" });
    let [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('bp.title LIKE ?');
    expect(sql).toContain('bp.content LIKE ?');
    expect(sql).not.toContain("' OR 1=1 --");
    expect(params).toContain("%' OR 1=1 --%");

    db.query.mockClear();
    await findAll({ q: '%' });
    [sql, params] = db.query.mock.calls[0];
    expect(sql).not.toContain('%');
    expect(params).toContain('%!%%');
  });

  it('combines keyword, author, inclusive date bounds, and oldest sorting', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({
      q: 'aswang',
      authorId: 8,
      from: '2026-01-01',
      to: '2026-01-31',
      sort: 'oldest',
      limit: 4,
      offset: 3,
    });

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('WHERE bp.status = ?');
    expect(sql).toContain('(bp.title LIKE ? ESCAPE \'!\' OR bp.content LIKE ? ESCAPE \'!\')');
    expect(sql).toContain('bp.user_id = ?');
    expect(sql).toContain('bp.created_at >= ?');
    expect(sql).toContain('bp.created_at < ?');
    expect(sql).toContain('ORDER BY bp.created_at ASC, bp.id ASC');
    expect(params).toEqual([
      'published',
      '%aswang%',
      '%aswang%',
      8,
      '2026-01-01 00:00:00',
      '2026-02-01 00:00:00',
      4,
      3,
    ]);
  });

  it('also returns an author’s own unpublished posts', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({ limit: 5, offset: 0 }, { userId: 7, role: 'contributor' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(bp.status = ? OR bp.user_id = ?)'),
      ['published', 7, 5, 0]
    );
  });

  it.each(['validator', 'admin'])('allows %s to see all posts', async (role) => {
    db.query.mockResolvedValue([[]]);

    await findAll({ limit: 20, offset: 0 }, { userId: 7, role });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE 1 = 1'),
      [20, 0]
    );
  });
});

describe('blogPostModel.findById', () => {
  beforeEach(() => db.query.mockReset());

  it('is public-safe without a viewer', async () => {
    db.query.mockResolvedValue([[]]);

    await expect(findById(12)).resolves.toBeNull();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('bp.id = ? AND bp.status = ?'),
      [12, 'published']
    );
  });

  it('allows an author to read their unpublished post', async () => {
    db.query.mockResolvedValue([[{ id: 12, status: 'pending', user_id: 7 }]]);

    await expect(findById(12, { userId: 7, role: 'contributor' })).resolves.toMatchObject({
      id: 12,
      status: 'pending',
    });

    expect(db.query.mock.calls[0][0]).toContain('OR bp.user_id = ?');
    expect(db.query.mock.calls[0][1]).toEqual([12, 'published', 7]);
  });

  it.each([
    ['validator', 'pending'],
    ['validator', 'rejected'],
    ['admin', 'pending'],
    ['admin', 'rejected'],
  ])('allows a %s to read a %s post', async (role, status) => {
    db.query.mockResolvedValue([[{ id: 12, status }]]);

    await expect(findById(12, { userId: 3, role })).resolves.toMatchObject({ status });

    expect(db.query.mock.calls[0][0]).toContain('AND 1 = 1');
  });
});

describe('blogPostModel.incrementViewCount', () => {
  beforeEach(() => db.query.mockReset());

  it('atomically increments the view count for a published post', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);

    await expect(incrementViewCount(42)).resolves.toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      "UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ? AND status = 'published'",
      [42]
    );
  });

  describe('blogPostModel.create', () => {
    beforeEach(() => db.query.mockReset());

    it('persists an optional cover image URL', async () => {
      db.query
        .mockResolvedValueOnce([{ insertId: 14 }])
        .mockResolvedValueOnce([[{ id: 14, cover_image_url: 'https://images.example/cover.jpg' }]]);

      const post = await create({
        userId: 3,
        title: 'A story',
        content: 'A community story.',
        coverImageUrl: 'https://images.example/cover.jpg',
        mentionsPeople: true,
        consentConfirmed: true,
      });

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        "INSERT INTO blog_posts (user_id, title, content, cover_image_url, status, mentions_people, consent_confirmed) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
        [3, 'A story', 'A community story.', 'https://images.example/cover.jpg', true, true]
      );
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('WHERE bp.id = ? AND (bp.status = ? OR bp.user_id = ?)'),
        [14, 'published', 3]
      );
      expect(post).toMatchObject({ id: 14, cover_image_url: 'https://images.example/cover.jpg' });
    });
  });

  it('does not increment the view count for an unpublished post', async () => {
    db.query.mockResolvedValue([{ affectedRows: 0 }]);

    await expect(incrementViewCount(404)).resolves.toBe(false);
  });
});

describe('blogPostModel.findByUser', () => {
  beforeEach(() => db.query.mockReset());

  it('returns all of the author’s posts, including moderation fields', async () => {
    const posts = [{ id: 7, status: 'rejected', rejection_reason: 'Needs editing.' }];
    db.query.mockResolvedValue([posts]);

    await expect(findByUser(4)).resolves.toEqual(posts);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM blog_posts WHERE user_id = ?'),
      [4]
    );
  });
});

describe('blogPostModel.findPending', () => {
  beforeEach(() => db.query.mockReset());

  it('filters pending posts, excludes the reviewer’s posts, and orders oldest first', async () => {
    const posts = [{ id: 2, status: 'pending', user_id: 8 }];
    db.query.mockResolvedValue([posts]);

    await expect(findPending({ excludeUserId: 8 })).resolves.toEqual(posts);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE bp.status = 'pending' AND bp.user_id <> ?"),
      [8]
    );
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY bp.published_at ASC, bp.id ASC');
  });

  it('keeps the pending queue available without an excluded user', async () => {
    db.query.mockResolvedValue([[]]);

    await findPending();

    expect(db.query.mock.calls[0][0]).toContain("WHERE bp.status = 'pending'");
    expect(db.query.mock.calls[0][0]).not.toContain('bp.user_id <> ?');
    expect(db.query.mock.calls[0][1]).toEqual([]);
  });
});

describe('blogPostModel.markReviewed', () => {
  beforeEach(() => db.query.mockReset());

  it('saves the decision status, reviewer, timestamp, and rejection reason', async () => {
    const updatedPost = {
      id: 14,
      status: 'published',
      reviewed_by: 3,
      reviewed_at: '2026-11-15 00:00:00',
      rejection_reason: null,
    };
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[updatedPost]]);

    await expect(markReviewed(14, {
      status: 'published',
      reviewedBy: 3,
      reason: null,
    })).resolves.toEqual(updatedPost);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?'),
      ['published', 3, null, 14]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE bp.id = ? AND 1 = 1'),
      [14]
    );
  });
});
