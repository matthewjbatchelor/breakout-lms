const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { ensureAuthenticated } = require('../middleware/auth');

// Login endpoint
router.post('/login', (req, res, next) => {
  console.log('🔐 Login attempt:', { username: req.body.username, hasPassword: !!req.body.password });

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('❌ Login error:', err);
      return res.status(500).json({ error: 'An error occurred during login' });
    }

    if (!user) {
      console.log('❌ Authentication failed:', info);
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }

    console.log('✅ User authenticated:', { id: user.id, username: user.username, role: user.role });

    req.logIn(user, (err) => {
      if (err) {
        console.error('Session error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      // Return user info without sensitive data
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        }
      });
    });
  })(req, res, next);
});

// Logout endpoint
router.post('/logout', ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Failed to destroy session' });
      }

      res.clearCookie('sessionId');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// Check session status
router.get('/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatarUrl: req.user.avatarUrl
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
