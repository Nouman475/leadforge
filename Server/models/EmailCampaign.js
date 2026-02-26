const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
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
  template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
    default: 'draft'
  },
  scheduled_at: {
    type: Date
  },
  sent_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  emails_sent: {
    type: Number,
    default: 0
  },
  emails_failed: {
    type: Number,
    default: 0
  },
  error_message: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ created_at: -1 });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);
