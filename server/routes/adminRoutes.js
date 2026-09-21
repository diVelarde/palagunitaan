const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const adminUserRoutes = require('./adminUserRoutes');
const adminContentRoutes = require('./adminContentRoutes');
const auditLogRoutes = require('./auditLogRoutes');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.use('/users', adminUserRoutes);
router.use('/', adminContentRoutes);
router.use('/audit-log', auditLogRoutes);

module.exports = router;
