const { ROLE_LEVEL } = require('../services/authService');

function validateViewRole(req, res, next) {
  const { viewRole } = req.body;
  if (!viewRole || !(viewRole in ROLE_LEVEL)) {
    return res.status(400).json({
      message: 'viewRole must be one of: public, contributor, validator, admin.',
    });
  }
  next();
}

module.exports = { validateViewRole };
