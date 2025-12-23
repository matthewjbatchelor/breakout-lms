const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cohort = require('../models/Cohort');
const { ensureAdmin, ensureAuthenticated, ensureMentor } = require('../middleware/auth');

// Validation middleware
const validateCohort = [
  body('programmeId').isInt().withMessage('Valid programme ID required'),
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 500 }).withMessage('Name must be 500 characters or less'),
  body('description').optional().trim(),
  body('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Invalid status'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be positive')
];

// Get all cohorts
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const cohorts = await Cohort.findAll();
    res.json(cohorts);
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohorts' });
  }
});

// Get cohorts by programme
router.get('/programme/:programmeId', ensureAuthenticated, async (req, res) => {
  try {
    const { programmeId } = req.params;
    const cohorts = await Cohort.findByProgramme(programmeId);
    res.json(cohorts);
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: 'Failed to fetch cohorts' });
  }
});

// Get single cohort
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const cohort = await Cohort.findById(id);

    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    res.json(cohort);
  } catch (error) {
    console.error('Error fetching cohort:', error);
    res.status(500).json({ error: 'Failed to fetch cohort' });
  }
});

// Get cohort participants
router.get('/:id/participants', ensureMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const participants = await Cohort.getParticipants(id);
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Get cohort progress summary
router.get('/:id/progress', ensureMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await Cohort.getProgressSummary(id);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Create cohort
router.post('/', ensureAdmin, validateCohort, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const cohortData = {
      ...req.body,
      status: req.body.status || 'draft'
    };

    const cohort = await Cohort.create(cohortData);
    res.status(201).json(cohort);
  } catch (error) {
    console.error('Error creating cohort:', error);
    res.status(500).json({ error: 'Failed to create cohort' });
  }
});

// Update cohort
router.put('/:id', ensureAdmin, validateCohort, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const existing = await Cohort.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    const cohort = await Cohort.update(id, req.body);
    res.json(cohort);
  } catch (error) {
    console.error('Error updating cohort:', error);
    res.status(500).json({ error: 'Failed to update cohort' });
  }
});

// Delete cohort
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Cohort.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    await Cohort.delete(id);
    res.json({ success: true, message: 'Cohort deleted successfully' });
  } catch (error) {
    console.error('Error deleting cohort:', error);
    res.status(500).json({ error: 'Failed to delete cohort' });
  }
});

module.exports = router;
