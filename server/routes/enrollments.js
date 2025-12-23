const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { ensureAdmin, ensureMentor } = require('../middleware/auth');
const { parseCSV, validateParticipantsCSV } = require('../utils/csvParser');
const { exportParticipants } = require('../utils/csvExporter');

// Validation middleware
const validateEnrollment = [
  body('cohortId').isInt().withMessage('Valid cohort ID required'),
  body('userId').isInt().withMessage('Valid user ID required'),
  body('enrollmentStatus').optional().isIn(['enrolled', 'in_progress', 'completed', 'dropped', 'waitlist'])
    .withMessage('Invalid enrollment status')
];

// Get all enrollments
router.get('/', ensureMentor, async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll();
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get enrollments by cohort
router.get('/cohort/:cohortId', ensureMentor, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const enrollments = await Enrollment.getWithUserDetails(cohortId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get enrollments by user
router.get('/user/:userId', ensureMentor, async (req, res) => {
  try {
    const { userId } = req.params;
    const enrollments = await Enrollment.findByUser(userId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get single enrollment
router.get('/:id', ensureMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Create enrollment
router.post('/', ensureAdmin, validateEnrollment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrollmentData = {
      ...req.body,
      enrollmentStatus: req.body.enrollmentStatus || 'enrolled'
    };

    const enrollment = await Enrollment.create(enrollmentData);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating enrollment:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'User already enrolled in this cohort' });
    }

    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

// Bulk enroll participants
router.post('/bulk', ensureAdmin, async (req, res) => {
  try {
    const { cohortId, userIds } = req.body;

    if (!cohortId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Cohort ID and user IDs array required' });
    }

    const enrollments = await Enrollment.bulkEnroll(cohortId, userIds);

    res.status(201).json({
      success: true,
      enrolled: enrollments.length,
      enrollments
    });
  } catch (error) {
    console.error('Error bulk enrolling:', error);
    res.status(500).json({ error: 'Failed to bulk enroll participants' });
  }
});

// Import participants from CSV
router.post('/import', ensureAdmin, async (req, res) => {
  try {
    const { cohortId, csvData } = req.body;

    if (!cohortId || !csvData) {
      return res.status(400).json({ error: 'Cohort ID and CSV data required' });
    }

    // Parse CSV
    const { data } = parseCSV(csvData);

    // Validate CSV data
    const validationErrors = validateParticipantsCSV(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Create or find users and enroll them
    const results = {
      imported: 0,
      failed: 0,
      errors: []
    };

    const userIds = [];

    for (const row of data) {
      try {
        // Check if user exists
        let user = await User.findByEmail(row.email);

        // Create user if doesn't exist
        if (!user) {
          user = await User.create({
            username: row.email,
            email: row.email,
            password: Math.random().toString(36).slice(-8), // Temp password
            role: 'participant',
            firstName: row.firstName,
            lastName: row.lastName
          });
        }

        userIds.push(user.id);
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${row.email}: ${error.message}`);
      }
    }

    // Bulk enroll all users
    if (userIds.length > 0) {
      await Enrollment.bulkEnroll(cohortId, userIds);
    }

    res.json(results);
  } catch (error) {
    console.error('Error importing participants:', error);
    res.status(500).json({ error: 'Failed to import participants' });
  }
});

// Export participants to CSV
router.get('/cohort/:cohortId/export', ensureMentor, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const enrollments = await Enrollment.getWithUserDetails(cohortId);

    const csv = exportParticipants(enrollments);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants-cohort-${cohortId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting participants:', error);
    res.status(500).json({ error: 'Failed to export participants' });
  }
});

// Update enrollment
router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Enrollment.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const enrollment = await Enrollment.update(id, req.body);
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// Delete enrollment
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Enrollment.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await Enrollment.delete(id);
    res.json({ success: true, message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

module.exports = router;
