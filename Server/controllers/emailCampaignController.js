const Lead = require("../models/Lead");
const EmailTemplate = require("../models/EmailTemplate");
const EmailCampaign = require("../models/EmailCampaign");
const EmailHistory = require("../models/EmailHistory");
const { emailService } = require("../config/email");
const { wrapContentInTemplate, generateEmailContent, generateEmailSubject } = require("../utils/emailTemplates");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");

async function sendCampaignEmails(campaignId, leads, category = "introduction", tone = "professional") {
  try {
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) return;

    campaign.status = "sending";
    campaign.sent_at = new Date();
    await campaign.save();

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const lead of leads) {
      try {
        const personalizedSubject = generateEmailSubject(category, tone, lead);
        const personalizedContent = generateEmailContent(category, tone, lead);
        const messageUuid = uuidv4();
        const unsubscribeToken = uuidv4();

        const emailHistory = await EmailHistory.create({
          campaign_id: campaignId,
          lead_id: lead._id,
          recipient_email: lead.email,
          recipient_name: lead.name,
          subject: personalizedSubject,
          content: personalizedContent,
          status: "pending",
          message_uuid: messageUuid,
          unsubscribe_token: unsubscribeToken,
          retry_count: 0,
        });

        const userInfo = {
          name: process.env.USER_NAME || "Muhammad Nouman",
          title: process.env.USER_TITLE || "MERN Stack Developer",
          email: process.env.FROM_EMAIL || process.env.SMTP_USER || "mnoumankhalid195@gmail.com",
          phone: process.env.USER_PHONE || "+92 3028954240",
          company: process.env.USER_COMPANY || "",
          website: process.env.USER_WEBSITE || "noumanthedev.netlify.app",
        };

        const htmlContent = wrapContentInTemplate(personalizedContent, category, tone, userInfo);
        const trackingPixelUrl = `${process.env.BASE_URL || "http://localhost:5000"}/api/email-campaigns/track/open/${emailHistory._id}`;
        const unsubscribeUrl = `${process.env.BASE_URL || "http://localhost:5000"}/api/webhooks/unsubscribe/${unsubscribeToken}`;

        const contentWithTracking = htmlContent
          .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
          .replace(/\{\{tracking_pixel\}\}/g, `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`);

        const result = await emailService.sendEmail({
          to: lead.email,
          subject: personalizedSubject,
          html: contentWithTracking,
          text: personalizedContent.replace(/<[^>]*>/g, ""),
        });

        if (result.success) {
          emailHistory.status = "sent";
          emailHistory.sent_at = new Date();
          emailHistory.email_provider_id = result.messageId;
          await emailHistory.save();

          lead.status = "proposal";
          lead.last_contacted = new Date();
          lead.last_email_at = new Date();
          lead.last_template_id = campaign.template_id;
          lead.emails_sent_count = (lead.emails_sent_count || 0) + 1;
          await lead.save();

          emailsSent++;
        } else {
          emailHistory.status = "failed";
          emailHistory.error_message = result.error;
          await emailHistory.save();
          emailsFailed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send email to ${lead.email}:`, error);
        emailsFailed++;
      }
    }

    campaign.status = "completed";
    campaign.emails_sent = emailsSent;
    campaign.emails_failed = emailsFailed;
    campaign.completed_at = new Date();
    await campaign.save();
  } catch (error) {
    console.error("Error in sendCampaignEmails:", error);
    try {
      await EmailCampaign.findByIdAndUpdate(campaignId, { status: "failed", error_message: error.message });
    } catch (updateError) {
      console.error("Failed to update campaign status:", updateError);
    }
  }
}

function personalizeContent(content, lead) {
  return content
    .replace(/\{\{first_name\}\}/g, lead.name ? lead.name.split(" ")[0] : "")
    .replace(/\{\{last_name\}\}/g, lead.name ? lead.name.split(" ").slice(1).join(" ") : "")
    .replace(/\{\{full_name\}\}/g, lead.name || "")
    .replace(/\{\{name\}\}/g, lead.name || "")
    .replace(/\{\{email\}\}/g, lead.email || "")
    .replace(/\{\{company\}\}/g, lead.company || "their company")
    .replace(/\{\{company_name\}\}/g, lead.company || "their company")
    .replace(/\{\{phone\}\}/g, lead.phone || "")
    .replace(/\{\{status\}\}/g, lead.status || "")
    .replace(/\[name\]/g, lead.name || "")
    .replace(/\[email\]/g, lead.email || "")
    .replace(/\[company\]/g, lead.company || "their company")
    .replace(/\[company name\]/g, lead.company || "their company")
    .replace(/\[phone\]/g, lead.phone || "")
    .replace(/\[status\]/g, lead.status || "");
}

const campaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject: Joi.string().min(1).max(200).optional(),
  content: Joi.string().optional(),
  category: Joi.string().valid('introduction', 'followup', 'follow_up', 'proposal', 'meeting', 'thankyou', 'thank_you', 'reminder', 'custom').optional().default('introduction'),
  tone: Joi.string().valid('professional', 'friendly', 'casual', 'formal', 'persuasive').optional().default('professional'),
  template_id: Joi.string().optional(),
  lead_ids: Joi.array().items(Joi.string().allow(null)).min(1).required(),
  scheduled_at: Joi.date().optional(),
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  subject: Joi.string().min(1).max(200).optional(),
  content: Joi.string().optional(),
  template_id: Joi.string().optional(),
  scheduled_at: Joi.date().optional(),
});

class EmailCampaignController {
  async getAllCampaigns(req, res) {
    try {
      const { page = 1, limit = 10, status, search, sortBy = "created_at", sortOrder = "desc" } = req.query;

      const query = {};
      if (status && status !== "all") query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const [campaigns, count] = await Promise.all([
        EmailCampaign.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate("template_id", "name category tone"),
        EmailCampaign.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch campaigns", message: error.message });
    }
  }

  async getCampaignById(req, res) {
    try {
      const campaign = await EmailCampaign.findById(req.params.id).populate("template_id", "name category tone");
      if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });
      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch campaign", message: error.message });
    }
  }

  async createCampaign(req, res) {
    try {
      const { error, value } = campaignSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.details.map(d => d.message) });
      }

      const validLeadIds = value.lead_ids.filter(id => id !== null && id !== undefined && id !== '' && id !== 'null');
      if (validLeadIds.length === 0) {
        return res.status(400).json({ success: false, error: "No valid lead IDs provided. Please select leads first." });
      }

      const leads = await Lead.find({ _id: { $in: validLeadIds } });
      if (leads.length === 0) {
        return res.status(404).json({ success: false, error: "No valid leads found in database" });
      }

      let category = (value.category || 'introduction').replace('_', '');
      const tone = value.tone || 'professional';
      const firstLead = leads[0];
      
      const subject = value.subject || generateEmailSubject(category, tone, firstLead);
      const content = value.content || generateEmailContent(category, tone, firstLead);

      const campaign = await EmailCampaign.create({
        name: value.name,
        subject: subject,
        content: content,
        template_id: value.template_id,
        scheduled_at: value.scheduled_at,
        status: value.scheduled_at ? "scheduled" : "draft",
      });

      if (!value.scheduled_at) {
        setImmediate(() => sendCampaignEmails(campaign._id, leads, category, tone));
      }

      res.status(201).json({ success: true, message: "Campaign created successfully", data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create campaign", message: error.message });
    }
  }

  async updateCampaign(req, res) {
    try {
      const { error, value } = updateCampaignSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.details.map(d => d.message) });
      }

      const campaign = await EmailCampaign.findById(req.params.id);
      if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        return res.status(400).json({ success: false, error: "Cannot update campaign that is already sent" });
      }

      Object.assign(campaign, value);
      await campaign.save();

      res.json({ success: true, message: "Campaign updated successfully", data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update campaign", message: error.message });
    }
  }

  async deleteCampaign(req, res) {
    try {
      const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
      if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });
      res.json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete campaign", message: error.message });
    }
  }

  async getCampaignStats(req, res) {
    try {
      const campaign = await EmailCampaign.findById(req.params.id);
      if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

      const emailHistory = await EmailHistory.find({ campaign_id: req.params.id });
      const stats = {
        total_emails: emailHistory.length,
        sent: emailHistory.filter(e => e.status === "sent").length,
        failed: emailHistory.filter(e => e.status === "failed").length,
        opened: emailHistory.filter(e => e.opened_at).length,
        clicked: emailHistory.filter(e => e.clicked_at).length,
        bounced: emailHistory.filter(e => e.status === "bounced").length,
      };

      res.json({ success: true, data: { campaign, stats } });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch stats", message: error.message });
    }
  }

  async trackEmailOpen(req, res) {
    try {
      const emailHistory = await EmailHistory.findById(req.params.id);
      if (emailHistory && !emailHistory.opened_at) {
        emailHistory.opened_at = new Date();
        emailHistory.status = "opened";
        emailHistory.open_count = (emailHistory.open_count || 0) + 1;
        await emailHistory.save();

        const lead = await Lead.findById(emailHistory.lead_id);
        if (lead) {
          lead.emails_opened_count = (lead.emails_opened_count || 0) + 1;
          await lead.save();
        }
      }

      res.set("Content-Type", "image/gif");
      res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    } catch (error) {
      res.status(500).send();
    }
  }

  async trackEmailClick(req, res) {
    try {
      const emailHistory = await EmailHistory.findById(req.params.id);
      if (emailHistory && !emailHistory.clicked_at) {
        emailHistory.clicked_at = new Date();
        emailHistory.click_count = (emailHistory.click_count || 0) + 1;
        await emailHistory.save();

        const lead = await Lead.findById(emailHistory.lead_id);
        if (lead) {
          lead.emails_clicked_count = (lead.emails_clicked_count || 0) + 1;
          await lead.save();
        }
      }

      res.redirect(req.query.url || "/");
    } catch (error) {
      res.status(500).send("Error tracking click");
    }
  }

  async getAllEmailHistory(req, res) {
    try {
      const { page = 1, limit = 50, status, campaign_id } = req.query;
      const query = {};
      if (status && status !== "all") query.status = status;
      if (campaign_id) query.campaign_id = campaign_id;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [history, count] = await Promise.all([
        EmailHistory.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).populate("lead_id", "name email").populate("campaign_id", "name"),
        EmailHistory.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch email history", message: error.message });
    }
  }

  async getCampaignEmailHistory(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [history, count] = await Promise.all([
        EmailHistory.find({ campaign_id: req.params.id }).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).populate("lead_id", "name email"),
        EmailHistory.countDocuments({ campaign_id: req.params.id })
      ]);

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch campaign history", message: error.message });
    }
  }
}

module.exports = new EmailCampaignController();
