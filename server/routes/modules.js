const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Module = require('../models/Module');
const ModuleResource = require('../models/ModuleResource');
const { ensureAdmin, ensureAuthenticated } = require('../middleware/auth');

const validateModule = [
  body('courseId').isInt().withMessage('Valid course ID required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('contentType').isIn(['text', 'video', 'document', 'quiz', 'discussion', 'assignment'])
];

router.get('/course/:courseId', ensureAuthenticated, async (req, res) => {
  try {
    const modules = await Module.findByCourse(req.params.courseId);
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const module = await Module.getWithResources(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

router.post('/', ensureAdmin, validateModule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const module = await Module.create(req.body);
    res.status(201).json(module);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const module = await Module.update(req.params.id, req.body);
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    await Module.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

router.get('/:id/resources', ensureAuthenticated, async (req, res) => {
  try {
    const resources = await ModuleResource.findByModule(req.params.id);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.post('/:id/resources', ensureAdmin, async (req, res) => {
  try {
    const resource = await ModuleResource.create({ ...req.body, moduleId: req.params.id });
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

module.exports = router;
