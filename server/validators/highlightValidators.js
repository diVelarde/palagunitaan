function validateHighlight(req, res, next) {
  const { heritageEntryId, heritageSiteId, periodType, startsOn, endsOn } = req.body;
  const errors = [];

  const hasEntryTarget = heritageEntryId !== undefined && heritageEntryId !== null && heritageEntryId !== '';
  const hasSiteTarget = heritageSiteId !== undefined && heritageSiteId !== null && heritageSiteId !== '';
  const hasValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;
  if (
    hasEntryTarget === hasSiteTarget
    || (hasEntryTarget && !hasValidId(heritageEntryId))
    || (hasSiteTarget && !hasValidId(heritageSiteId))
  ) {
    errors.push('Provide exactly one valid heritageEntryId or heritageSiteId.');
  }
  if (!['week', 'month'].includes(periodType)) errors.push('periodType must be "week" or "month".');
  if (!startsOn || isNaN(Date.parse(startsOn))) errors.push('startsOn must be a valid date.');
  if (!endsOn || isNaN(Date.parse(endsOn))) errors.push('endsOn must be a valid date.');
  if (startsOn && endsOn && new Date(endsOn) < new Date(startsOn)) errors.push('endsOn cannot be before startsOn.');

  if (errors.length) return res.status(400).json({ message: 'Invalid highlight.', errors });
  next();
}

module.exports = { validateHighlight };