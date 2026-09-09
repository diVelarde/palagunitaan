function validateSite(req, res, next) {
  const { name, latitude, longitude } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('name is required.');
  if (latitude === undefined || latitude === null || isNaN(latitude)) errors.push('latitude must be a number.');
  else if (latitude < -90 || latitude > 90) errors.push('latitude must be between -90 and 90.');

  if (longitude === undefined || longitude === null || isNaN(longitude)) errors.push('longitude must be a number.');
  else if (longitude < -180 || longitude > 180) errors.push('longitude must be between -180 and 180.');

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid heritage site.', errors });
  }
  next();
}

module.exports = { validateSite };
