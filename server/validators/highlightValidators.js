function validateHighlight(req, res, next) {
  const { heritageEntryId, periodType, startsOn, endsOn } = req.body;
  const errors = [];

  if (!heritageEntryId) errors.push('heritageEntryId is required.');
  if (!['week', 'month'].includes(periodType)) errors.push('periodType must be "week" or "month".');
  if (!startsOn || isNaN(Date.parse(startsOn))) errors.push('startsOn must be a valid date.');
  if (!endsOn || isNaN(Date.parse(endsOn))) errors.push('endsOn must be a valid date.');
  if (startsOn && endsOn && new Date(endsOn) < new Date(startsOn)) errors.push('endsOn cannot be before startsOn.');

  if (errors.length) return res.status(400).json({ message: 'Invalid highlight.', errors });
  next();
}

module.exports = { validateHighlight };