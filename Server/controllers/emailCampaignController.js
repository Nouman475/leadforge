const {
  EmailCampaign,
  EmailHistory,
  EmailTemplate,
  Lead,
} = require("../models");
const { Op } = require("sequelize");
const Joi = require("joi");
const emailService = require("../services/emailService");

// Helper function to send campaign emails
async function sendCampaignEmails(campaignId, leads, subject, content) {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) return;

    await campaign.update({ status: "sending", sent_at: new Date() });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const lead of leads) {
      try {
        // Personalize email content
        const personalizedSubject = personalizeContent(subject, lead);
        const personalizedContent = personalizeContent(content, lead);

        // Create email history record
        const emailHistory = await EmailHistory.create({
          campaign_id: campaignId,
          lead_id: lead.id,
          recipient_email: lead.email,
          recipient_name: lead.name,
          subject: personalizedSubject,
          content: personalizedContent,
          status: "pending",
        });

        // Add tracking pixel to email content
        const trackingPixelUrl = `${
          process.env.BASE_URL || "http://localhost:5000"
        }/api/email-campaigns/track/open/${emailHistory.id}`;
        const contentWithTracking =
          personalizedContent +
          `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`;

        // Send email
        const result = await emailService.sendEmail({
          to: lead.email,
          subject: personalizedSubject,
          html: contentWithTracking,
          text: personalizedContent.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        });

        if (result.success) {
          await emailHistory.update({
            status: "sent",
            sent_at: new Date(),
            email_provider_id: result.messageId,
          });
          emailsSent++;
        } else {
          await emailHistory.update({
            status: "failed",
            error_message: result.error,
          });
          emailsFailed++;
        }

        // Small delay between emails to avoid overwhelming SMTP server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send email to ${lead.email}:`, error);
        emailsFailed++;
      }
    }

    // Update campaign with final stats
    await campaign.update({
      status: "completed",
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      completed_at: new Date(),
    });
  } catch (error) {
    console.error("Error in sendCampaignEmails:", error);
    // Update campaign status to failed
    try {
      await EmailCampaign.update(
        { status: "failed", error_message: error.message },
        { where: { id: campaignId } }
      );
    } catch (updateError) {
      console.error("Failed to update campaign status:", updateError);
    }
  }
}

// Helper function to personalize content
function personalizeContent(content, lead) {
  return content
    .replace(/\[name\]/g, lead.name || "")
    .replace(/\[email\]/g, lead.email || "")
    .replace(/\[company\]/g, lead.company || "")
    .replace(/\[phone\]/g, lead.phone || "")
    .replace(/\[status\]/g, lead.status || "");
}

