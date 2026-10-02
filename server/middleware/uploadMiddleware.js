const multer = require('multer');
const { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_PREFIXES } = require('../services/cloudinaryService');

const MAX_MB = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));

function uploadSingle(fieldName, { imagesOnly = false } = {}) {
  const allowed = imagesOnly ? ['image/'] : ALLOWED_MIME_PREFIXES;
  const rejectionMessage = imagesOnly
    ? 'Only image files can be uploaded.'
    : 'Only image or audio files can be uploaded.';

  const instance = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
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
        return res.status(413).json({ message: `File is too large. The limit is ${MAX_MB} MB.` });
      }
      return res.status(err.status || 400).json({ message: err.message || 'Upload failed.' });
    });
  };
}

module.exports = { uploadSingle, MAX_FILE_SIZE_BYTES, MAX_MB };
