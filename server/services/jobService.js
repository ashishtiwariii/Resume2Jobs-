const crypto = require('crypto');
const JobCache = require('../models/JobCache');
const { analyzeResumeAgainstJob } = require('./geminiService');

const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
const JSEARCH_URL = process.env.JSEARCH_URL || `https://${RAPIDAPI_HOST}/search`;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getResumeSearchQuery(resume) {
  const skills = resume.parsedData?.skills || [];
  const experience = resume.parsedData?.experience || [];
  const titles = experience
    .map((item) => {
      if (typeof item !== 'string') return item.title || item.role || '';
      const roleMatch = item.match(/\s-\s([^:(]+?)(?:\s*\(|:|$)/);
      return roleMatch?.[1]?.trim() || item.split(/[\n,:]/)[0].trim();
    })
    .filter(Boolean);
  const terms = titles.length
    ? [titles[0], ...skills.slice(0, 2)]
    : skills.slice(0, 3);

  if (!terms.length) {
    throw new Error('Structure the resume before matching jobs');
  }

  return terms.join(' ');
}

function mapJob(job) {
  if (!job?.job_apply_link) {
    return null;
  }

  return {
    title: job.job_title || 'Untitled position',
    companyName: job.employer_name || 'Unknown company',
    companyLogo: job.employer_logo || null,
    location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Location not specified',
    postedDate: job.job_posted_at_datetime || job.job_posted_at_timestamp || null,
    jobApplyLink: job.job_apply_link,
    jobPublisher: job.job_publisher || null,
    description: job.job_description || '',
  };
}

async function fetchJobsFromJSearch(query, datePosted = 'week') {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }

  const params = new URLSearchParams({
    query,
    date_posted: datePosted,
    country: 'us',
    language: 'en',
    page: '1',
    num_pages: '1',
  });
  const response = await fetch(`${JSEARCH_URL}?${params}`, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });
  const body = await response.json();

  if (!response.ok) {
    const error = new Error(body?.message || `JSearch request failed with status ${response.status}`);
    error.status = response.status;
    error.isJSearchError = true;
    throw error;
  }

  const jobResults = Array.isArray(body.data) ? body.data : body.data?.jobs || [];
  return jobResults.map(mapJob).filter(Boolean);
}

async function getCachedOrFreshJobs(userId, query) {
  const queryHash = crypto.createHash('sha256').update(query.toLowerCase()).digest('hex');
  const cached = await JobCache.findOne({ userId, queryHash });

  if (cached && cached.jobs.length > 0 && Date.now() - cached.fetchedAt.getTime() < CACHE_MAX_AGE_MS) {
    return cached.jobs;
  }

  let jobs = await fetchJobsFromJSearch(query);
  if (!jobs.length) {
    jobs = await fetchJobsFromJSearch(query, 'all');
  }
  await JobCache.findOneAndUpdate(
    { userId, queryHash },
    { userId, queryHash, query, jobs, fetchedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return jobs;
}

async function rankJobs(resumeText, jobs) {
  const rankedJobs = [];

  for (const job of jobs) {
    try {
      const result = await analyzeResumeAgainstJob(resumeText, job.description);
      const matchScore = Number(result.matchScore);
      rankedJobs.push({
        ...job,
        matchPercent: Number.isFinite(matchScore) ? Math.min(100, Math.max(0, Math.round(matchScore))) : 0,
      });
    } catch (error) {
      console.error(`Job scoring failed for ${job.title}:`, error.message);
      rankedJobs.push({ ...job, matchPercent: 0 });
    }
  }

  return rankedJobs
    .sort((first, second) => second.matchPercent - first.matchPercent)
    .map(({ description, ...job }) => job);
}

async function matchJobsForResume(resume) {
  const query = getResumeSearchQuery(resume);
  let jobs = await getCachedOrFreshJobs(resume.userId, query);

  if (!jobs.length && resume.parsedData?.skills?.length > 1) {
    const fallbackTitle = (resume.parsedData.experience || [])
      .map((item) => (typeof item === 'string' ? item : item.role || item.title || ''))
      .find(Boolean);
    const fallbackQuery = fallbackTitle || resume.parsedData.skills.slice(0, 3).join(' ');
    if (fallbackQuery !== query) {
      jobs = await getCachedOrFreshJobs(resume.userId, fallbackQuery);
    }
  }

  if (!jobs.length) {
    jobs = await getCachedOrFreshJobs(resume.userId, 'Full Stack Developer JavaScript');
  }

  return rankJobs(resume.rawText, jobs);
}

module.exports = { matchJobsForResume, getResumeSearchQuery };
