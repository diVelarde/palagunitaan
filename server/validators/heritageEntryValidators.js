function validateSubmission(req, res, next) {
  const { title, rawContent } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');

  if (!rawContent || !rawContent.trim()) errors.push('rawContent is required.');
  else if (rawContent.trim().length < 20) errors.push('rawContent must be at least 20 characters.');

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid submission.', errors });
  }
  next();
}

module.exports = { validateSubmission };
