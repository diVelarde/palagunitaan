const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const controller = require('../controllers/notificationController');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.listMine);
router.get('/unread-count', controller.unreadCount);
router.patch('/:id/read', controller.markRead);

module.exports = router;
