const path = require('path');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');
const Resume = require('../models/Resume');
const Analysis = require('../models/Analysis');
const { structureResume, analyzeResumeAgainstJob } = require('../services/geminiService');

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function extractResumeText(file) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === '.pdf' && file.mimetype === 'application/pdf') {
    return extractPdfText(file.buffer);
  }

  if (
    extension === '.docx' &&
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  throw new Error('File extension and content type do not match a supported resume format');
}

async function uploadResume(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'A PDF or DOCX resume file is required' });
  }

  try {
    const rawText = await extractResumeText(req.file);

    if (!rawText) {
      return res.status(400).json({ message: 'The uploaded resume contains no readable text' });
    }

    const resume = await Resume.create({
      userId: req.user.userId,
      rawText,
      parsedData: {
        skills: [],
        experience: [],
        education: [],
        projects: [],
      },
    });

    return res.status(201).json({
      message: 'Resume uploaded and text extracted successfully',
      resume: {
        id: resume._id,
        uploadedAt: resume.uploadedAt,
        rawText: resume.rawText,
        parsedData: resume.parsedData,
      },
    });
  } catch (error) {
    console.error('Resume extraction error:', error);
    return res.status(400).json({
      message: 'The uploaded resume could not be parsed. Please upload a valid, readable PDF or DOCX file.',
    });
  }
}

async function structureUploadedResume(req, res) {
  const { resumeId } = req.body;

  if (!resumeId) {
    return res.status(400).json({ message: 'resumeId is required' });
  }

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const parsedData = await structureResume(resume.rawText);
    resume.parsedData = {
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
    };
    await resume.save();

    return res.json({ resumeId: resume._id, parsedData: resume.parsedData });
  } catch (error) {
    console.error('Resume structuring error:', error);
    if (error.isQuotaError) {
      return res.status(429).json({ message: 'Gemini API quota is temporarily exhausted. Please wait and try again, or use a Gemini API key with available quota.' });
    }
    return res.status(502).json({ message: 'Resume structuring failed. Please try again.' });
  }
}

function normalizeAnalysisResult(result) {
  const matchScore = Number(result.matchScore);

  return {
    matchScore: Number.isFinite(matchScore) ? Math.min(100, Math.max(0, Math.round(matchScore))) : 0,
    matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
    missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
    atsIssues: Array.isArray(result.atsIssues) ? result.atsIssues : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
}

async function analyzeResume(req, res) {
  const { resumeId, jobDescription } = req.body;

  if (!resumeId || !jobDescription?.trim()) {
    return res.status(400).json({ message: 'resumeId and jobDescription are required' });
  }

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const result = normalizeAnalysisResult(
      await analyzeResumeAgainstJob(resume.rawText, jobDescription.trim())
    );
    const analysis = await Analysis.create({
      userId: req.user.userId,
      resumeId: resume._id,
      jobDescription: jobDescription.trim(),
      result,
    });

    return res.status(201).json({ analysisId: analysis._id, ...result });
  } catch (error) {
    console.error('Resume analysis error:', error);
    if (error.isQuotaError) {
      return res.status(429).json({ message: 'Gemini API quota is temporarily exhausted. Please wait and try again, or use a Gemini API key with available quota.' });
    }
    return res.status(502).json({ message: 'Resume analysis failed. Please try again.' });
  }
}

module.exports = { uploadResume, structureUploadedResume, analyzeResume };
