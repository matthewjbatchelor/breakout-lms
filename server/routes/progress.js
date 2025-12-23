const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { ensureAuthenticated, ensureMentor } = require('../middleware/auth');

// Get user's progress
router.get('/user/:userId', ensureMentor, async (req, res) => {
  try {
    const progress = await Progress.findByUser(req.params.userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get progress summary for user
router.get('/user/:userId/summary', ensureMentor, async (req, res) => {
  try {
    const summary = await Progress.getUserProgressSummary(req.params.userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching progress summary:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Mark module as started
router.post('/module/:moduleId/start', ensureAuthenticated, async (req, res) => {
  try {
    const progress = await Progress.markModuleStarted(req.user.id, req.params.moduleId);
    res.json(progress);
  } catch (error) {
    console.error('Error marking module started:', error);
    res.status(500).json({ error: 'Failed to mark module as started' });
  }
});

// Mark module as completed
router.post('/module/:moduleId/complete', ensureAuthenticated, async (req, res) => {
  try {
    const progress = await Progress.markModuleCompleted(req.user.id, req.params.moduleId);
    res.json(progress);
  } catch (error) {
    console.error('Error marking module completed:', error);
    res.status(500).json({ error: 'Failed to mark module as completed' });
  }
});

module.exports = router;
