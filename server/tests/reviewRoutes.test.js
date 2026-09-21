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
    reviewService.reviewEntry.mockResolvedValue({
      entry: { id: '123', status: 'published' },
      action: { id: 99, actionType: 'disputed' },
    });
  });

  it('accepts a flagged review request and dispatches a disputed review', async () => {
    const reviewRoutes = require('../routes/reviewRoutes');
    const app = express();

    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: 2, role: 'validator' };
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/review', reviewRoutes);

    const response = await makeRequest(app, {
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
});
