const { EmailCampaign, EmailHistory, EmailTemplate, Lead } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');
const emailService = require('../services/emailService');

// Validation schemas
const campaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().required(),
  template_id: Joi.string().uuid().optional(),
  lead_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
  scheduled_at: Joi.date().optional()
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  subject: Joi.string().min(1).max(200).optional(),
  content: Joi.string().optional(),
  template_id: Joi.string().uuid().optional(),
  scheduled_at: Joi.date().optional()
});

class EmailCampaignController {
  // Get all email campaigns
  async getAllCampaigns(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        search,
        sortBy = 'created_at', 
        sortOrder = 'DESC' 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by status
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await EmailCampaign.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: EmailTemplate,
            as: 'template',
            attributes: ['id', 'name', 'category', 'tone']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          campaigns: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email campaigns',
        message: error.message
      });
    }
  }

  // Get single campaign by ID
  async getCampaignById(req, res) {
    try {
      const { id } = req.params;
      
      const campaign = await EmailCampaign.findByPk(id, {
        include: [
          {
            model: EmailTemplate,
            as: 'template',
            attributes: ['id', 'name', 'category', 'tone']
          },
          {
            model: EmailHistory,
            as: 'emailHistory',
            include: [
              {
                model: Lead,
                as: 'lead',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Email campaign not found'
        });
      }

      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email campaign',
        message: error.message
      });
    }
  }

  // Create and send bulk email campaign
  async createCampaign(req, res) {
    try {
      const { error, value } = campaignSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const { lead_ids, ...campaignData } = value;

      // Verify leads exist
      const leads = await Lead.findAll({
        where: { id: { [Op.in]: lead_ids } }
      });

      if (leads.length !== lead_ids.length) {
        return res.status(400).json({
          success: false,
          error: 'Some leads not found'
        });
      }

      // Create campaign
      const campaign = await EmailCampaign.create({
        ...campaignData,
        total_recipients: leads.length,
        status: campaignData.scheduled_at ? 'scheduled' : 'sending'
      });

      // If not scheduled, send immediately
      if (!campaignData.scheduled_at) {
        // Send emails in background
        this.sendCampaignEmails(campaign.id, leads, campaignData.subject, campaignData.content);
        
        res.status(201).json({
          success: true,
          message: 'Email campaign created and sending started',
          data: campaign
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Email campaign scheduled successfully',
          data: campaign
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create email campaign',
        message: error.message
      });
    }
  }

  // Send campaign emails (background process)
  async sendCampaignEmails(campaignId, leads, subject, content) {
    try {
      const campaign = await EmailCampaign.findByPk(campaignId);
      if (!campaign) return;

      await campaign.update({ status: 'sending', sent_at: new Date() });

      let emailsSent = 0;
      let emailsFailed = 0;

      for (const lead of leads) {
        try {
          // Personalize email content
          const personalizedSubject = this.personalizeContent(subject, lead);
          const personalizedContent = this.personalizeContent(content, lead);

          // Create email history record
          const emailHistory = await EmailHistory.create({
            campaign_id: campaignId,
            lead_id: lead.id,
            recipient_email: lead.email,
            recipient_name: lead.name,
            subject: personalizedSubject,
            content: personalizedContent,
            status: 'pending'
          });

          // Send email
          const result = await emailService.sendEmail({
            to: lead.email,
            subject: personalizedSubject,
            html: personalizedContent,
            text: personalizedContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
          });

          if (result.success) {
            await emailHistory.update({
              status: 'sent',
              sent_at: new Date(),
              email_provider_id: result.messageId
            });
            emailsSent++;
          } else {
            await emailHistory.update({
              status: 'failed',
              error_message: result.error
            });
            emailsFailed++;
          }

          // Update lead's last_contacted
          await lead.update({ last_contacted: new Date() });

          // Small delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (emailError) {
          console.error(`Failed to send email to ${lead.email}:`, emailError);
          emailsFailed++;
        }
      }

      // Update campaign with final results
      await campaign.update({
        status: 'completed',
        emails_sent: emailsSent,
        emails_failed: emailsFailed
      });

    } catch (error) {
      console.error('Campaign sending error:', error);
      await EmailCampaign.update(
        { status: 'failed' },
        { where: { id: campaignId } }
      );
    }
  }

  // Personalize email content with lead data
  personalizeContent(content, lead) {
    return content
      .replace(/\[Name\]/g, lead.name || '')
      .replace(/\[Company Name\]/g, lead.company || 'your company')
      .replace(/\[Email\]/g, lead.email || '')
      .replace(/\[Phone\]/g, lead.phone || '')
      .replace(/\[Your Name\]/g, process.env.SENDER_NAME || 'Your Name')
      .replace(/\[Your Company\]/g, process.env.COMPANY_NAME || 'Your Company')
      .replace(/\[Your Title\]/g, process.env.SENDER_TITLE || 'Your Title')
      .replace(/\[Your Contact Information\]/g, process.env.CONTACT_INFO || 'Your Contact Info');
  }

  // Update campaign
  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateCampaignSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const campaign = await EmailCampaign.findByPk(id);
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Email campaign not found'
        });
      }

      // Don't allow updates to campaigns that are already sent or sending
      if (['sending', 'completed'].includes(campaign.status)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update campaign that is already sending or completed'
        });
      }

      await campaign.update(value);
      
      res.json({
        success: true,
        message: 'Email campaign updated successfully',
        data: campaign
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update email campaign',
        message: error.message
      });
    }
  }

  // Delete campaign
  async deleteCampaign(req, res) {
    try {
      const { id } = req.params;
      
      const campaign = await EmailCampaign.findByPk(id);
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Email campaign not found'
        });
      }

      // Don't allow deletion of campaigns that are currently sending
      if (campaign.status === 'sending') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete campaign that is currently sending'
        });
      }

      await campaign.destroy();
      
      res.json({
        success: true,
        message: 'Email campaign deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete email campaign',
        message: error.message
      });
    }
  }

  // Get campaign statistics
  async getCampaignStats(req, res) {
    try {
      const stats = await EmailCampaign.findAll({
        attributes: [
          'status',
          [EmailCampaign.sequelize.fn('COUNT', EmailCampaign.sequelize.col('id')), 'count'],
          [EmailCampaign.sequelize.fn('SUM', EmailCampaign.sequelize.col('emails_sent')), 'total_sent'],
          [EmailCampaign.sequelize.fn('SUM', EmailCampaign.sequelize.col('emails_failed')), 'total_failed']
        ],
        group: ['status']
      });

      const totalCampaigns = await EmailCampaign.count();
      const totalEmailsSent = await EmailCampaign.sum('emails_sent') || 0;
      const totalEmailsFailed = await EmailCampaign.sum('emails_failed') || 0;

      const statusStats = {
        draft: 0,
        scheduled: 0,
        sending: 0,
        completed: 0,
        failed: 0
      };

      stats.forEach(stat => {
        statusStats[stat.status] = parseInt(stat.dataValues.count);
      });

      res.json({
        success: true,
        data: {
          totalCampaigns,
          totalEmailsSent,
          totalEmailsFailed,
          successRate: totalEmailsSent + totalEmailsFailed > 0 
            ? ((totalEmailsSent / (totalEmailsSent + totalEmailsFailed)) * 100).toFixed(2)
            : 0,
          byStatus: statusStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaign statistics',
        message: error.message
      });
    }
  }

  // Get email history for a campaign
  async getCampaignEmailHistory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = { campaign_id: id };

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      const { count, rows } = await EmailHistory.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Lead,
            as: 'lead',
            attributes: ['id', 'name', 'email', 'company']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          emailHistory: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email history',
        message: error.message
      });
    }
  }
}

module.exports = new EmailCampaignController();
