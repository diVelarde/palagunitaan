const REQUESTABLE_ROLES = ['validator', 'admin'];

function validateRoleRequest(req, res, next) {
  const { requestedRole } = req.body;
  if (!requestedRole || !REQUESTABLE_ROLES.includes(requestedRole)) {
    return res.status(400).json({ message: `requestedRole must be one of: ${REQUESTABLE_ROLES.join(', ')}.` });
  }
  const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };
  if (ROLE_LEVEL[requestedRole] <= ROLE_LEVEL[req.user.role]) {
    return res.status(400).json({ message: 'You already have this role or higher.' });
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

module.exports = { validateRoleRequest, validateReview, REQUESTABLE_ROLES };