const express = require('express');
const { body, validationResult } = require('express-validator');
const CohortSession = require('../models/CohortSession');
const { ensureAuthenticated, ensureAdmin, ensureAdminOrMentor } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(ensureAuthenticated);

// Get all sessions for a cohort
router.get('/cohort/:cohortId', async (req, res) => {
  try {
    const sessions = await CohortSession.findByCohort(req.params.cohortId);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching cohort sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get sessions with attendance stats
router.get('/cohort/:cohortId/with-stats', async (req, res) => {
  try {
    const sessions = await CohortSession.getWithAttendanceStats(req.params.cohortId);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions with stats:', error);
    res.status(500).json({ error: 'Failed to fetch sessions with stats' });
  }
});

// Get single session
router.get('/:id', async (req, res) => {
  try {
    const session = await CohortSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session (admin/mentor only)
router.post('/',
  ensureAdminOrMentor,
  [
    body('cohortId').isInt({ min: 1 }),
    body('sessionName').trim().notEmpty().withMessage('Session name is required'),
    body('sessionDate').isDate().withMessage('Valid session date is required'),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
    body('location').optional().trim(),
    body('description').optional().trim(),
    body('sessionType').optional().isIn(['lecture', 'workshop', 'seminar', 'practical', 'assessment', 'other'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const session = await CohortSession.create(req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

// Update session (admin/mentor only)
router.put('/:id',
  ensureAdminOrMentor,
  [
    body('sessionName').optional().trim().notEmpty(),
    body('sessionDate').optional().isDate(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/),
    body('location').optional().trim(),
    body('description').optional().trim(),
    body('sessionType').optional().isIn(['lecture', 'workshop', 'seminar', 'practical', 'assessment', 'other']),
    body('isCompleted').optional().isBoolean(),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const session = await CohortSession.update(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }
);

// Mark session as completed (admin/mentor only)
router.post('/:id/complete',
  ensureAdminOrMentor,
  [
    body('notes').optional().trim()
  ],
  async (req, res) => {
    try {
      const session = await CohortSession.markCompleted(req.params.id, req.body.notes);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error marking session complete:', error);
      res.status(500).json({ error: 'Failed to mark session complete' });
    }
  }
);

// Delete session (admin only)
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const session = await CohortSession.delete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully', session });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
