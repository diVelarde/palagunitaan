const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateBlogPost } = require('../validators/blogPostValidators');
const controller = require('../controllers/blogPostController');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', controller.listPosts);
router.get('/mine', requireAuth, controller.listMine);
router.get('/:id', controller.getPostById);
router.post('/', requireAuth, requireRole('contributor', 'validator', 'admin'), validateBlogPost, controller.createPost);

module.exports = router;