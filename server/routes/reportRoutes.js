const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  validateCreateReport,
  validateReportStatus,
  validateReportId,
} = require('../validators/contentReportValidators');
const controller = require('../controllers/contentReportController');

const router = express.Router();

router.post('/', requireAuth, validateCreateReport, controller.createReport);
router.get(
  '/',
  requireAuth,
  requireRole('validator', 'admin'),
  validateReportStatus,
  controller.listReports
);
router.patch(
  '/:id/close',
  requireAuth,
  requireRole('validator', 'admin'),
  validateReportId,
  controller.closeReport
);

module.exports = router;
