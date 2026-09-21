const express = require('express');
const controller = require('../controllers/auditLogController');

const router = express.Router();
router.get('/', controller.listAuditLog);

module.exports = router;