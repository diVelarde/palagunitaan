const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { validateSite } = require('../validators/heritageSiteValidators');
const controller = require('../controllers/heritageSiteController');

const router = express.Router();

router.get('/', controller.list);
router.post('/', requireAuth, requireRole('admin'), uploadSingle('photo', { imagesOnly: true }), validateSite, controller.create);
router.put('/:id', requireAuth, requireRole('admin'), validateSite, controller.update);
router.delete('/:id', requireAuth, requireRole('admin'), controller.remove);

module.exports = router;
