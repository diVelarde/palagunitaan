function parseBoolean(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function validateBlogPost(req, res, next) {
  const { title, content, mentions_people: rawMentionsPeople, consent_confirmed: rawConsentConfirmed } = req.body;
  const errors = [];
  if (!title || !title.trim()) errors.push('title is required.');
  else if (title.length > 255) errors.push('title must be 255 characters or fewer.');
  if (!content || !content.trim()) errors.push('content is required.');
  const mentionsPeople = rawMentionsPeople == null ? false : parseBoolean(rawMentionsPeople);
  if (mentionsPeople === undefined) errors.push('mentions_people must be true or false.');
  const consentConfirmed = parseBoolean(rawConsentConfirmed);
  if (consentConfirmed !== true) errors.push('consent_confirmed must be true.');
  if (errors.length) return res.status(400).json({ message: 'Invalid post.', errors });
  req.blogPostConsent = { mentionsPeople, consentConfirmed };
  next();
}

module.exports = { validateBlogPost, parseBoolean };