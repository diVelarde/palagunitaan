const blogPostModel = require('../models/blogPostModel');

async function listPosts(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = parseInt(req.query.offset, 10) || 0;
    res.json({ posts: await blogPostModel.findAll({ limit, offset }) });
  } catch (err) { next(err); }
}

async function getPostById(req, res, next) {
  try {
    const post = await blogPostModel.findById(req.params.id);
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
    const post = await blogPostModel.create({ userId: req.user.id, title: title.trim(), content: content.trim() });
    res.status(201).json({ post });
  } catch (err) { next(err); }
}

module.exports = { listPosts, getPostById, listMine, createPost };