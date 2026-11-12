const express = require('express');
const http = require('http');

jest.mock('../models/roleRequestModel', () => ({
  findAllPending: jest.fn(),
  findById: jest.fn(),
  markReviewed: jest.fn(),
}));
jest.mock('../models/userModel', () => ({
  updateRole: jest.fn(),
}));
jest.mock('../services/notificationService', () => ({
  notifyRoleRequestDecision: jest.fn(),
}));

const roleRequestModel = require('../models/roleRequestModel');
const userModel = require('../models/userModel');
const notificationService = require('../services/notificationService');
const adminRoutes = require('../routes/adminRoutes');

function request({ role = 'admin', userId = 1, method = 'GET', path = '/api/admin/role-requests', body }) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: userId, role };
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/admin', adminRoutes);

    const server = app.listen(0, () => {
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request({
        host: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : undefined,
      }, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null });
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

describe('admin role request route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    roleRequestModel.findAllPending.mockResolvedValue([{ id: 3, requested_role: 'validator' }]);
    roleRequestModel.findById.mockResolvedValue({
      id: 12,
      user_id: 8,
      requested_role: 'contributor',
      status: 'pending',
    });
    roleRequestModel.markReviewed.mockResolvedValue({ id: 12, status: 'denied' });
    notificationService.notifyRoleRequestDecision.mockResolvedValue({});
  });

  it('serves the pending queue at the URL used by the client', async () => {
    await expect(request({})).resolves.toEqual({
      status: 200,
      body: { requests: [{ id: 3, requested_role: 'validator' }] },
    });
  });

  it('requires the administrator role', async () => {
    await expect(request({ role: 'contributor' })).resolves.toMatchObject({ status: 403 });
  });

  it('blocks an administrator from deciding their own request', async () => {
    roleRequestModel.findById.mockResolvedValue({
      id: 12,
      user_id: '1',
      requested_role: 'admin',
      status: 'pending',
    });

    const response = await request({
      method: 'PATCH',
      path: '/api/admin/role-requests/12',
      body: { decision: 'approved' },
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You cannot decide your own role request.');
    expect(roleRequestModel.markReviewed).not.toHaveBeenCalled();
    expect(userModel.updateRole).not.toHaveBeenCalled();
    expect(notificationService.notifyRoleRequestDecision).not.toHaveBeenCalled();
  });

  it('rejects a denial without a reason', async () => {
    const response = await request({
      method: 'PATCH',
      path: '/api/admin/role-requests/12',
      body: { decision: 'denied', reason: '   ' },
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/reason/i);
    expect(roleRequestModel.findById).not.toHaveBeenCalled();
  });

  it('requires and saves a denial reason and includes it in the notification', async () => {
    const reason = 'Please provide more evidence of the relevant experience.';
    const response = await request({
      method: 'PATCH',
      path: '/api/admin/role-requests/12',
      body: { decision: 'denied', reason },
    });

    expect(response.status).toBe(200);
    expect(roleRequestModel.markReviewed).toHaveBeenCalledWith(12, {
      status: 'denied',
      reviewedBy: 1,
      reason,
    });
    expect(notificationService.notifyRoleRequestDecision).toHaveBeenCalledWith({
      userId: 8,
      message: `Your request to become a contributor was not approved. Reason: ${reason}`,
    });
  });
});
