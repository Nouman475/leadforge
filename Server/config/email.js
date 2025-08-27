const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ''
  }
};

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(emailConfig);

// Email service object
const emailService = {
  // Send email function
  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'mnoumankhalid195@gmail.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
      };

      const info = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify email configuration
  async verifyConnection() {
    try {
      await transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
};

// Export both the service and transporter for flexibility
module.exports = {
  emailService,
  transporter,
  sendEmail: emailService.sendEmail.bind(emailService)
};
