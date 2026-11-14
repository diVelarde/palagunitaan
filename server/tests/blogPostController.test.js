jest.mock('../models/blogPostModel', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  incrementViewCount: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../services/cloudinaryService', () => ({
  uploadBuffer: jest.fn(),
}));

const blogPostModel = require('../models/blogPostModel');
const cloudinaryService = require('../services/cloudinaryService');
const { listPosts, getPostById, createPost } = require('../controllers/blogPostController');

function makeResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe('blogPostController.getPostById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments the view count and returns the updated post', async () => {
    const post = { id: 12, title: 'A Bicol story', view_count: 8, status: 'published' };
    blogPostModel.incrementViewCount.mockResolvedValue(true);
    blogPostModel.findById.mockResolvedValue(post);
    const req = { params: { id: '12' }, user: { id: 6, role: 'validator' } };
    const res = makeResponse();
    const next = jest.fn();

    await getPostById(req, res, next);

    expect(blogPostModel.incrementViewCount).toHaveBeenCalledWith('12');
    expect(blogPostModel.findById).toHaveBeenCalledWith('12', { userId: 6, role: 'validator' });
    expect(res.json).toHaveBeenCalledWith({ post });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes the viewer when listing the feed', async () => {
    const posts = [{ id: 12, status: 'pending' }];
    blogPostModel.findAll.mockResolvedValue(posts);
    const res = makeResponse();

    await listPosts({
      query: { limit: '10', offset: '2' },
      user: { id: 6, role: 'contributor' },
    }, res, jest.fn());

    expect(blogPostModel.findAll).toHaveBeenCalledWith(
      { limit: 10, offset: 2 },
      { userId: 6, role: 'contributor' }
    );
    expect(res.json).toHaveBeenCalledWith({ posts });
  });

  it('allows an author to read their own unpublished post without incrementing its views', async () => {
    const post = { id: 12, title: 'Waiting for review', status: 'pending', view_count: 0 };
    blogPostModel.incrementViewCount.mockResolvedValue(false);
    blogPostModel.findById.mockResolvedValue(post);
    const res = makeResponse();

    await getPostById({
      params: { id: '12' },
      user: { id: 9, role: 'contributor' },
    }, res, jest.fn());

    expect(blogPostModel.findById).toHaveBeenCalledWith('12', { userId: 9, role: 'contributor' });
    expect(res.json).toHaveBeenCalledWith({ post });
  });

  describe('blogPostController.createPost', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates a post without a cover image when none is uploaded', async () => {
      const post = { id: 4, title: 'A story', cover_image_url: null, status: 'pending' };
      blogPostModel.create.mockResolvedValue(post);
      const res = makeResponse();

      await createPost({
        user: { id: 9 },
        body: { title: ' A story ', content: ' A community story. ' },
      }, res, jest.fn());

      expect(blogPostModel.create).toHaveBeenCalledWith({
        userId: 9,
        title: 'A story',
        content: 'A community story.',
        coverImageUrl: null,
      });
      expect(cloudinaryService.uploadBuffer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        post,
        message: 'Your post is waiting for review',
      });
    });

    it('uploads an optional cover and stores its URL with the post', async () => {
      const post = { id: 5, cover_image_url: 'https://images.example/cover.jpg', status: 'pending' };
      blogPostModel.create.mockResolvedValue(post);
      cloudinaryService.uploadBuffer.mockResolvedValue({ secure_url: post.cover_image_url });
      const res = makeResponse();

      await createPost({
        user: { id: 9 },
        body: { title: 'A story', content: 'A community story.' },
        file: { buffer: Buffer.from('image'), mimetype: 'image/jpeg' },
      }, res, jest.fn());

      expect(cloudinaryService.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        { mimetype: 'image/jpeg', folder: 'palagunitaan/blog-covers' }
      );
      expect(blogPostModel.create).toHaveBeenCalledWith(expect.objectContaining({
        coverImageUrl: post.cover_image_url,
      }));
      expect(res.json).toHaveBeenCalledWith({
        post,
        message: 'Your post is waiting for review',
      });
    });
  });

  it('returns 404 when an unpublished post is not visible to the viewer', async () => {
    blogPostModel.incrementViewCount.mockResolvedValue(false);
    blogPostModel.findById.mockResolvedValue(null);
    const res = makeResponse();

    await getPostById({
      params: { id: '404' },
      user: { id: 4, role: 'public' },
    }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found.' });
    expect(blogPostModel.findById).toHaveBeenCalledWith('404', { userId: 4, role: 'public' });
  });
});
