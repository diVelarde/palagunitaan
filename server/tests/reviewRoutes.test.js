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
  findById: jest.fn(),
}));
jest.mock('../models/editorialActionModel', () => ({
  findByEntry: jest.fn(),
}));
jest.mock('../models/claimAssessmentModel', () => ({
  findByEntryId: jest.fn(),
}));

const heritageEntryModel = require('../models/heritageEntryModel');
const editorialActionModel = require('../models/editorialActionModel');
const claimAssessmentModel = require('../models/claimAssessmentModel');

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
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [] });
    editorialActionModel.findByEntry.mockResolvedValue([]);
    claimAssessmentModel.findByEntryId.mockResolvedValue([]);
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

  it('accepts approved_unverified as a valid review decision', async () => {
    const response = await makeRequest(createApp(), {
      method: 'POST',
      path: '/api/review/123',
      body: { decision: 'approved_unverified' },
    });

    expect(reviewService.reviewEntry).toHaveBeenCalledWith({
      entryId: '123',
      validatorId: 2,
      decision: 'approved_unverified',
      comment: undefined,
    });
    expect(response.statusCode).toBe(200);
  });

  it('forwards well-formed claim assessments to the review service', async () => {
    heritageEntryModel.findById.mockResolvedValue({ history_claims: [{ id: 31 }] });
    const assessments = [{
      historyClaimId: 31,
      sourceTypeFit: 'met',
      sourceCredibility: 'partly',
      corroboration: 'met',
      claimedYearSupported: 'not_met',
      notes: 'A second account supports the source type.',
    }];

    const response = await makeRequest(createApp(), {
      method: 'POST',
      path: '/api/review/123',
      body: { decision: 'approved', assessments },
    });

    expect(response.statusCode).toBe(200);
    expect(reviewService.reviewEntry).toHaveBeenCalledWith(expect.objectContaining({
      entryId: '123',
      validatorId: 2,
      decision: 'approved',
      assessments,
    }));
  });

  it('returns claim assessments with entry review history', async () => {
    const history = [{ id: 8, action_type: 'approved' }];
    const assessments = [{ id: 9, history_claim_id: 31, source_type_fit: 'met' }];
    editorialActionModel.findByEntry.mockResolvedValue(history);
    claimAssessmentModel.findByEntryId.mockResolvedValue(assessments);

    const response = await makeRequest(createApp(), {
      method: 'GET',
      path: '/api/review/123/history',
    });

    expect(editorialActionModel.findByEntry).toHaveBeenCalledWith('123');
    expect(claimAssessmentModel.findByEntryId).toHaveBeenCalledWith('123');
    expect(response.body).toEqual({ history, assessments });
  });

  it('still rejects an unsupported review decision', async () => {
    const response = await makeRequest(createApp(), {
      method: 'POST',
      path: '/api/review/123',
      body: { decision: 'maybe' },
    });

    expect(reviewService.reviewEntry).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid review.');
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

  it('returns 403 when an administrator tries to review their own entry', async () => {
    reviewService.reviewEntry.mockRejectedValue(
      new reviewService.ReviewError('You cannot review your own submission.', 403)
    );

    const response = await makeRequest(createApp({ id: 7, role: 'admin' }), {
      method: 'POST',
      path: '/api/review/123',
      body: { decision: 'approved' },
    });

    expect(reviewService.reviewEntry).toHaveBeenCalledWith({
      entryId: '123',
      validatorId: 7,
      decision: 'approved',
      comment: undefined,
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
