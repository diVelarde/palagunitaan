const REQUESTABLE_ROLES = ['contributor', 'validator', 'admin'];
const NEXT_ROLE_BY_ROLE = {
  public: 'contributor',
  contributor: 'validator',
  validator: 'admin',
};

function validateRoleRequest(req, res, next) {
  const { requestedRole, qualifications, message } = req.body;
  if (!REQUESTABLE_ROLES.includes(requestedRole) || NEXT_ROLE_BY_ROLE[req.user.role] !== requestedRole) {
    return res.status(400).json({ message: `requestedRole must be one of: ${REQUESTABLE_ROLES.join(', ')}.` });
  }
  if (typeof qualifications !== 'string' || !qualifications.trim()) {
    return res.status(400).json({ message: 'Please describe your qualifications for this role.' });
  }
  if (qualifications.trim().length > 3000) {
    return res.status(400).json({ message: 'Qualifications must be 3000 characters or fewer.' });
  }
  if (message != null && (typeof message !== 'string' || message.length > 1000)) {
    return res.status(400).json({ message: 'Explanation must be 1000 characters or fewer.' });
  }
  next();
}

function validateReview(req, res, next) {
  const { decision } = req.body;
  if (!['approved', 'denied'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "approved" or "denied".' });
  }
  next();
}

module.exports = { validateRoleRequest, validateReview, REQUESTABLE_ROLES, NEXT_ROLE_BY_ROLE };