const { CATEGORY_LIST } = require('../services/geminiService');

function validateSubmission(req, res, next) {
  const { title, rawContent, category, regionId, latitude, longitude } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');

  if (!rawContent || !rawContent.trim()) errors.push('rawContent is required.');
  else if (rawContent.trim().length < 20) errors.push('rawContent must be at least 20 characters.');

  if (category != null && category !== '') {
    const ok = CATEGORY_LIST.some((c) => c.toLowerCase() === String(category).trim().toLowerCase());
    if (!ok) errors.push(`category must be one of: ${CATEGORY_LIST.join(', ')}.`);
  }

  if (regionId != null && regionId !== '' && (!Number.isInteger(Number(regionId)) || Number(regionId) < 1)) {
    errors.push('regionId must be a positive integer.');
  }

  if ((latitude == null || latitude === '') !== (longitude == null || longitude === '')) {
    errors.push('latitude and longitude must be provided together.');
  } else if (latitude != null && latitude !== '' && longitude != null && longitude !== '') {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push('latitude must be between -90 and 90.');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.push('longitude must be between -180 and 180.');
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
