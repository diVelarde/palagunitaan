const { getCloudinary } = require('../config/cloudinary');

const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function isAllowedMimeType(mimetype) {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimetype.startsWith(prefix));
}

function resourceTypeFor(mimetype) {
  return mimetype.startsWith('image/') ? 'image' : 'video';
}

function uploadBuffer(buffer, { mimetype, folder = 'palagunitaan' }) {
  return new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream({ folder, resource_type: resourceTypeFor(mimetype) }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer, isAllowedMimeType, resourceTypeFor, ALLOWED_MIME_PREFIXES, MAX_FILE_SIZE_BYTES };
