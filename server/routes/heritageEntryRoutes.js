const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateSubmission } = require('../validators/heritageEntryValidators');
const controller = require('../controllers/heritageEntryController');
const multimediaAssetRoutes = require('./multimediaAssetRoutes'); 

const router = express.Router();

router.get('/', controller.listPublished);
router.get('/mine', requireAuth, controller.listMine);
router.get('/search', controller.searchEntries);
router.get('/timeline', controller.getTimeline);
router.get('/:id', controller.getEntryById);
router.post('/:id/translate', requireAuth, requireRole('validator', 'admin'), controller.translateEntry);
router.post('/', requireAuth, validateSubmission, controller.submitEntry);
router.use('/:id/media', multimediaAssetRoutes);

module.exports = router;
