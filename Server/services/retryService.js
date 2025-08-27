const { EmailHistory, Lead } = require('../models');
const emailService = require('./emailService');

class RetryService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  }

  // Retry failed email sends with exponential backoff
  async retryFailedEmails() {
    try {
      console.log('🔄 Starting retry process for failed emails...');

      // Find emails that failed and haven't exceeded max retries
      const failedEmails = await EmailHistory.findAll({
        where: {
          status: 'failed',
          retry_count: { [require('sequelize').Op.lt]: this.maxRetries }
        },
        include: [{ model: Lead, as: 'lead' }],
        limit: 50 // Process in batches
      });

      if (failedEmails.length === 0) {
        console.log('✅ No failed emails to retry');
        return;
      }

      console.log(`📧 Found ${failedEmails.length} failed emails to retry`);

      for (const emailHistory of failedEmails) {
        await this.retryEmail(emailHistory);
        
        // Small delay between retries to avoid overwhelming the service
        await this.delay(500);
      }

      console.log('✅ Retry process completed');
    } catch (error) {
      console.error('❌ Error in retry process:', error);
    }
  }

  async retryEmail(emailHistory) {
    try {
      const retryCount = emailHistory.retry_count + 1;
      const delay = this.retryDelays[retryCount - 1] || this.retryDelays[this.retryDelays.length - 1];

      console.log(`🔄 Retrying email ${emailHistory.id} (attempt ${retryCount}/${this.maxRetries})`);

      // Wait for exponential backoff delay
      await this.delay(delay);

      // Attempt to resend the email
      const result = await emailService.sendEmail({
        to: emailHistory.recipient_email,
        subject: emailHistory.subject,
        html: emailHistory.content,
        text: emailHistory.content.replace(/<[^>]*>/g, '') // Strip HTML
      });

      if (result.success) {
        // Success - update status
        await emailHistory.update({
          status: 'sent',
          sent_at: new Date(),
          email_provider_id: result.messageId,
          retry_count: retryCount,
          provider_response: JSON.stringify(result)
        });

        // Update lead statistics
        if (emailHistory.lead) {
          await emailHistory.lead.increment('emails_sent_count');
          await emailHistory.lead.decrement('emails_failed_count');
          await emailHistory.lead.update({ 
            last_email_at: new Date(),
            last_template_id: emailHistory.template_id 
          });
        }

        console.log(`✅ Email retry successful: ${emailHistory.recipient_email}`);
      } else {
        // Still failed - update retry count
        await emailHistory.update({
          retry_count: retryCount,
          error_message: result.error,
          provider_response: JSON.stringify(result)
        });

        if (retryCount >= this.maxRetries) {
          // Mark as permanently failed
          await emailHistory.update({ status: 'bounced' });
          console.log(`❌ Email permanently failed after ${this.maxRetries} retries: ${emailHistory.recipient_email}`);
        } else {
          console.log(`⚠️ Email retry ${retryCount} failed: ${emailHistory.recipient_email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error retrying email ${emailHistory.id}:`, error);
      
      // Update retry count even on error
      await emailHistory.update({
        retry_count: emailHistory.retry_count + 1,
        error_message: error.message
      });
    }
  }

  // Start periodic retry process
  startRetryScheduler() {
    console.log('🕐 Starting email retry scheduler (every 5 minutes)');
    
    // Run immediately
    this.retryFailedEmails();
    
    // Then run every 5 minutes
    setInterval(() => {
      this.retryFailedEmails();
    }, 5 * 60 * 1000); // 5 minutes
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new RetryService();
