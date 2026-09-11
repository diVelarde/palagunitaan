const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateSubmission } = require('../validators/heritageEntryValidators');
const controller = require('../controllers/heritageEntryController');

const router = express.Router();

router.get('/', controller.listPublished);
router.get('/mine', requireAuth, controller.listMine);
router.get('/search', controller.searchEntries);
router.get('/:id', controller.getEntryById);
router.post('/', requireAuth, validateSubmission, controller.submitEntry);

module.exports = router;
