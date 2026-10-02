const { CATEGORY_LIST } = require('../services/geminiService');

function validateSubmission(req, res, next) {
  const { title, rawContent, category } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');

  if (!rawContent || !rawContent.trim()) errors.push('rawContent is required.');
  else if (rawContent.trim().length < 20) errors.push('rawContent must be at least 20 characters.');

  if (category != null && category !== '') {
    const ok = CATEGORY_LIST.some((c) => c.toLowerCase() === String(category).trim().toLowerCase());
    if (!ok) errors.push(`category must be one of: ${CATEGORY_LIST.join(', ')}.`);
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid submission.', errors });
  }
  next();
}

function validateCategoryUpdate(req, res, next) {
  const { category } = req.body;
  if (!category || !CATEGORY_LIST.includes(category)) {
    return res.status(400).json({ message: `category must be one of: ${CATEGORY_LIST.join(', ')}.` });
  }
  next();
}

module.exports = { validateSubmission, validateCategoryUpdate };
