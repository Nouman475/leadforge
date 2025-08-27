const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailHistory = sequelize.define('EmailHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaign_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'email_campaigns',
      key: 'id'
    }
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'leads',
      key: 'id'
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
  recipient_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  recipient_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked'),
    defaultValue: 'pending'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  opened_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clicked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email_provider_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  message_uuid: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true
  },
  provider_response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bounce_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  unsubscribe_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
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
  tableName: 'email_history',
  indexes: [
    {
      fields: ['lead_id']
    },
    {
      fields: ['campaign_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['sent_at']
    },
    {
      fields: ['recipient_email']
    },
    {
      fields: ['message_uuid']
    },
    {
      fields: ['email_provider_id']
    },
    {
      fields: ['unsubscribe_token']
    }
  ]
});

module.exports = { EmailHistory };
