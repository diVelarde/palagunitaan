const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateHighlight } = require('../validators/highlightValidators');
const controller = require('../controllers/highlightController');

const router = express.Router();

router.get('/current', controller.getCurrent);
router.get('/history', requireAuth, requireRole('admin'), controller.getHistory);
router.post('/', requireAuth, requireRole('admin'), validateHighlight, controller.createHighlight);

module.exports = router;