const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { ensureAdmin, ensureMentor } = require('../middleware/auth');
const { parseCSV, validateAttendanceCSV } = require('../utils/csvParser');
const { exportAttendance } = require('../utils/csvExporter');

// Validation middleware
const validateAttendance = [
  body('cohortId').isInt().withMessage('Valid cohort ID required'),
  body('userId').isInt().withMessage('Valid user ID required'),
  body('sessionDate').isISO8601().toDate().withMessage('Valid session date required'),
  body('attendanceStatus').isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid attendance status'),
  body('sessionName').optional().trim()
];

// Get attendance by cohort
router.get('/cohort/:cohortId', ensureMentor, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const attendance = await Attendance.getWithUserDetails(cohortId);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance by user
router.get('/user/:userId', ensureMentor, async (req, res) => {
  try {
    const { userId } = req.params;
    const attendance = await Attendance.findByUser(userId);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance stats for cohort
router.get('/cohort/:cohortId/stats', ensureMentor, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const stats = await Attendance.getStatsForCohort(cohortId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

// Record attendance
router.post('/', ensureMentor, validateAttendance, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const attendanceData = {
      ...req.body,
      recordedBy: req.user.id
    };

    const attendance = await Attendance.create(attendanceData);
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Bulk record attendance
router.post('/bulk', ensureMentor, async (req, res) => {
  try {
    const { cohortId, sessionDate, sessionName, attendanceData } = req.body;

    if (!cohortId || !sessionDate || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: 'Cohort ID, session date, and attendance data array required' });
    }

    const records = await Attendance.bulkRecord(
      cohortId,
      sessionDate,
      sessionName || '',
      attendanceData,
      req.user.id
    );

    res.status(201).json({
      success: true,
      recorded: records.length,
      records
    });
  } catch (error) {
    console.error('Error bulk recording attendance:', error);
    res.status(500).json({ error: 'Failed to bulk record attendance' });
  }
});

// Import attendance from CSV
router.post('/import', ensureMentor, async (req, res) => {
  try {
    const { cohortId, csvData } = req.body;

    if (!cohortId || !csvData) {
      return res.status(400).json({ error: 'Cohort ID and CSV data required' });
    }

    // Parse CSV
    const { data } = parseCSV(csvData);

    // Validate CSV data
    const validationErrors = validateAttendanceCSV(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Import attendance records
    const results = {
      imported: 0,
      failed: 0,
      errors: []
    };

    for (const row of data) {
      try {
        // Find user by email
        const user = await User.findByEmail(row.participantEmail);

        if (!user) {
          results.failed++;
          results.errors.push(`User not found: ${row.participantEmail}`);
          continue;
        }

        // Create attendance record
        await Attendance.create({
          cohortId: cohortId,
          userId: user.id,
          sessionDate: row.sessionDate,
          sessionName: row.sessionName || '',
          attendanceStatus: row.status.toLowerCase(),
          notes: row.notes || '',
          recordedBy: req.user.id
        });

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${row.participantEmail}: ${error.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error importing attendance:', error);
    res.status(500).json({ error: 'Failed to import attendance' });
  }
});

// Export attendance to CSV
router.get('/cohort/:cohortId/export', ensureMentor, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const attendance = await Attendance.getWithUserDetails(cohortId);

    const csv = exportAttendance(attendance);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-cohort-${cohortId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
});

// Update attendance record
router.put('/:id', ensureMentor, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Attendance.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const attendance = await Attendance.update(id, req.body);
    res.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete attendance record
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Attendance.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    await Attendance.delete(id);
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

module.exports = router;
