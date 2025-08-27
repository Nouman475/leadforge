const { EmailHistory, Lead, EmailTemplate } = require('../models');
const { v4: uuidv4 } = require('uuid');

class WebhookController {
  // Handle email provider webhooks (opens, clicks, bounces, etc.)
  async handleEmailEvent(req, res) {
    try {
      const { event, data } = req.body;
      
      // Validate webhook payload
      if (!event || !data) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      console.log(`📧 Webhook received: ${event}`, data);

      // Find email history record by provider ID or message UUID
      let emailHistory = null;
      
      if (data.email_provider_id) {
        emailHistory = await EmailHistory.findOne({
          where: { email_provider_id: data.email_provider_id },
          include: [{ model: Lead, as: 'lead' }]
        });
      } else if (data.message_uuid) {
        emailHistory = await EmailHistory.findOne({
          where: { message_uuid: data.message_uuid },
          include: [{ model: Lead, as: 'lead' }]
        });
      }

      if (!emailHistory) {
        console.warn('⚠️ Email history not found for webhook:', data);
        return res.status(404).json({ error: 'Email history not found' });
      }

      // Process different event types
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
    // Update email history
    await emailHistory.update({
      status: 'sent',
      provider_response: JSON.stringify(data)
    });

    // Update lead statistics
    if (emailHistory.lead) {
      await emailHistory.lead.increment('emails_sent_count');
      await emailHistory.lead.update({ 
        last_email_at: new Date(),
        last_template_id: emailHistory.template_id 
      });
    }

    console.log(`✅ Email delivered: ${emailHistory.recipient_email}`);
  }

  async handleOpened(emailHistory, data) {
    // Only update if not already opened (first open)
    if (!emailHistory.opened_at) {
      await emailHistory.update({
        opened_at: new Date(),
        status: 'opened',
        provider_response: JSON.stringify(data)
      });

      // Update lead statistics and score
      if (emailHistory.lead) {
        await emailHistory.lead.increment(['emails_opened_count', 'lead_score'], { by: [1, 10] });
        
        // Apply lead status rules
        await this.applyLeadStatusRules(emailHistory.lead, 'opened', emailHistory);
      }

      console.log(`👀 Email opened: ${emailHistory.recipient_email}`);
    }
  }

  async handleClicked(emailHistory, data) {
    // Only update if not already clicked (first click)
    if (!emailHistory.clicked_at) {
      await emailHistory.update({
        clicked_at: new Date(),
        status: 'clicked',
        provider_response: JSON.stringify(data)
      });

      // Update lead statistics and score (higher score for clicks)
      if (emailHistory.lead) {
        await emailHistory.lead.increment(['emails_clicked_count', 'lead_score'], { by: [1, 25] });
        
        // Apply lead status rules
        await this.applyLeadStatusRules(emailHistory.lead, 'clicked', emailHistory);
      }

      console.log(`🖱️ Email clicked: ${emailHistory.recipient_email}`);
    }
  }

  async handleBounced(emailHistory, data) {
    await emailHistory.update({
      status: 'bounced',
      bounce_reason: data.reason || 'Unknown',
      provider_response: JSON.stringify(data)
    });

    // Update lead statistics
    if (emailHistory.lead) {
      await emailHistory.lead.increment('emails_failed_count');
      
      // Mark lead as having contact issues if hard bounce
      if (data.bounce_type === 'hard') {
        await emailHistory.lead.update({ status: 'contact_failed' });
      }
    }

    console.log(`❌ Email bounced: ${emailHistory.recipient_email} - ${data.reason}`);
  }

  async handleUnsubscribed(emailHistory, data) {
    // Mark lead as unsubscribed
    if (emailHistory.lead) {
      await emailHistory.lead.update({
        unsubscribed: true,
        unsubscribed_at: new Date(),
        status: 'unsubscribed'
      });
    }

    console.log(`🚫 Lead unsubscribed: ${emailHistory.recipient_email}`);
  }

  // Lead status update rules based on email interactions
  async applyLeadStatusRules(lead, eventType, emailHistory) {
    try {
      // Get template to check category
      const template = await EmailTemplate.findByPk(emailHistory.template_id);
      
      // Rule 1: If template is proposal, update lead status
      if (template && template.category === 'proposal') {
        await lead.update({ 
          status: 'proposal',
          last_contacted: new Date()
        });
      }

      // Rule 2: If lead score reaches threshold, mark as qualified
      await lead.reload(); // Refresh to get updated score
      if (lead.lead_score >= 70 && lead.status !== 'qualified') {
        await lead.update({ status: 'qualified' });
      }

      // Rule 3: If many emails sent but no engagement, mark as unresponsive
      if (lead.emails_sent_count >= 5 && lead.emails_opened_count === 0) {
        await lead.update({ status: 'unresponsive' });
      }

      // Rule 4: If clicked on multiple emails, mark as hot lead
      if (lead.emails_clicked_count >= 2 && lead.status !== 'qualified') {
        await lead.update({ 
          status: 'hot_lead',
          lead_score: Math.max(lead.lead_score, 80)
        });
      }

    } catch (error) {
      console.error('Error applying lead status rules:', error);
    }
  }

  // Handle unsubscribe requests
  async handleUnsubscribe(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Unsubscribe token required' });
      }

      // Find email history by unsubscribe token
      const emailHistory = await EmailHistory.findOne({
        where: { unsubscribe_token: token },
        include: [{ model: Lead, as: 'lead' }]
      });

      if (!emailHistory || !emailHistory.lead) {
        return res.status(404).json({ error: 'Invalid unsubscribe token' });
      }

      // Mark lead as unsubscribed
      await emailHistory.lead.update({
        unsubscribed: true,
        unsubscribed_at: new Date(),
        status: 'unsubscribed'
      });

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
