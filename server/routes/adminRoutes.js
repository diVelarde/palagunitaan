const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const adminUserRoutes = require('./adminUserRoutes');
const adminContentRoutes = require('./adminContentRoutes');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.use('/users', adminUserRoutes);
router.use('/', adminContentRoutes);

module.exports = router;
