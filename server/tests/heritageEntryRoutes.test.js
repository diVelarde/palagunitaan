const http = require('http');
const express = require('express');

jest.mock('../controllers/heritageEntryController', () => {
  const respond = (req, res) => res.json({});
  return {
    listPublished: jest.fn(respond),
    listMine: jest.fn(respond),
    searchEntries: jest.fn(respond),
    getTimeline: jest.fn(respond),
    getEntryById: jest.fn(respond),
    translateEntry: jest.fn(respond),
    submitEntry: jest.fn((req, res) => res.status(201).json({ submitted: true })),
    updateCoverImage: jest.fn(respond),
    enrichEntry: jest.fn(respond),
    setCategory: jest.fn(respond),
  };
});

const heritageEntryController = require('../controllers/heritageEntryController');

function makeRequest(app, role) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const payload = JSON.stringify({
        title: 'A remembered story',
        rawContent: 'This is a community story with enough detail to submit.',
      });
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: '/api/heritage-entries',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          server.close();
          resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : {} });
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.write(payload);
      req.end();
    });
  });
}

describe('heritage entry submission route', () => {
  function createApp(role) {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: 7, role };
      req.isAuthenticated = () => true;
      next();
    });
    app.use('/api/heritage-entries', require('../routes/heritageEntryRoutes'));
    return app;
  }

  beforeEach(() => jest.clearAllMocks());

  it('rejects public accounts and does not reach submission handling', async () => {
    const response = await makeRequest(createApp('public'));

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toMatch(/permission/i);
    expect(heritageEntryController.submitEntry).not.toHaveBeenCalled();
  });

  it('allows contributor roles to submit valid entries', async () => {
    const response = await makeRequest(createApp('contributor'));

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ submitted: true });
    expect(heritageEntryController.submitEntry).toHaveBeenCalledTimes(1);
  });
});
