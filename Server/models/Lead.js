const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'closed', 'lost'],
    default: 'new'
  },
  source: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  last_contacted: {
    type: Date
  },
  last_email_at: {
    type: Date
  },
  last_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  emails_sent_count: {
    type: Number,
    default: 0
  },
  emails_opened_count: {
    type: Number,
    default: 0
  },
  emails_clicked_count: {
    type: Number,
    default: 0
  },
  conversion_date: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

leadSchema.index({ status: 1 });
leadSchema.index({ created_at: -1 });

module.exports = mongoose.model('Lead', leadSchema);
