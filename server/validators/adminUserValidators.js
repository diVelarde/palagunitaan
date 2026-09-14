const VALID_ROLES = ['public', 'contributor', 'validator', 'admin'];

function validateRoleUpdate(req, res, next) {
  const { role } = req.body;
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}.` });
  }
  next();
}

module.exports = { validateRoleUpdate, VALID_ROLES };
