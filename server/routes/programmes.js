const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Programme = require('../models/Programme');
const { ensureAdmin, ensureAuthenticated, ensureViewer } = require('../middleware/auth');

// Validation middleware for programme creation/update
const validateProgramme = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 500 }).withMessage('Name must be 500 characters or less'),
  body('description').optional().trim(),
  body('programmeType').optional().isIn(['breakout', 'mentoring_day', 'other'])
    .withMessage('Invalid programme type'),
  body('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Invalid status'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('thumbnailUrl').optional().trim()
];

// Get all programmes (with optional stats)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const includeStats = req.query.stats === 'true';

    const programmes = includeStats
      ? await Programme.getAllWithStats()
      : await Programme.findAll();

    res.json(programmes);
  } catch (error) {
    console.error('Error fetching programmes:', error);
    res.status(500).json({ error: 'Failed to fetch programmes' });
  }
});

// Search programmes
router.get('/search', ensureAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const programmes = await Programme.search(q);
    res.json(programmes);
  } catch (error) {
    console.error('Error searching programmes:', error);
    res.status(500).json({ error: 'Failed to search programmes' });
  }
});

// Get programmes by status
router.get('/status/:status', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.params;

    if (!['draft', 'active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const programmes = await Programme.findByStatus(status);
    res.json(programmes);
  } catch (error) {
    console.error('Error fetching programmes by status:', error);
    res.status(500).json({ error: 'Failed to fetch programmes' });
  }
});

// Get programmes by type
router.get('/type/:type', ensureAuthenticated, async (req, res) => {
  try {
    const { type } = req.params;

    if (!['breakout', 'mentoring_day', 'other'].includes(type)) {
      return res.status(400).json({ error: 'Invalid programme type' });
    }

    const programmes = await Programme.findByType(type);
    res.json(programmes);
  } catch (error) {
    console.error('Error fetching programmes by type:', error);
    res.status(500).json({ error: 'Failed to fetch programmes' });
  }
});

// Get single programme by ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const programme = await Programme.findById(id);

    if (!programme) {
      return res.status(404).json({ error: 'Programme not found' });
    }

    res.json(programme);
  } catch (error) {
    console.error('Error fetching programme:', error);
    res.status(500).json({ error: 'Failed to fetch programme' });
  }
});

// Get programme with statistics
router.get('/:id/stats', ensureViewer, async (req, res) => {
  try {
    const { id } = req.params;

    const programme = await Programme.getWithStats(id);

    if (!programme) {
      return res.status(404).json({ error: 'Programme not found' });
    }

    res.json(programme);
  } catch (error) {
    console.error('Error fetching programme stats:', error);
    res.status(500).json({ error: 'Failed to fetch programme statistics' });
  }
});

// Create new programme
router.post('/', ensureAdmin, validateProgramme, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const programmeData = {
      ...req.body,
      createdBy: req.user.id,
      status: req.body.status || 'draft'
    };

    const programme = await Programme.create(programmeData);
    res.status(201).json(programme);
  } catch (error) {
    console.error('Error creating programme:', error);
    res.status(500).json({ error: 'Failed to create programme' });
  }
});

// Update programme
router.put('/:id', ensureAdmin, validateProgramme, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if programme exists
    const existing = await Programme.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Programme not found' });
    }

    const programme = await Programme.update(id, req.body);
    res.json(programme);
  } catch (error) {
    console.error('Error updating programme:', error);
    res.status(500).json({ error: 'Failed to update programme' });
  }
});

// Delete programme
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if programme exists
    const existing = await Programme.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Programme not found' });
    }

    await Programme.delete(id);
    res.json({ success: true, message: 'Programme deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme:', error);
    res.status(500).json({ error: 'Failed to delete programme' });
  }
});

module.exports = router;
