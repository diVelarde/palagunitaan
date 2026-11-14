const express = require('express');
const http = require('http');

jest.mock('../models/blogPostModel', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  incrementViewCount: jest.fn(),
  findByUser: jest.fn(),
  findPending: jest.fn(),
  markReviewed: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/editorialActionModel', () => ({
  create: jest.fn(),
}));
jest.mock('../services/notificationService', () => ({
  notifyBlogDecision: jest.fn(),
}));
jest.mock('../services/cloudinaryService', () => ({
  uploadBuffer: jest.fn(),
}));

const blogPostModel = require('../models/blogPostModel');
const editorialActionModel = require('../models/editorialActionModel');
const notificationService = require('../services/notificationService');
const blogRoutes = require('../routes/blogRoutes');

function makeRequest({ method = 'GET', path = '/api/blog', user, body } = {}) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      if (user) req.user = user;
      req.isAuthenticated = () => Boolean(user);
      next();
    });
    app.use('/api/blog', blogRoutes);

    const server = app.listen(0, () => {
      const payload = body ? JSON.stringify(body) : null;
      const request = http.request({
        host: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : undefined,
      }, (response) => {
        let responseBody = '';
        response.on('data', (chunk) => { responseBody += chunk; });
        response.on('end', () => {
          server.close();
          resolve({
            status: response.statusCode,
            body: responseBody ? JSON.parse(responseBody) : null,
          });
        });
      });
      request.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (payload) request.write(payload);
      request.end();
    });
  });
}

describe('blog moderation routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    blogPostModel.findAll.mockResolvedValue([{ id: 1, status: 'published' }]);
    blogPostModel.findById.mockResolvedValue({
      id: 12,
      user_id: 7,
      title: 'A remembered story',
      status: 'pending',
    });
    blogPostModel.incrementViewCount.mockResolvedValue(false);
    blogPostModel.findPending.mockImplementation(({ excludeUserId } = {}) => Promise.resolve(
      [
        { id: 13, user_id: 8, status: 'pending' },
        { id: 14, user_id: 9, status: 'pending' },
      ].filter((post) => post.user_id !== excludeUserId)
    ));
    blogPostModel.markReviewed.mockImplementation((id, { status, reviewedBy, reason }) => Promise.resolve({
      id,
      user_id: 7,
      status,
      reviewed_by: reviewedBy,
      reviewed_at: '2026-11-15 00:00:00',
      rejection_reason: reason,
    }));
    editorialActionModel.create.mockResolvedValue({ id: 34 });
    notificationService.notifyBlogDecision.mockResolvedValue({});
  });

  it('keeps pending and rejected posts out of the public feed', async () => {
    blogPostModel.findAll.mockResolvedValue([{ id: 1, status: 'published' }]);

    const response = await makeRequest();

    expect(response.status).toBe(200);
    expect(response.body.posts).toEqual([{ id: 1, status: 'published' }]);
    expect(response.body.posts.every((post) => post.status === 'published')).toBe(true);
    expect(blogPostModel.findAll).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it.each(['pending', 'rejected'])('returns 404 for a stranger requesting a %s post', async (status) => {
    blogPostModel.findById.mockImplementation((id, viewer) => {
      const post = { id: 12, user_id: 7, status };
      return post.status === 'published'
        || post.user_id === viewer?.userId
        || ['validator', 'admin'].includes(viewer?.role)
        ? post
        : null;
    });

    const response = await makeRequest({
      path: '/api/blog/12',
      user: { id: 21, role: 'public' },
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Post not found.' });
  });

  it.each(['pending', 'rejected'])('lets the author see their own %s post', async (status) => {
    const post = { id: 12, user_id: 7, status };
    blogPostModel.findById.mockResolvedValue(post);

    const response = await makeRequest({
      path: '/api/blog/12',
      user: { id: 7, role: 'contributor' },
    });

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(post);
    expect(blogPostModel.findById).toHaveBeenCalledWith('12', { userId: 7, role: 'contributor' });
  });

  it.each([
    ['validator', 'pending'],
    ['validator', 'rejected'],
    ['admin', 'pending'],
    ['admin', 'rejected'],
  ])('lets a %s see a %s post', async (role, status) => {
    const post = { id: 12, user_id: 7, status };
    blogPostModel.findById.mockResolvedValue(post);

    const response = await makeRequest({
      path: '/api/blog/12',
      user: { id: 21, role },
    });

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(post);
  });

  it.each(['public', 'contributor'])('%s cannot get the moderation queue', async (role) => {
    const response = await makeRequest({
      path: '/api/blog/pending',
      user: { id: 21, role },
    });

    expect(response.status).toBe(403);
    expect(blogPostModel.findPending).not.toHaveBeenCalled();
  });

  it('requires authentication to get the moderation queue', async () => {
    const response = await makeRequest({ path: '/api/blog/pending' });

    expect(response.status).toBe(401);
    expect(blogPostModel.findPending).not.toHaveBeenCalled();
  });

  it.each(['validator', 'admin'])('%s gets a pending queue that excludes their own posts', async (role) => {
    const response = await makeRequest({
      path: '/api/blog/pending',
      user: { id: 8, role },
    });

    expect(response.status).toBe(200);
    expect(blogPostModel.findPending).toHaveBeenCalledWith({ excludeUserId: 8 });
    expect(response.body.posts).toEqual([{ id: 14, user_id: 9, status: 'pending' }]);
  });

  it.each(['public', 'contributor'])('%s cannot review a blog post', async (role) => {
    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      user: { id: 21, role },
      body: { decision: 'approved' },
    });

    expect(response.status).toBe(403);
    expect(blogPostModel.markReviewed).not.toHaveBeenCalled();
  });

  it('requires authentication to review a blog post', async () => {
    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      body: { decision: 'approved' },
    });

    expect(response.status).toBe(401);
    expect(blogPostModel.findById).not.toHaveBeenCalled();
  });

  it('blocks a reviewer from reviewing their own post', async () => {
    blogPostModel.findById.mockResolvedValue({
      id: 12,
      user_id: 8,
      status: 'pending',
    });

    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      user: { id: 8, role: 'admin' },
      body: { decision: 'approved' },
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You cannot review your own post.');
    expect(blogPostModel.markReviewed).not.toHaveBeenCalled();
    expect(editorialActionModel.create).not.toHaveBeenCalled();
  });

  it('rejects without a reason and returns 409 when approving a non-pending post', async () => {
    const rejectionResponse = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      user: { id: 21, role: 'validator' },
      body: { decision: 'rejected', reason: '  ' },
    });
    expect(rejectionResponse.status).toBe(400);

    blogPostModel.findById.mockResolvedValue({
      id: 12,
      user_id: 7,
      status: 'published',
    });
    const approvalResponse = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      user: { id: 21, role: 'validator' },
      body: { decision: 'approved' },
    });
    expect(approvalResponse.status).toBe(409);
  });

  it.each(['validator', 'admin'])('%s can approve a pending post', async (role) => {
    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/blog/12/review',
      user: { id: 21, role },
      body: { decision: 'approved' },
    });

    expect(response.status).toBe(200);
    expect(response.body.post).toMatchObject({
      id: '12',
      status: 'published',
      reviewed_by: 21,
      reviewed_at: '2026-11-15 00:00:00',
    });
  });
});
