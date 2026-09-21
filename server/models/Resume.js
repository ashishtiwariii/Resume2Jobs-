const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    parsedData: {
      skills: { type: [String], default: [] },
      experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
      education: { type: [mongoose.Schema.Types.Mixed], default: [] },
      projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Resume', resumeSchema);
