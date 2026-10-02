jest.mock('../models/blogPostModel', () => ({
  findById: jest.fn(),
  incrementViewCount: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../services/cloudinaryService', () => ({
  uploadBuffer: jest.fn(),
}));

const blogPostModel = require('../models/blogPostModel');
const cloudinaryService = require('../services/cloudinaryService');
const { getPostById, createPost } = require('../controllers/blogPostController');

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
    const post = { id: 12, title: 'A Bicol story', view_count: 8 };
    blogPostModel.incrementViewCount.mockResolvedValue(true);
    blogPostModel.findById.mockResolvedValue(post);
    const req = { params: { id: '12' } };
    const res = makeResponse();
    const next = jest.fn();

    await getPostById(req, res, next);

    expect(blogPostModel.incrementViewCount).toHaveBeenCalledWith('12');
    expect(blogPostModel.findById).toHaveBeenCalledWith('12');
    expect(res.json).toHaveBeenCalledWith({ post });
    expect(next).not.toHaveBeenCalled();
  });

  describe('blogPostController.createPost', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates a post without a cover image when none is uploaded', async () => {
      const post = { id: 4, title: 'A story', cover_image_url: null };
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
      expect(res.json).toHaveBeenCalledWith({ post });
    });

    it('uploads an optional cover and stores its URL with the post', async () => {
      const post = { id: 5, cover_image_url: 'https://images.example/cover.jpg' };
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
      expect(res.json).toHaveBeenCalledWith({ post });
    });
  });

  it('returns 404 without fetching a post when it does not exist', async () => {
    blogPostModel.incrementViewCount.mockResolvedValue(false);
    const res = makeResponse();

    await getPostById({ params: { id: '404' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found.' });
    expect(blogPostModel.findById).not.toHaveBeenCalled();
  });
});
