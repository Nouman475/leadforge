const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
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
  category: {
    type: DataTypes.ENUM('introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom'),
    allowNull: false
  },
  tone: {
    type: DataTypes.ENUM('professional', 'friendly', 'casual', 'formal', 'persuasive'),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  usage_count: {
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
  tableName: 'email_templates',
  timestamps: false,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['tone']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = { EmailTemplate };
