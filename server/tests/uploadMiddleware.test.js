const http = require('http');
const express = require('express');

jest.mock('../services/cloudinaryService', () => ({
  MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024,
  MAX_VIDEO_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_MIME_PREFIXES: ['image/', 'audio/', 'video/'],
}));

const { uploadSingle } = require('../middleware/uploadMiddleware');

function uploadFile(app, { mimetype, size }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const boundary = 'upload-test-boundary';
      const prefix = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test"\r\nContent-Type: ${mimetype}\r\n\r\n`
      );
      const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
      const req = http.request({
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: '/upload',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': prefix.length + size + suffix.length,
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          server.closeAllConnections();
          server.close();
          try {
            resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : {} });
          } catch {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.write(prefix);
      req.write(Buffer.alloc(size));
      req.end(suffix);
    });
  });
}

function createApp() {
  const app = express();
  app.post('/upload', uploadSingle('file'), (req, res) => {
    res.json({ size: req.file.size });
  });
  return app;
}

describe('upload middleware file size limits', () => {
  it('accepts videos larger than the image and audio limit', async () => {
    const response = await uploadFile(createApp(), {
      mimetype: 'video/mp4',
      size: 16 * 1024 * 1024,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.size).toBe(16 * 1024 * 1024);
  }, 20000);

  it('keeps the 15 MB limit for audio', async () => {
    const response = await uploadFile(createApp(), {
      mimetype: 'audio/mpeg',
      size: 15 * 1024 * 1024 + 1,
    });

    expect(response.statusCode).toBe(413);
    expect(response.body.message).toContain('15 MB');
  }, 20000);
});
