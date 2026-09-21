const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const adminUserRoutes = require('./adminUserRoutes');
const adminContentRoutes = require('./adminContentRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const { adminRouter: roleRequestAdminRoutes } = require('./roleRequestRoutes');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.use('/users', adminUserRoutes);
router.use('/', adminContentRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/role-requests', roleRequestAdminRoutes)

module.exports = router;
