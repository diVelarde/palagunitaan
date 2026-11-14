const blogPostModel = require('../models/blogPostModel');
const cloudinaryService = require('../services/cloudinaryService');

async function listPosts(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    const viewer = req.user ? { userId: req.user.id, role: req.user.role } : undefined;
    const posts = viewer
      ? await blogPostModel.findAll({ limit, offset }, viewer)
      : await blogPostModel.findAll({ limit, offset });
    res.json({ posts });
  } catch (err) { next(err); }
}

async function getPostById(req, res, next) {
  try {
    await blogPostModel.incrementViewCount(req.params.id);
    const viewer = req.user ? { userId: req.user.id, role: req.user.role } : undefined;
    const post = viewer
      ? await blogPostModel.findById(req.params.id, viewer)
      : await blogPostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ post });
  } catch (err) { next(err); }
}

async function listMine(req, res, next) {
  try { res.json({ posts: await blogPostModel.findByUser(req.user.id) }); } catch (err) { next(err); }
}

async function createPost(req, res, next) {
  try {
    const { title, content } = req.body;
    let coverImageUrl = null;
    if (req.file) {
      const uploaded = await cloudinaryService.uploadBuffer(req.file.buffer, {
        mimetype: req.file.mimetype,
        folder: 'palagunitaan/blog-covers',
      });
      coverImageUrl = uploaded.secure_url;
    }
    const post = await blogPostModel.create({
      userId: req.user.id,
      title: title.trim(),
      content: content.trim(),
      coverImageUrl,
    });
    res.status(201).json({ post, message: 'Your post is waiting for review' });
  } catch (err) { next(err); }
}

module.exports = { listPosts, getPostById, listMine, createPost };