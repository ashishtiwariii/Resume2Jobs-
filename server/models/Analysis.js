const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    result: {
      matchScore: { type: Number, required: true },
      matchedSkills: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      atsIssues: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Analysis', analysisSchema);