// Validation schemas
const campaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().required(),
  template_id: Joi.string().uuid().optional(),
  lead_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
  scheduled_at: Joi.date().optional(),
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  subject: Joi.string().min(1).max(200).optional(),
  content: Joi.string().optional(),
  template_id: Joi.string().uuid().optional(),
  scheduled_at: Joi.date().optional(),
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
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by status
      if (status && status !== "all") {
        whereClause.status = status;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } },
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
            as: "template",
            attributes: ["id", "name", "category", "tone"],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          campaigns: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch email campaigns",
        message: error.message,
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
            as: "template",
            attributes: ["id", "name", "category", "tone"],
          },
          {
            model: EmailHistory,
            as: "emailHistory",
            include: [
              {
                model: Lead,
                as: "lead",
                attributes: ["id", "name", "email"],
              },
            ],
          },
        ],
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: "Email campaign not found",
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch email campaign",
        message: error.message,
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
          error: "Validation failed",
          details: error.details.map((detail) => detail.message),
        });
      }

      const { lead_ids, ...campaignData } = value;

      // Verify leads exist
      const leads = await Lead.findAll({
        where: { id: { [Op.in]: lead_ids } },
      });

      if (leads.length !== lead_ids.length) {
        return res.status(400).json({
          success: false,
          error: "Some leads not found",
        });
      }

      // Create campaign
      const campaign = await EmailCampaign.create({
        ...campaignData,
        total_recipients: leads.length,
        status: campaignData.scheduled_at ? "scheduled" : "sending",
      });

      // If not scheduled, send immediately
      if (!campaignData.scheduled_at) {
        // Send emails in background
        setImmediate(async () => {
          await sendCampaignEmails(
            campaign.id,
            leads,
            campaignData.subject,
            campaignData.content
          );
        });

        res.status(201).json({
          success: true,
          message: "Email campaign created and sending started",
          data: campaign,
        });
      } else {
        res.status(201).json({
          success: true,
          message: "Email campaign scheduled successfully",
          data: campaign,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create email campaign",
        message: error.message,
      });
    }
  }

  // Update campaign
  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateCampaignSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.details.map((detail) => detail.message),
        });
      }

      const campaign = await EmailCampaign.findByPk(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: "Email campaign not found",
        });
      }

      // Don't allow updates to campaigns that are already sent or sending
      if (["sending", "completed"].includes(campaign.status)) {
        return res.status(400).json({
          success: false,
          error: "Cannot update campaign that is already sending or completed",
        });
      }

      await campaign.update(value);

      res.json({
        success: true,
        message: "Email campaign updated successfully",
        data: campaign,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update email campaign",
        message: error.message,
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
          error: "Email campaign not found",
        });
      }

      // Don't allow deletion of campaigns that are currently sending
      if (campaign.status === "sending") {
        return res.status(400).json({
          success: false,
          error: "Cannot delete campaign that is currently sending",
        });
      }

      await campaign.destroy();

      res.json({
        success: true,
        message: "Email campaign deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete email campaign",
        message: error.message,
      });
    }
  }

  // Get campaign statistics
  async getCampaignStats(req, res) {
    try {
      const stats = await EmailCampaign.findAll({
        attributes: [
          "status",
          [
            EmailCampaign.sequelize.fn(
              "COUNT",
              EmailCampaign.sequelize.col("id")
            ),
            "count",
          ],
          [
            EmailCampaign.sequelize.fn(
              "SUM",
              EmailCampaign.sequelize.col("emails_sent")
            ),
            "total_sent",
          ],
          [
            EmailCampaign.sequelize.fn(
              "SUM",
              EmailCampaign.sequelize.col("emails_failed")
            ),
            "total_failed",
          ],
        ],
        group: ["status"],
      });

      const totalCampaigns = await EmailCampaign.count();
      const totalEmailsSent = (await EmailCampaign.sum("emails_sent")) || 0;
      const totalEmailsFailed = (await EmailCampaign.sum("emails_failed")) || 0;

      const statusStats = {
        draft: 0,
        scheduled: 0,
        sending: 0,
        completed: 0,
        failed: 0,
      };

      stats.forEach((stat) => {
        statusStats[stat.status] = parseInt(stat.dataValues.count);
      });

      console.log(totalCampaigns);
      console.log(totalEmailsSent);
      console.log(totalEmailsFailed);

      res.json({
        success: true,
        data: {
          totalCampaigns,
          totalEmailsSent,
          totalEmailsFailed,
          successRate:
            totalEmailsSent + totalEmailsFailed > 0
              ? (
                  (totalEmailsSent / (totalEmailsSent + totalEmailsFailed)) *
                  100
                ).toFixed(2)
              : 0,
          byStatus: statusStats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch campaign statistics",
        message: error.message,
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

      if (status && status !== "all") {
        whereClause.status = status;
      }

      const { count, rows } = await EmailHistory.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: Lead,
            as: "lead",
            attributes: ["id", "name", "email", "company"],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          emailHistory: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch email history",
        message: error.message,
      });
    }
  }

  // Track email opens
  async trackEmailOpen(req, res) {
    try {
      const { emailHistoryId } = req.params;

      const emailHistory = await EmailHistory.findByPk(emailHistoryId);

      if (emailHistory && !emailHistory.opened_at) {
        await emailHistory.update({
          opened_at: new Date(),
          status: "opened",
        });
      }

      // Return a 1x1 transparent pixel
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      );

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": pixel.length,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
      res.end(pixel);
    } catch (error) {
      console.error("Error tracking email open:", error);
      // Still return pixel even on error
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      );
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": pixel.length,
      });
      res.end(pixel);
    }
  }

  // Track email clicks
  async trackEmailClick(req, res) {
    try {
      const { emailHistoryId } = req.params;
      const { url } = req.query;

      const emailHistory = await EmailHistory.findByPk(emailHistoryId);

      if (emailHistory && !emailHistory.clicked_at) {
        await emailHistory.update({
          clicked_at: new Date(),
          status: "clicked",
        });
      }

      // Redirect to the original URL
      if (url) {
        res.redirect(decodeURIComponent(url));
      } else {
        res.status(400).json({ error: "No URL provided" });
      }
    } catch (error) {
      console.error("Error tracking email click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  }

  // Get all email history (global view)
  async getAllEmailHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        campaign_id,
        search,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by status
      if (status && status !== "all") {
        whereClause.status = status;
      }

      // Filter by campaign
      if (campaign_id) {
        whereClause.campaign_id = campaign_id;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { recipient_email: { [Op.iLike]: `%${search}%` } },
          { recipient_name: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await EmailHistory.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: Lead,
            as: "lead",
            attributes: ["id", "name", "email", "company"],
          },
          {
            model: EmailCampaign,
            as: "campaign",
            attributes: ["id", "name", "status"],
          },
        ],
      });

      // Calculate summary stats
      const totalSent = await EmailHistory.count({ where: { status: "sent" } });
      const totalOpened = await EmailHistory.count({
        where: { status: "opened" },
      });
      const totalClicked = await EmailHistory.count({
        where: { status: "clicked" },
      });
      const totalFailed = await EmailHistory.count({
        where: { status: "failed" },
      });

      res.json({
        success: true,
        data: {
          emailHistory: rows,
          summary: {
            totalSent,
            totalOpened,
            totalClicked,
            totalFailed,
            openRate:
              totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0,
            clickRate:
              totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0,
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch email history",
        message: error.message,
      });
    }
  }
}

module.exports = new EmailCampaignController();
