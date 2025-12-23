const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { ensureViewer } = require('../middleware/auth');

// Dashboard overview
router.get('/dashboard', ensureViewer, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM programmes) as total_programmes,
        (SELECT COUNT(*) FROM cohorts WHERE status = 'active') as active_cohorts,
        (SELECT COUNT(*) FROM users WHERE role = 'participant') as total_participants,
        (SELECT COUNT(*) FROM enrollments WHERE enrollment_status = 'completed') as completed_enrollments,
        (SELECT AVG(completion_percentage) FROM enrollments) as avg_completion_rate
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Programme stats
router.get('/programme/:id', ensureViewer, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        p.*,
        COUNT(DISTINCT c.id) as cohort_count,
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN e.enrollment_status = 'completed' THEN e.id END) as completed_count,
        AVG(e.completion_percentage) as avg_completion
      FROM programmes p
      LEFT JOIN cohorts c ON c.programme_id = p.id
      LEFT JOIN enrollments e ON e.cohort_id = c.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [req.params.id]);

    if (!stats.rows[0]) {
      return res.status(404).json({ error: 'Programme not found' });
    }

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching programme stats:', error);
    res.status(500).json({ error: 'Failed to fetch programme statistics' });
  }
});

module.exports = router;
