function validateBlogPost(req, res, next) {
  const { title, content } = req.body;
  const errors = [];
  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');
  if (!content || !content.trim()) errors.push('content is required.');
  if (errors.length) return res.status(400).json({ message: 'Invalid post.', errors });
  next();
}

module.exports = { validateBlogPost };