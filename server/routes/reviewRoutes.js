const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateReview, validateFlag } = require('../validators/reviewValidators');
const controller = require('../controllers/reviewController');

const router = express.Router();

router.use(requireAuth, requireRole('validator', 'admin'));

router.get('/pending', controller.listPending);
router.get('/:id/history', controller.getEntryHistory);
router.post('/:id', validateReview, controller.reviewEntry);
router.post('/:id/flag', validateFlag, controller.flagEntry);

module.exports = router;