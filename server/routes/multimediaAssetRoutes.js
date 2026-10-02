const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const controller = require('../controllers/multimediaAssetController');

const router = express.Router({ mergeParams: true });

router.get('/', controller.listMedia);
router.post('/', requireAuth, uploadSingle('file'), controller.uploadMedia);

module.exports = router;
