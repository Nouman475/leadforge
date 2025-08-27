const nodemailer = require("nodemailer");
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Email service configuration error:", error);
        } else {
          console.log("✅ Email service is ready to send messages");
        }
      });
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
    }
  }

  // Send single email
  async sendEmail({ to, subject, html, text, from, attachments = [] }) {
    try {
      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }

      const mailOptions = {
        from: from || process.env.SMTP_USER || "mnoumankhalid195@gmail.com",
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML if no text provided
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      console.error("Email sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send bulk emails with rate limiting
  async sendBulkEmails(emails, options = {}) {
    const {
      batchSize = 10,
      delayBetweenBatches = 1000, // milliseconds
      delayBetweenEmails = 100,
    } = options;

    const results = [];
    const batches = this.chunkArray(emails, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = [];

      for (const email of batch) {
        const result = await this.sendEmail(email);
        batchResults.push({
          ...result,
          recipient: email.to,
          subject: email.subject,
        });

        // Delay between individual emails
        if (delayBetweenEmails > 0) {
          await this.delay(delayBetweenEmails);
        }
      }

      results.push(...batchResults);

      // Delay between batches (except for the last batch)
      if (i < batches.length - 1 && delayBetweenBatches > 0) {
        await this.delay(delayBetweenBatches);
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  }

  // Send email with template
  async sendTemplateEmail({ to, templateId, templateData, subject, from }) {
    try {
      // This would typically fetch template from database
      // For now, we'll use the provided subject and templateData
      const html = this.processTemplate(
        templateData.content || "",
        templateData
      );
      const processedSubject = this.processTemplate(
        subject || "",
        templateData
      );

      return await this.sendEmail({
        to,
        subject: processedSubject,
        html,
        from,
      });
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process template with data (simple placeholder replacement)
  processTemplate(template, data) {
    let processed = template;

    Object.keys(data).forEach((key) => {
      const placeholder = new RegExp(`\\[${key}\\]`, "g");
      processed = processed.replace(placeholder, data[key] || "");
    });

    return processed;
  }

  // Utility function to chunk array into smaller arrays
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Utility function to create delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Test email configuration
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }

      await this.transporter.verify();
      return {
        success: true,
        message: "Email service connection is working",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send test email
  async sendTestEmail(to) {
    const testEmail = {
      to,
      subject: "LeadForge Email Service Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">LeadForge Email Service Test</h2>
          <p>This is a test email to verify that your email service is working correctly.</p>
          <p>If you received this email, your email configuration is set up properly!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from LeadForge Email Service<br>
            Time: ${new Date().toISOString()}
          </p>
        </div>
      `,
    };

    return await this.sendEmail(testEmail);
  }

  // Get email service status
  getStatus() {
    return {
      initialized: !!this.transporter,
      host: process.env.SMTP_HOST || "Not configured",
      port: process.env.SMTP_PORT || "Not configured",
      user: process.env.SMTP_USER || "Not configured",
      secure: process.env.SMTP_PORT === "465",
    };
  }
}

module.exports = new EmailService();
