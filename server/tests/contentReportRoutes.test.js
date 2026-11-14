const express = require('express');
const http = require('http');

jest.mock('../models/contentReportModel', () => ({
  findById: jest.fn(),
  findOpenDuplicate: jest.fn(),
  create: jest.fn(),
  findByStatus: jest.fn(),
  close: jest.fn(),
}));

const contentReportModel = require('../models/contentReportModel');
const reportRoutes = require('../routes/reportRoutes');

function makeRequest({ method = 'GET', path = '/api/reports?status=open', user, body } = {}) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      if (user) req.user = user;
      req.isAuthenticated = () => Boolean(user);
      next();
    });
    app.use('/api/reports', reportRoutes);

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

describe('content report routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contentReportModel.findOpenDuplicate.mockResolvedValue(null);
    contentReportModel.create.mockResolvedValue({ id: 1, status: 'open' });
    contentReportModel.findByStatus.mockResolvedValue([{ id: 1, status: 'open' }]);
    contentReportModel.close.mockResolvedValue({ id: 1, status: 'closed' });
  });

  it('allows a signed-in public user to submit a valid report', async () => {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/reports',
      user: { id: 9, role: 'public' },
      body: {
        targetType: 'entry',
        targetId: 14,
        reason: 'Wrong information',
        message: 'This attribution conflicts with the cited source.',
      },
    });

    expect(response.status).toBe(201);
    expect(contentReportModel.create).toHaveBeenCalledWith({
      reporterId: 9,
      targetType: 'entry',
      targetId: 14,
      reason: 'Wrong information',
      message: 'This attribution conflicts with the cited source.',
    });
  });

  it('requires authentication to submit reports', async () => {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/reports',
      body: { targetType: 'entry', targetId: 14, reason: 'Other' },
    });
    expect(response.status).toBe(401);
  });

  it('rejects a duplicate open report from the same user for the same target', async () => {
    contentReportModel.findOpenDuplicate.mockResolvedValue({ id: 7 });

    const response = await makeRequest({
      method: 'POST',
      path: '/api/reports',
      user: { id: 9, role: 'public' },
      body: { targetType: 'blog_post', targetId: 14, reason: 'Other' },
    });

    expect(response.status).toBe(409);
    expect(contentReportModel.create).not.toHaveBeenCalled();
  });

  it.each(['public', 'contributor'])('%s cannot list open reports', async (role) => {
    const response = await makeRequest({ user: { id: 9, role } });
    expect(response.status).toBe(403);
    expect(contentReportModel.findByStatus).not.toHaveBeenCalled();
  });

  it('requires authentication to list open reports', async () => {
    const response = await makeRequest();
    expect(response.status).toBe(401);
    expect(contentReportModel.findByStatus).not.toHaveBeenCalled();
  });

  it.each(['validator', 'admin'])('%s can list reports filtered by status', async (role) => {
    const response = await makeRequest({ user: { id: 9, role } });
    expect(response.status).toBe(200);
    expect(contentReportModel.findByStatus).toHaveBeenCalledWith('open');
    expect(response.body.reports).toEqual([{ id: 1, status: 'open' }]);
  });

  it.each(['public', 'contributor'])('%s cannot close a report', async (role) => {
    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/reports/1/close',
      user: { id: 9, role },
    });
    expect(response.status).toBe(403);
    expect(contentReportModel.close).not.toHaveBeenCalled();
  });

  it('requires authentication to close a report', async () => {
    const response = await makeRequest({ method: 'PATCH', path: '/api/reports/1/close' });
    expect(response.status).toBe(401);
    expect(contentReportModel.close).not.toHaveBeenCalled();
  });

  it.each(['validator', 'admin'])('%s can close an open report', async (role) => {
    const response = await makeRequest({
      method: 'PATCH',
      path: '/api/reports/1/close',
      user: { id: 9, role },
    });
    expect(response.status).toBe(200);
    expect(contentReportModel.close).toHaveBeenCalledWith('1');
    expect(response.body.report.status).toBe('closed');
  });
});
