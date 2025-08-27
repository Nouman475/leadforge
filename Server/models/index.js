const { sequelize } = require('../config/database');
const { Lead } = require('./Lead');
const { EmailTemplate } = require('./EmailTemplate');
const { EmailCampaign } = require('./EmailCampaign');
const { EmailHistory } = require('./EmailHistory');

// Define associations
EmailCampaign.belongsTo(EmailTemplate, { 
  foreignKey: 'template_id', 
  as: 'template' 
});

EmailTemplate.hasMany(EmailCampaign, { 
  foreignKey: 'template_id', 
  as: 'campaigns' 
});

EmailHistory.belongsTo(Lead, { 
  foreignKey: 'lead_id', 
  as: 'lead' 
});

EmailHistory.belongsTo(EmailCampaign, { 
  foreignKey: 'campaign_id', 
  as: 'campaign' 
});

EmailHistory.belongsTo(EmailTemplate, { 
  foreignKey: 'template_id', 
  as: 'template' 
});

Lead.hasMany(EmailHistory, { 
  foreignKey: 'lead_id', 
  as: 'emailHistory' 
});

EmailCampaign.hasMany(EmailHistory, { 
  foreignKey: 'campaign_id', 
  as: 'emailHistory' 
});

EmailTemplate.hasMany(EmailHistory, { 
  foreignKey: 'template_id', 
  as: 'emailHistory' 
});

module.exports = {
  sequelize,
  Lead,
  EmailTemplate,
  EmailCampaign,
  EmailHistory
};
