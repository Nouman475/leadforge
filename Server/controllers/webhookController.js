const EmailHistory = require('../models/EmailHistory');
const Lead = require('../models/Lead');
const EmailTemplate = require('../models/EmailTemplate');

class WebhookController {
  async handleEmailEvent(req, res) {
    try {
      const { event, data } = req.body;
      
      if (!event || !data) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      console.log(`📧 Webhook received: ${event}`, data);

      let emailHistory = null;
      
      if (data.email_provider_id) {
        emailHistory = await EmailHistory.findOne({ email_provider_id: data.email_provider_id }).populate('lead_id');
      } else if (data.message_uuid) {
        emailHistory = await EmailHistory.findOne({ message_uuid: data.message_uuid }).populate('lead_id');
      }

      if (!emailHistory) {
        console.warn('⚠️ Email history not found for webhook:', data);
        return res.status(404).json({ error: 'Email history not found' });
      }

      switch (event) {
        case 'delivered':
          await this.handleDelivered(emailHistory, data);
          break;
        case 'opened':
          await this.handleOpened(emailHistory, data);
          break;
        case 'clicked':
          await this.handleClicked(emailHistory, data);
          break;
        case 'bounced':
          await this.handleBounced(emailHistory, data);
          break;
        case 'unsubscribed':
          await this.handleUnsubscribed(emailHistory, data);
          break;
        default:
          console.warn(`⚠️ Unknown webhook event: ${event}`);
      }

      res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handleDelivered(emailHistory, data) {
    emailHistory.status = 'sent';
    emailHistory.provider_response = JSON.stringify(data);
    await emailHistory.save();

    if (emailHistory.lead_id) {
      const lead = await Lead.findById(emailHistory.lead_id);
      if (lead) {
        lead.emails_sent_count = (lead.emails_sent_count || 0) + 1;
        lead.last_email_at = new Date();
        lead.last_template_id = emailHistory.template_id;
        await lead.save();
      }
    }

    console.log(`✅ Email delivered: ${emailHistory.recipient_email}`);
  }

  async handleOpened(emailHistory, data) {
    if (!emailHistory.opened_at) {
      emailHistory.opened_at = new Date();
      emailHistory.status = 'opened';
      emailHistory.provider_response = JSON.stringify(data);
      await emailHistory.save();

      if (emailHistory.lead_id) {
        const lead = await Lead.findById(emailHistory.lead_id);
        if (lead) {
          lead.emails_opened_count = (lead.emails_opened_count || 0) + 1;
          lead.score = (lead.score || 0) + 10;
          await lead.save();
          await this.applyLeadStatusRules(lead, 'opened', emailHistory);
        }
      }

      console.log(`👀 Email opened: ${emailHistory.recipient_email}`);
    }
  }

  async handleClicked(emailHistory, data) {
    if (!emailHistory.clicked_at) {
      emailHistory.clicked_at = new Date();
      emailHistory.status = 'clicked';
      emailHistory.provider_response = JSON.stringify(data);
      await emailHistory.save();

      if (emailHistory.lead_id) {
        const lead = await Lead.findById(emailHistory.lead_id);
        if (lead) {
          lead.emails_clicked_count = (lead.emails_clicked_count || 0) + 1;
          lead.score = (lead.score || 0) + 25;
          await lead.save();
          await this.applyLeadStatusRules(lead, 'clicked', emailHistory);
        }
      }

      console.log(`🖱️ Email clicked: ${emailHistory.recipient_email}`);
    }
  }

  async handleBounced(emailHistory, data) {
    emailHistory.status = 'bounced';
    emailHistory.bounce_reason = data.reason || 'Unknown';
    emailHistory.provider_response = JSON.stringify(data);
    await emailHistory.save();

    if (emailHistory.lead_id) {
      const lead = await Lead.findById(emailHistory.lead_id);
      if (lead) {
        lead.emails_failed_count = (lead.emails_failed_count || 0) + 1;
        if (data.bounce_type === 'hard') {
          lead.status = 'lost';
        }
        await lead.save();
      }
    }

    console.log(`❌ Email bounced: ${emailHistory.recipient_email} - ${data.reason}`);
  }

  async handleUnsubscribed(emailHistory, data) {
    if (emailHistory.lead_id) {
      const lead = await Lead.findById(emailHistory.lead_id);
      if (lead) {
        lead.unsubscribed = true;
        lead.unsubscribed_at = new Date();
        lead.status = 'lost';
        await lead.save();
      }
    }

    console.log(`🚫 Lead unsubscribed: ${emailHistory.recipient_email}`);
  }

  async applyLeadStatusRules(lead, eventType, emailHistory) {
    try {
      const template = await EmailTemplate.findById(emailHistory.template_id);
      
      if (template && template.category === 'proposal') {
        lead.status = 'proposal';
        lead.last_contacted = new Date();
      }

      if (lead.score >= 70 && lead.status !== 'qualified') {
        lead.status = 'qualified';
      }

      if ((lead.emails_sent_count || 0) >= 5 && (lead.emails_opened_count || 0) === 0) {
        lead.status = 'lost';
      }

      if ((lead.emails_clicked_count || 0) >= 2 && lead.status !== 'qualified') {
        lead.status = 'qualified';
        lead.score = Math.max(lead.score || 0, 80);
      }

      await lead.save();
    } catch (error) {
      console.error('Error applying lead status rules:', error);
    }
  }

  async handleUnsubscribe(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Unsubscribe token required' });
      }

      const emailHistory = await EmailHistory.findOne({ unsubscribe_token: token }).populate('lead_id');

      if (!emailHistory || !emailHistory.lead_id) {
        return res.status(404).json({ error: 'Invalid unsubscribe token' });
      }

      const lead = await Lead.findById(emailHistory.lead_id);
      if (lead) {
        lead.unsubscribed = true;
        lead.unsubscribed_at = new Date();
        lead.status = 'lost';
        await lead.save();
      }

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from all future emails'
      });

    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'Unsubscribe failed' });
    }
  }
}

module.exports = new WebhookController();
