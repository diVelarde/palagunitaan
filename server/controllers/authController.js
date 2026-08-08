const authService = require('../services/authService');

function googleCallback(req, res) {
  res.redirect(process.env.CLIENT_URL);
}

function getCurrentUser(req, res) {
  if (!req.user) {
    return res.json({ user: null, viewRole: null });
  }
  const viewRole = req.session.viewRole || req.user.role;
  const { id, name, email, avatar_url, role, created_at } = req.user;
  res.json({
    user: { id, name, email, avatarUrl: avatar_url, role, createdAt: created_at },
    viewRole,
  });
}

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out.' });
    });
  });
}

function switchViewRole(req, res) {
  const { viewRole } = req.body;
  if (!authService.canAssumeViewRole(req.user.role, viewRole)) {
    return res.status(403).json({ message: 'You cannot preview that role.' });
  }
  req.session.viewRole = viewRole;
  res.json({ viewRole });
}

module.exports = {
  googleCallback,
  getCurrentUser,
  logout,
  switchViewRole,
};
