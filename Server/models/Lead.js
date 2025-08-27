const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('Lead', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal', 'closed', 'hot_lead', 'unresponsive', 'contact_failed', 'unsubscribed'),
    defaultValue: 'new',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  lead_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  emails_sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  emails_failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  emails_opened_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  emails_clicked_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  last_email_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_template_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  unsubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_contacted: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'leads',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = { Lead };
