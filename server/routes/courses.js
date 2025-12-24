const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const CoursePrerequisite = require('../models/CoursePrerequisite');
const { ensureAdmin, ensureAuthenticated } = require('../middleware/auth');

const validateCourse = [
  body('programmeId').isInt().withMessage('Valid programme ID required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim()
];

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/programme/:programmeId', ensureAuthenticated, async (req, res) => {
  try {
    const courses = await Course.findByProgramme(req.params.programmeId);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const course = await Course.getWithModules(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

router.post('/', ensureAdmin, validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const course = await Course.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/:id', ensureAdmin, validateCourse, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const course = await Course.update(req.params.id, req.body);
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    await Course.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Course Prerequisites Routes

// Get prerequisites for a course
router.get('/:id/prerequisites', ensureAuthenticated, async (req, res) => {
  try {
    const prerequisites = await CoursePrerequisite.getPrerequisites(req.params.id);
    res.json(prerequisites);
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    res.status(500).json({ error: 'Failed to fetch prerequisites' });
  }
});

// Get courses that depend on this course
router.get('/:id/dependents', ensureAuthenticated, async (req, res) => {
  try {
    const dependents = await CoursePrerequisite.getDependentCourses(req.params.id);
    res.json(dependents);
  } catch (error) {
    console.error('Error fetching dependent courses:', error);
    res.status(500).json({ error: 'Failed to fetch dependent courses' });
  }
});

// Check if user meets prerequisites for a course
router.get('/:id/check-prerequisites', ensureAuthenticated, async (req, res) => {
  try {
    const result = await CoursePrerequisite.checkUserPrerequisites(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    res.status(500).json({ error: 'Failed to check prerequisites' });
  }
});

// Add a prerequisite to a course (admin only)
router.post('/:id/prerequisites',
  ensureAdmin,
  [
    body('prerequisiteCourseId').isInt({ min: 1 }).withMessage('Valid prerequisite course ID required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const prerequisite = await CoursePrerequisite.create(req.params.id, req.body.prerequisiteCourseId);
      res.status(201).json(prerequisite);
    } catch (error) {
      console.error('Error adding prerequisite:', error);
      if (error.message?.includes('violates check constraint')) {
        return res.status(400).json({ error: 'A course cannot be a prerequisite of itself' });
      }
      if (error.message?.includes('duplicate key')) {
        return res.status(400).json({ error: 'This prerequisite already exists' });
      }
      res.status(500).json({ error: 'Failed to add prerequisite' });
    }
  }
);

// Remove a prerequisite from a course (admin only)
router.delete('/:id/prerequisites/:prerequisiteId', ensureAdmin, async (req, res) => {
  try {
    const deleted = await CoursePrerequisite.delete(req.params.id, req.params.prerequisiteId);
    if (!deleted) {
      return res.status(404).json({ error: 'Prerequisite relationship not found' });
    }
    res.json({ message: 'Prerequisite removed successfully' });
  } catch (error) {
    console.error('Error removing prerequisite:', error);
    res.status(500).json({ error: 'Failed to remove prerequisite' });
  }
});

module.exports = router;
