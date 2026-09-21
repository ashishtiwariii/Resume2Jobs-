const mongoose = require('mongoose');

const jobCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    queryHash: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    jobs: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

jobCacheSchema.index({ userId: 1, queryHash: 1 }, { unique: true });

module.exports = mongoose.model('JobCache', jobCacheSchema);
