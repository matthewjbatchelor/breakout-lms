const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Configure Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },
  async (username, password, done) => {
    try {
      // Find user by username (returns row with password_hash)
      const user = await User.findByUsername(username);

      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Check if user is active
      if (!user.is_active) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Verify password
      const isValid = await User.verifyPassword(password, user.password_hash);

      if (!isValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Update last login timestamp
      await User.updateLastLogin(user.id);

      // Return user without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user to session (store only user ID)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (fetch full user from database)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
