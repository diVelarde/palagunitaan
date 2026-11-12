const http = require('http');
const express = require('express');

const reviewService = require('../services/reviewService');

jest.mock('../services/reviewService', () => ({
  reviewEntry: jest.fn(),
  ReviewError: class ReviewError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));
jest.mock('../models/heritageEntryModel', () => ({
  findPending: jest.fn(),
}));

const heritageEntryModel = require('../models/heritageEntryModel');

function makeRequest(app, { method, path, body }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request({
        host: '127.0.0.1',
        port,
        path,
        method,
        headers: payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : undefined,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          try {
            resolve({
              statusCode: res.statusCode,
              body: data ? JSON.parse(data) : {},
            });
          } catch (error) {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      });

      req.on('error', (error) => {
        server.close();
        reject(error);
      });

      if (payload) req.write(payload);
      req.end();
    });
  });
}

describe('review routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    heritageEntryModel.findPending.mockResolvedValue([]);
    reviewService.reviewEntry.mockResolvedValue({
      entry: { id: '123', status: 'published' },
      action: { id: 99, actionType: 'disputed' },
    });
  });

  function createApp(user = { id: 2, role: 'validator' }) {
    const reviewRoutes = require('../routes/reviewRoutes');
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = user;
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/review', reviewRoutes);
    return app;
  }

  it('accepts a flagged review request and dispatches a disputed review', async () => {
    const response = await makeRequest(createApp(), {
      method: 'POST',
      path: '/api/review/123/flag',
      body: { comment: 'needs a second source' },
    });

    expect(reviewService.reviewEntry).toHaveBeenCalledWith({
      entryId: '123',
      validatorId: 2,
      decision: 'disputed',
      comment: 'needs a second source',
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.entry.id).toBe('123');
    expect(response.body.action.actionType).toBe('disputed');
  });

  it('returns 403 when an entry author tries to review their own entry', async () => {
    reviewService.reviewEntry.mockRejectedValue(
      new reviewService.ReviewError('You cannot review your own submission.', 403)
    );

    const response = await makeRequest(createApp({ id: 7, role: 'validator' }), {
      method: 'POST',
      path: '/api/review/123',
      body: { decision: 'approved' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('You cannot review your own submission.');
  });

  it('does not include the validator’s own pending entry in the queue', async () => {
    heritageEntryModel.findPending.mockImplementation(async ({ excludeUserId }) => [
      { id: 1, user_id: 7 },
      { id: 2, user_id: 8 },
    ].filter((entry) => entry.user_id !== excludeUserId));

    const response = await makeRequest(createApp({ id: 7, role: 'validator' }), {
      method: 'GET',
      path: '/api/review/pending',
    });

    expect(heritageEntryModel.findPending).toHaveBeenCalledWith({ excludeUserId: 7 });
    expect(response.statusCode).toBe(200);
    expect(response.body.entries).toEqual([{ id: 2, user_id: 8 }]);
  });

  it('returns 403 when an entry author tries to flag their own entry', async () => {
    reviewService.reviewEntry.mockRejectedValue(
      new reviewService.ReviewError('You cannot review your own submission.', 403)
    );

    const response = await makeRequest(createApp({ id: 7, role: 'validator' }), {
      method: 'POST',
      path: '/api/review/123/flag',
      body: { comment: 'needs a second source' },
    });

    expect(reviewService.reviewEntry).toHaveBeenCalledWith({
      entryId: '123',
      validatorId: 7,
      decision: 'disputed',
      comment: 'needs a second source',
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('You cannot review your own submission.');
  });
});
