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
      console.log('🔍 Passport: Looking up user:', username);

      // Find user by username (returns row with password_hash)
      const user = await User.findByUsername(username);

      if (!user) {
        console.log('❌ Passport: User not found:', username);
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log('✅ Passport: User found:', { id: user.id, username: user.username, isActive: user.is_active });

      // Check if user is active
      if (!user.is_active) {
        console.log('❌ Passport: User is inactive');
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Verify password
      console.log('🔑 Passport: Verifying password...');
      const isValid = await User.verifyPassword(password, user.password_hash);

      if (!isValid) {
        console.log('❌ Passport: Invalid password');
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log('✅ Passport: Password verified');

      // Update last login timestamp
      await User.updateLastLogin(user.id);

      // Return user without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      console.error('❌ Passport error:', error);
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
