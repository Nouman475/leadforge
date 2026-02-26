const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom'],
    default: 'custom'
  },
  tone: {
    type: String,
    enum: ['professional', 'friendly', 'casual', 'formal', 'persuasive'],
    default: 'professional'
  },
  is_favorite: {
    type: Boolean,
    default: false
  },
  usage_count: {
    type: Number,
    default: 0
  },
  last_used_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

emailTemplateSchema.index({ category: 1 });
emailTemplateSchema.index({ is_favorite: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
