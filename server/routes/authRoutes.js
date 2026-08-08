const express = require('express');
const passport = require('passport');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateViewRole } = require('../validators/authValidators');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/failure', session: true }),
  authController.googleCallback
);

router.get('/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed.' });
});

router.get('/me', authController.getCurrentUser);

router.post('/logout', authController.logout);

router.patch('/view-role', requireAuth, validateViewRole, authController.switchViewRole);

module.exports = router;
