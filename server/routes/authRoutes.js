const express = require('express');
const passport = require('passport');

const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  (req, res) => {
    res.redirect('http://localhost:3000');
  }
);

router.get('/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed.' });
});

router.get('/me', requireAuth, (req, res) => { 
  res.json(req.user); 
});

module.exports = router;