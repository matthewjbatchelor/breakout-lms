const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
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

module.exports = router;
