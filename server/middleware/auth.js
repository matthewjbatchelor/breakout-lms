// Authentication and authorization middleware

// Ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Ensure user is an admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

// Ensure user is a mentor or admin
function ensureMentor(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'mentor')) {
    return next();
  }
  res.status(403).json({ error: 'Mentor or admin access required' });
}

// Ensure user is a participant or admin
function ensureParticipant(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'participant')) {
    return next();
  }
  res.status(403).json({ error: 'Participant access required' });
}

// Ensure user is a viewer or admin (read-only analytics access)
function ensureViewer(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'viewer')) {
    return next();
  }
  res.status(403).json({ error: 'Viewer or admin access required' });
}

// Ensure user has one of the allowed roles
function ensureRoles(allowedRoles) {
  return (req, res, next) => {
    if (req.isAuthenticated() && allowedRoles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Ensure user is accessing their own resource or is an admin
function ensureSelfOrAdmin(req, res, next) {
  const userId = parseInt(req.params.id || req.params.userId);

  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.id === userId)) {
    return next();
  }

  res.status(403).json({ error: 'Access denied' });
}

// Ensure user is accessing their own resource, is the mentor of the resource, or is an admin
function ensureSelfOrMentorOrAdmin(req, res, next) {
  const userId = parseInt(req.params.id || req.params.userId);

  if (req.isAuthenticated()) {
    if (req.user.role === 'admin' || req.user.id === userId || req.user.role === 'mentor') {
      return next();
    }
  }

  res.status(403).json({ error: 'Access denied' });
}

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureMentor,
  ensureParticipant,
  ensureViewer,
  ensureRoles,
  ensureSelfOrAdmin,
  ensureSelfOrMentorOrAdmin
};
