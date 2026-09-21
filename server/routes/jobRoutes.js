const express = require('express');
const requireAuth = require('../middleware/auth');
const { matchJobs } = require('../controllers/jobController');

const router = express.Router();

router.post('/match', requireAuth, matchJobs);

module.exports = router;
