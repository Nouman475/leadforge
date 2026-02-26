const mongoose = require('mongoose');

const emailHistorySchema = new mongoose.Schema({
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailCampaign',
    required: true
  },
  lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  recipient_email: {
    type: String,
    required: true
  },
  recipient_name: {
    type: String
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced', 'opened', 'clicked'],
    default: 'pending'
  },
  sent_at: {
    type: Date
  },
  opened_at: {
    type: Date
  },
  clicked_at: {
    type: Date
  },
  bounced_at: {
    type: Date
  },
  error_message: {
    type: String
  },
  email_provider_id: {
    type: String
  },
  message_uuid: {
    type: String,
    unique: true
  },
  unsubscribe_token: {
    type: String,
    unique: true
  },
  retry_count: {
    type: Number,
    default: 0
  },
  open_count: {
    type: Number,
    default: 0
  },
  click_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

emailHistorySchema.index({ campaign_id: 1 });
emailHistorySchema.index({ lead_id: 1 });
emailHistorySchema.index({ status: 1 });

module.exports = mongoose.model('EmailHistory', emailHistorySchema);
