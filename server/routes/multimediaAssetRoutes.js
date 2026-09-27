const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/authMiddleware');
const controller = require('../controllers/multimediaAssetController');
const { MAX_FILE_SIZE_BYTES } = require('../services/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });
const router = express.Router({ mergeParams: true });

router.get('/', controller.listMedia);
router.post('/', requireAuth, upload.single('file'), controller.uploadMedia);

module.exports = router;
