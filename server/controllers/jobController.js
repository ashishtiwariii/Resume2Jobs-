const Resume = require('../models/Resume');
const { matchJobsForResume } = require('../services/jobService');

async function matchJobs(req, res) {
  const { resumeId } = req.body;

  if (!resumeId) {
    return res.status(400).json({ message: 'resumeId is required' });
  }

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const jobs = await matchJobsForResume(resume);
    return res.json({ jobs });
  } catch (error) {
    console.error('Job matching error:', error);
    const message = error.message === 'Structure the resume before matching jobs'
      ? error.message
      : error.isJSearchError
        ? `JSearch API error: ${error.message}. Check that your RapidAPI key is subscribed to JSearch.`
        : 'Job matching failed. Please try again.';
    return res.status(error.message === 'Structure the resume before matching jobs' ? 400 : error.isJSearchError ? 502 : 502)
      .json({ message });
  }
}

module.exports = { matchJobs };
