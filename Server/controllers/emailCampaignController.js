const { Lead } = require("../models/Lead");
const { EmailTemplate } = require("../models/EmailTemplate");
const { EmailCampaign } = require("../models/EmailCampaign");
const { EmailHistory } = require("../models/EmailHistory");
const { emailService } = require("../config/email");
const {
  wrapContentInTemplate,
  generateEmailContent,
  generateEmailSubject,
} = require("../utils/emailTemplates");
const { Op } = require("sequelize");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");

// Helper function to send campaign emails with automatic content generation
async function sendCampaignEmails(
  campaignId,
  leads,
  category = "introduction",
  tone = "professional"
) {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) return;

    await campaign.update({ status: "sending", sent_at: new Date() });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const lead of leads) {
      try {
        // Generate automatic subject and content based on category and tone
        const personalizedSubject = generateEmailSubject(category, tone, lead);
        const personalizedContent = generateEmailContent(category, tone, lead);

        // Generate unique identifiers for idempotency
        const messageUuid = uuidv4();
        const unsubscribeToken = uuidv4();

        // Create email history record
        const emailHistory = await EmailHistory.create({
          campaign_id: campaignId,
          lead_id: lead.id,
          recipient_email: lead.email,
          recipient_name: lead.name,
          subject: personalizedSubject,
          content: personalizedContent,
          status: "pending",
          message_uuid: messageUuid,
          unsubscribe_token: unsubscribeToken,
          retry_count: 0,
        });

        // User info for signature (you can make this configurable via environment variables)
        const userInfo = {
          name: process.env.USER_NAME || "Muhammad Nouman",
          title: process.env.USER_TITLE || "MERN Stack Developer",
          email:
            process.env.FROM_EMAIL ||
            process.env.SMTP_USER ||
            "mnoumankhalid195@gmail.com",
          phone: process.env.USER_PHONE || "+92 3028954240",
          company: process.env.USER_COMPANY || "",
          website: process.env.USER_WEBSITE || "noumanthedev.netlify.app",
        };

        // Wrap content in professional HTML template with dynamic category, tone, and user info
        const htmlContent = wrapContentInTemplate(
          personalizedContent,
          category,
          tone,
          userInfo
        );

        // Add tracking pixel and unsubscribe link to email content
        const trackingPixelUrl = `${
          process.env.BASE_URL || "http://localhost:5000"
        }/api/email-campaigns/track/open/${emailHistory.id}`;
        const unsubscribeUrl = `${
          process.env.BASE_URL || "http://localhost:5000"
        }/api/webhooks/unsubscribe/${unsubscribeToken}`;

        // Replace template placeholders with actual URLs
        const contentWithTracking = htmlContent
          .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
          .replace(
            /\{\{tracking_pixel\}\}/g,
            `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`
          );

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

          // Update lead status to 'proposal' when email is successfully sent
          await lead.update({
            status: "proposal",
            last_contacted: new Date(),
            last_email_at: new Date(),
            last_template_id: campaign.template_id,
          });

          // Update lead email statistics
          await lead.increment("emails_sent_count");

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

// Helper function to personalize content with multiple token formats
function personalizeContent(content, lead) {
  return (
    content
      // Support {{token}} format (recommended)
      .replace(/\{\{first_name\}\}/g, lead.name ? lead.name.split(" ")[0] : "")
      .replace(
        /\{\{last_name\}\}/g,
        lead.name ? lead.name.split(" ").slice(1).join(" ") : ""
      )
      .replace(/\{\{full_name\}\}/g, lead.name || "")
      .replace(/\{\{name\}\}/g, lead.name || "")
      .replace(/\{\{email\}\}/g, lead.email || "")
      .replace(/\{\{company\}\}/g, lead.company || "their company")
      .replace(/\{\{company_name\}\}/g, lead.company || "their company")
      .replace(/\{\{phone\}\}/g, lead.phone || "")
      .replace(/\{\{status\}\}/g, lead.status || "")
      // Support legacy [token] format for backward compatibility
      .replace(/\[name\]/g, lead.name || "")
      .replace(/\[email\]/g, lead.email || "")
      .replace(/\[company\]/g, lead.company || "their company")
      .replace(/\[company name\]/g, lead.company || "their company")
      .replace(/\[phone\]/g, lead.phone || "")
      .replace(/\[status\]/g, lead.status || "")
  );
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
      const campaignSchema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        category: Joi.string()
          .valid("proposal", "follow_up", "introduction")
          .required(),
        tone: Joi.string()
          .valid("professional", "friendly", "formal")
          .required(),
        lead_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
      });

      const { error } = campaignSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { name, category, tone, lead_ids } = req.body;

      // Verify leads exist
      const leads = await Lead.findAll({
        where: { id: { [Op.in]: lead_ids } },
      });

      if (leads.length !== lead_ids.length) {
        return res.status(400).json({ error: "Some leads not found" });
      }

      // Create campaign with automatic subject and content
      const sampleLead = leads[0];
      const autoSubject = generateEmailSubject(category, tone, sampleLead);
      const autoContent = generateEmailContent(category, tone, sampleLead);

      const campaign = await EmailCampaign.create({
        name,
        subject: autoSubject,
        content: autoContent,
        total_recipients: leads.length,
        status: "draft",
      });

      // Send emails in background with category and tone
      sendCampaignEmails(campaign.id, leads, category, tone);

      res.status(201).json({
        success: true,
        campaign: campaign,
        message: "Campaign created and emails are being sent",
      });
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
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
      const totalSent = await EmailHistory.count({
        where: {
          status: { [Op.in]: ["sent", "opened", "clicked"] },
        },
      });
      const totalOpened = await EmailHistory.count({
        where: {
          opened_at: { [Op.not]: null },
        },
      });
      const totalClicked = await EmailHistory.count({
        where: {
          clicked_at: { [Op.not]: null },
        },
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
