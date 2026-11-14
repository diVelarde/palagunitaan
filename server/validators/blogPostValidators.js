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

function parseIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

function validateBlogPostSearch(req, res, next) {
  const { q, author, from, to, sort } = req.query;
  const errors = [];
  if (q != null && (typeof q !== 'string' || q.length > 200)) {
    errors.push('q must be 200 characters or fewer.');
  }
  if (author != null && (typeof author !== 'string' || !author.trim() || author.trim().length > 255)) {
    errors.push('author must be a positive user id or an exact author name up to 255 characters.');
  }
  const authorValue = typeof author === 'string' ? author.trim() : '';
  const authorIsNumeric = /^\d+$/.test(authorValue);
  const authorId = authorIsNumeric ? Number(authorValue) : null;
  if (authorIsNumeric && (!Number.isSafeInteger(authorId) || authorId < 1)) {
    errors.push('author user id must be a positive integer.');
  }
  const fromDate = from == null ? undefined : parseIsoDate(from);
  const toDate = to == null ? undefined : parseIsoDate(to);
  if (from != null && !fromDate) errors.push('from must be a valid ISO date (YYYY-MM-DD).');
  if (to != null && !toDate) errors.push('to must be a valid ISO date (YYYY-MM-DD).');
  if (fromDate && toDate && fromDate > toDate) errors.push('from must not be after to.');
  if (sort != null && !['newest', 'oldest'].includes(sort)) {
    errors.push('sort must be "newest" or "oldest".');
  }

  if (errors.length) return res.status(400).json({ message: 'Invalid blog search.', errors });

  req.blogPostFilters = {};
  if (typeof q === 'string' && q.trim()) req.blogPostFilters.q = q.trim();
  if (authorId) req.blogPostFilters.authorId = authorId;
  else if (authorValue && !authorIsNumeric) req.blogPostFilters.authorName = authorValue;
  if (fromDate) req.blogPostFilters.from = fromDate;
  if (toDate) req.blogPostFilters.to = toDate;
  if (sort) req.blogPostFilters.sort = sort;
  next();
}

module.exports = { validateBlogPost, validateBlogPostSearch, parseBoolean, parseIsoDate };