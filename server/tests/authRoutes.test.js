const express = require('express');
const http = require('http');
const authRoutes = require('../routes/authRoutes');

function post(app, path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const request = http.request({
        host: '127.0.0.1',
        port: server.address().port,
        path,
        method: 'POST',
      }, (response) => {
        response.resume();
        response.on('end', () => {
          server.close();
          resolve(response.statusCode);
        });
      });
      request.on('error', (error) => {
        server.close();
        reject(error);
      });
      request.end();
    });
  });
}

describe('auth routes', () => {
  it('does not allow public users to upgrade through the removed endpoint', async () => {
    const user = { id: 8, role: 'public' };
    const app = express();
    app.use((req, res, next) => {
      req.user = user;
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/auth', authRoutes);

    await expect(post(app, '/api/auth/become-contributor')).resolves.toBe(404);
    expect(user.role).toBe('public');
  });
});
