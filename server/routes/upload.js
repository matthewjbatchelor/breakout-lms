const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { ensureAdmin, ensureAuthenticated } = require('../middleware/auth');

// Upload avatar
router.post('/avatar', ensureAuthenticated, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Upload course thumbnail
router.post('/course-thumbnail', ensureAdmin, upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/course-thumbnails/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Upload module resource
router.post('/module-resource', ensureAdmin, upload.single('resource'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/module-resources/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

module.exports = router;
