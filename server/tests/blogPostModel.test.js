jest.mock('../config/db', () => ({ query: jest.fn() }));

const db = require('../config/db');
const { incrementViewCount, create } = require('../models/blogPostModel');

describe('blogPostModel.incrementViewCount', () => {
  beforeEach(() => db.query.mockReset());

  it('atomically increments the view count for an existing post', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);

    await expect(incrementViewCount(42)).resolves.toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?',
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
        'INSERT INTO blog_posts (user_id, title, content, cover_image_url) VALUES (?, ?, ?, ?)',
        [3, 'A story', 'A community story.', 'https://images.example/cover.jpg']
      );
      expect(post).toMatchObject({ id: 14, cover_image_url: 'https://images.example/cover.jpg' });
    });
  });

  it('reports when the post does not exist', async () => {
    db.query.mockResolvedValue([{ affectedRows: 0 }]);

    await expect(incrementViewCount(404)).resolves.toBe(false);
  });
});
