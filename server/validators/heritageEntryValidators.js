const { CATEGORY_LIST } = require('../services/geminiService');
const categoryModel = require('../models/categoryModel');

function isValidYear(value) {
  return (typeof value === 'number' || (typeof value === 'string' && /^\d{1,4}$/.test(value)))
    && Number.isInteger(Number(value))
    && Number(value) >= 1
    && Number(value) <= 9999;
}

async function validateSubmission(req, res, next) {
  const { title, rawContent, category, regionId, latitude, longitude, historyClaims } = req.body;
  const errors = [];

  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');

  if (!rawContent || !rawContent.trim()) errors.push('rawContent is required.');
  else if (rawContent.trim().length < 20) errors.push('rawContent must be at least 20 characters.');

  if (category != null && category !== '') {
    const configured = await categoryModel.findAllCategories();
    const allowed = [...CATEGORY_LIST, ...configured.map((item) => item.name)];
    const ok = allowed.some((c) => c.toLowerCase() === String(category).trim().toLowerCase());
    if (!ok) errors.push(`category must be one of: ${allowed.join(', ')}.`);
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

  if (historyClaims != null && !Array.isArray(historyClaims)) {
    errors.push('historyClaims must be an array.');
  } else if (historyClaims && historyClaims.length > 20) {
    errors.push('historyClaims cannot contain more than 20 claims.');
  } else if (historyClaims) {
    historyClaims.forEach((claim, index) => {
      if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
        errors.push(`historyClaims[${index}] must be an object.`);
        return;
      }
      const prefix = `historyClaims[${index}]`;
      if (!isValidYear(claim.claimedYear)) {
        errors.push(`${prefix}.claimedYear must be a year between 1 and 9999.`);
      }
      if (typeof claim.sourceDescription !== 'string' || !claim.sourceDescription.trim()) {
        errors.push(`${prefix}.sourceDescription is required.`);
      } else if (String(claim.sourceDescription).length > 1000) {
        errors.push(`${prefix}.sourceDescription must be 1000 characters or fewer.`);
      }
      if (claim.sourceType != null && (typeof claim.sourceType !== 'string' || claim.sourceType.length > 100)) {
        errors.push(`${prefix}.sourceType must be 100 characters or fewer.`);
      }
      if (claim.sourceYear != null && claim.sourceYear !== '') {
        if (!isValidYear(claim.sourceYear)) {
          errors.push(`${prefix}.sourceYear must be a year between 1 and 9999.`);
        }
      }
      if (claim.sourceUrl != null && claim.sourceUrl !== '') {
        try {
          if (typeof claim.sourceUrl !== 'string') throw new Error('Source URL must be text');
          const url = new URL(claim.sourceUrl);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
        } catch {
          errors.push(`${prefix}.sourceUrl must be a valid HTTP or HTTPS URL.`);
        }
      }
    });
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid submission.', errors });
  }
  next();
}

async function validateCategoryUpdate(req, res, next) {
  const { category } = req.body;
  const configured = await categoryModel.findAllCategories();
  const allowed = [...CATEGORY_LIST, ...configured.map((item) => item.name)];
  if (!category || !allowed.includes(category)) {
    return res.status(400).json({ message: `category must be one of: ${allowed.join(', ')}.` });
  }
  next();
}

module.exports = { validateSubmission, validateCategoryUpdate };
