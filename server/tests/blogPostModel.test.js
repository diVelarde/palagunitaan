jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const {
  findAll,
  findById,
  incrementViewCount,
  findByUser,
  create,
} = require('../models/blogPostModel');

describe('blogPostModel.findAll', () => {
  beforeEach(() => db.query.mockReset());

  it('only returns published posts when no viewer is provided', async () => {
    db.query.mockResolvedValue([[]]);

    await expect(findAll({ limit: 5, offset: 10 })).resolves.toEqual([]);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE bp.status = ?'),
      ['published', 5, 10]
    );
  });

  it('also returns an author’s own unpublished posts', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({ limit: 5, offset: 0 }, { userId: 7, role: 'contributor' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(bp.status = ? OR bp.user_id = ?)'),
      ['published', 7, 5, 0]
    );
  });

  it('allows validators and administrators to see all posts', async () => {
    db.query.mockResolvedValue([[]]);

    await findAll({ limit: 20, offset: 0 }, { userId: 7, role: 'validator' });

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

  it('allows a moderator to read an unpublished post', async () => {
    db.query.mockResolvedValue([[{ id: 12, status: 'rejected' }]]);

    await expect(findById(12, { userId: 3, role: 'admin' })).resolves.toMatchObject({ status: 'rejected' });

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
      });

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        "INSERT INTO blog_posts (user_id, title, content, cover_image_url, status) VALUES (?, ?, ?, ?, 'pending')",
        [3, 'A story', 'A community story.', 'https://images.example/cover.jpg']
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
