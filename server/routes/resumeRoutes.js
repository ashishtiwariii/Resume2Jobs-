const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/resumeUpload');
const {
  uploadResume,
  structureUploadedResume,
  analyzeResume,
} = require('../controllers/resumeController');

const router = express.Router();

router.post('/upload', requireAuth, (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Resume file must be 5MB or smaller' });
    }

    return res.status(400).json({ message: error.message || 'Invalid resume upload' });
  });
}, uploadResume);

router.post('/structure', requireAuth, structureUploadedResume);
router.post('/analyze', requireAuth, analyzeResume);

module.exports = router;
