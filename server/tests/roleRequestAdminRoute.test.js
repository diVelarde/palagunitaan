const express = require('express');
const http = require('http');

jest.mock('../controllers/roleRequestController', () => ({
  createRequest: jest.fn(),
  getMyRequest: jest.fn(),
  listPending: jest.fn((req, res) => res.json({ requests: [{ id: 3, requested_role: 'validator' }] })),
  reviewRequest: jest.fn(),
}));

const adminRoutes = require('../routes/adminRoutes');

function getRequests(role) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { id: 1, role };
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/admin', adminRoutes);

    const server = app.listen(0, () => {
      const request = http.get({
        host: '127.0.0.1',
        port: server.address().port,
        path: '/api/admin/role-requests',
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        });
      });
      request.on('error', (err) => {
        server.close();
        reject(err);
      });
    });
  });
}

describe('admin role request route', () => {
  it('serves the pending queue at the URL used by the client', async () => {
    await expect(getRequests('admin')).resolves.toEqual({
      status: 200,
      body: { requests: [{ id: 3, requested_role: 'validator' }] },
    });
  });

  it('requires the administrator role', async () => {
    await expect(getRequests('contributor')).resolves.toMatchObject({ status: 403 });
  });
});
