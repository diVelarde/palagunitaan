const multer = require('multer');
const {
  MAX_FILE_SIZE_BYTES,
  MAX_VIDEO_FILE_SIZE_BYTES,
  ALLOWED_MIME_PREFIXES,
} = require('../services/cloudinaryService');

const MAX_MB = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
const MAX_VIDEO_MB = Math.round(MAX_VIDEO_FILE_SIZE_BYTES / (1024 * 1024));

function uploadSingle(fieldName, { imagesOnly = false } = {}) {
  const allowed = imagesOnly ? ['image/'] : ALLOWED_MIME_PREFIXES;
  const rejectionMessage = imagesOnly
    ? 'Only image files can be uploaded.'
    : 'Only image, audio, or video files can be uploaded.';

  const instance = multer({
    storage: {
      _handleFile(req, file, cb) {
        const maxFileSizeBytes = file.mimetype.startsWith('video/')
          ? MAX_VIDEO_FILE_SIZE_BYTES
          : MAX_FILE_SIZE_BYTES;
        const chunks = [];
        let size = 0;
        let settled = false;

        file.stream.on('data', (chunk) => {
          if (settled) return;
          size += chunk.length;
          if (size > maxFileSizeBytes) {
            settled = true;
            chunks.length = 0;
            const err = new multer.MulterError('LIMIT_FILE_SIZE');
            err.maxFileSizeBytes = maxFileSizeBytes;
            cb(err);
            return;
          }
          chunks.push(chunk);
        });

        file.stream.on('error', (err) => {
          if (settled) return;
          settled = true;
          cb(err);
        });

        file.stream.on('end', () => {
          if (settled) return;
          settled = true;
          cb(null, { buffer: Buffer.concat(chunks), size });
        });
      },
      _removeFile(req, file, cb) {
        delete file.buffer;
        cb(null);
      },
    },
    limits: { fileSize: MAX_VIDEO_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      const ok = typeof file.mimetype === 'string'
        && allowed.some((prefix) => file.mimetype.startsWith(prefix));
      if (ok) return cb(null, true);
      const err = new Error(rejectionMessage);
      err.status = 400;
      return cb(err);
    },
  });

  return (req, res, next) => {
    instance.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        const maxMb = Math.round((err.maxFileSizeBytes || MAX_VIDEO_FILE_SIZE_BYTES) / (1024 * 1024));
        return res.status(413).json({ message: `File is too large. The limit is ${maxMb} MB.` });
      }
      return res.status(err.status || 400).json({ message: err.message || 'Upload failed.' });
    });
  };
}

module.exports = { uploadSingle, MAX_FILE_SIZE_BYTES, MAX_VIDEO_FILE_SIZE_BYTES, MAX_MB, MAX_VIDEO_MB };
