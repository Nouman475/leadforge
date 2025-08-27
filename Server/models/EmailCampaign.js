const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailCampaign = sequelize.define('EmailCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  template_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'email_templates',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'completed', 'failed'),
    defaultValue: 'draft'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_recipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emails_sent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emails_failed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'email_campaigns',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = { EmailCampaign };
