// Professional email templates for individual developer outreach

const getEmailTemplate = (
  content,
  category = "default",
  tone = "professional",
  userInfo = {},
  leadData = {}
) => {
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.7;
        color: #2c3e50;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        margin: 0;
        padding: 20px 0;
      }
      
      .email-container {
        max-width: 650px;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #e8f4fd;
      }
      
      .email-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 50px 40px;
        text-align: center;
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .email-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 200px;
        height: 200px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
      }
      
      .email-header::after {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -10%;
        width: 150px;
        height: 150px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 50%;
      }
      
      .header-content {
        position: relative;
        z-index: 2;
      }
      
      .email-header h1 {
        font-family: 'Poppins', sans-serif;
        font-size: 32px;
        font-weight: 600;
        margin-bottom: 12px;
        letter-spacing: -0.8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .email-header p {
        font-size: 18px;
        opacity: 0.95;
        font-weight: 400;
        letter-spacing: 0.3px;
      }
      
      .developer-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        margin-top: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .email-body {
        padding: 50px 40px;
        background: white;
      }
      
      .greeting {
        font-size: 20px;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 25px;
        font-family: 'Poppins', sans-serif;
      }
      
      .content {
        font-size: 17px;
        line-height: 1.8;
        color: #4a5568;
        margin-bottom: 35px;
      }
      
      .content p {
        margin-bottom: 20px;
      }
      
      .content p:last-child {
        margin-bottom: 0;
      }
      
      .highlight-box {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 30px;
        border-radius: 12px;
        border-left: 5px solid #667eea;
        margin: 30px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .highlight-box h3 {
        color: #2d3748;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 15px;
        font-family: 'Poppins', sans-serif;
      }
      
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin: 25px 0;
      }
      
      .skill-item {
        display: flex;
        align-items: center;
        padding: 15px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }
      
      .skill-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        border-color: #667eea;
      }
      
      .skill-icon {
        font-size: 24px;
        margin-right: 12px;
      }
      
      .skill-text {
        font-weight: 500;
        color: #2d3748;
        font-size: 15px;
      }
      
      .cta-section {
        text-align: center;
        margin: 40px 0 30px 0;
        padding: 30px;
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      
      .cta-text {
        font-size: 18px;
        color: #2d3748;
        margin-bottom: 20px;
        font-weight: 500;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }
      
      .signature {
        margin-top: 45px;
        padding-top: 35px;
        border-top: 2px solid #e2e8f0;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        padding: 35px 30px 25px 30px;
        border-radius: 12px;
        margin-bottom: 0;
      }
      
      .signature-profile {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      
      .signature-info {
        flex: 1;
      }
      
      .signature-name {
        font-weight: 700;
        color: #1a202c;
        font-size: 22px;
        margin-bottom: 6px;
        font-family: 'Poppins', sans-serif;
      }
      
      .signature-title {
        color: #667eea;
        font-weight: 600;
        margin-bottom: 12px;
        font-size: 16px;
      }
      
      .signature-contact {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
        font-size: 15px;
        color: #4a5568;
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .contact-icon {
        font-size: 16px;
        color: #667eea;
      }
      
      .contact-link {
        color: #4a5568;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      
      .contact-link:hover {
        color: #667eea;
      }
      
      .email-footer {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        padding: 25px 40px;
        text-align: center;
        color: white;
      }
      
      .footer-text {
        font-size: 13px;
        opacity: 0.8;
        line-height: 1.6;
      }
      
      .unsubscribe-link {
        color: #90cdf4;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s ease;
      }
      
      .unsubscribe-link:hover {
        color: #63b3ed;
        text-decoration: underline;
      }
      
      /* Responsive design */
      @media only screen and (max-width: 600px) {
        body {
          padding: 10px 0;
        }
        
        .email-container {
          margin: 0 10px;
          border-radius: 12px;
        }
        
        .email-header {
          padding: 35px 25px;
        }
        
        .email-header h1 {
          font-size: 26px;
        }
        
        .email-body {
          padding: 30px 25px;
        }
        
        .signature {
          padding: 25px 20px 20px 20px;
        }
        
        .signature-profile {
          flex-direction: column;
          text-align: center;
        }
        
        .signature-avatar {
          align-self: center;
        }
        
        .signature-contact {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .email-footer {
          padding: 20px 25px;
        }
        
        .skills-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;

  // Get dynamic header and greeting based on category and tone
  const getHeaderContent = (category, tone, company) => {
    const headers = {
      proposal: {
        professional: {
          title: "Let's Build Something Great",
          subtitle: `Custom development solutions for ${company}`,
          badge: "Full-Stack MERN Developer",
        },
        friendly: {
          title: "Ready to Collaborate?",
          subtitle: `Exciting tech possibilities for ${company}`,
          badge: "🚀 Your Tech Partner",
        },
        formal: {
          title: "Development Partnership",
          subtitle: `Professional solutions for ${company}`,
          badge: "⚡ MERN Stack Expert",
        },
      },
      follow_up: {
        professional: {
          title: "Following Our Discussion",
          subtitle: `Continuing the conversation about ${company}`,
          badge: " Follow-up",
        },
        friendly: {
          title: "Still Excited to Connect!",
          subtitle: `More ideas for ${company}'s success`,
          badge: "Checking In",
        },
        formal: {
          title: "Continued Correspondence",
          subtitle: `Professional follow-up for ${company}`,
          badge: "Status Update",
        },
      },
      introduction: {
        professional: {
          title: "Muhammad Nouman",
          subtitle: `Full-Stack Developer ready to help ${company} grow`,
          badge: "Nice to Meet You",
        },
        friendly: {
          title: "Hey There!",
          subtitle: `Let's create something amazing for ${company}`,
          badge: "Problem Solver",
        },
        formal: {
          title: "Professional Introduction",
          subtitle: `Development expertise for ${company}`,
          badge: "Certified Developer",
        },
      },
      default: {
        professional: {
          title: "Muhammad Nouman",
          subtitle: `Full-Stack Developer at your service`,
          badge: "MERN Stack Specialist",
        },
      },
    };

    return headers[category]?.[tone] || headers.default.professional;
  };

  const getGreeting = (tone, firstName) => {
    const greetings = {
      professional: `Hello ${firstName},`,
      friendly: `Hi ${firstName}! 👋`,
      formal: `Dear ${firstName},`,
    };
    return greetings[tone] || greetings.professional;
  };

  const headerContent = getHeaderContent(
    category,
    tone,
    leadData.company || "your company"
  );

  const firstName =
    leadData.first_name || leadData.name?.split(" ")[0] || "there";
  const greeting = getGreeting(tone, firstName);

  const dynamicTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerContent.title}</title>
    ${baseStyles}
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-content">
          <h1>${headerContent.title}</h1>
          <p>${headerContent.subtitle}</p>
          <div class="developer-badge">${headerContent.badge}</div>
        </div>
      </div>
      
      <div class="email-body">
        <div class="greeting">
          ${greeting}
        </div>
        
        <div class="content">
          ${content}
        </div>
        
     
          
          <div class="signature-contact">
            <div class="contact-item">
  <span class="contact-icon">📧</span>&nbsp;&nbsp;
  <a href="mailto:mnoumankhalid195@gmail.com" class="contact-link">
    mnoumankhalid195@gmail.com
  </a>
</div>

<div class="contact-item">
  <span class="contact-icon">📱</span>&nbsp;&nbsp;
  <span class="contact-link">+92 3028954240</span>
</div>

<div class="contact-item">
  <span class="contact-icon">🌐</span>&nbsp;&nbsp;
  <a href="https://noumanthedev.web.app" class="contact-link">
    noumanthedev.web.app
  </a>
</div>

<div class="contact-item">
  <span class="contact-icon">
  <b>Li</b>
  </span>&nbsp;&nbsp;
  <a href="https://linkedin.com/in/noumandev" class="contact-link">
    LinkedIn Profile
  </a>
</div>

          </div>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="footer-text">
          This email was sent by Muhammad Nouman, an independent Full-Stack Developer<br>
          <a href="#" class="unsubscribe-link">Unsubscribe from future emails</a>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

  return dynamicTemplate;
};

// Generate engaging email content based on category and tone
const generateEmailContent = (category, tone, lead) => {
  const contents = {
    proposal: {
      professional: `I hope you're doing well! I'm Muhammad Nouman, a Full-Stack MERN Developer who's passionate about building digital solutions that actually make a difference.

I've been researching companies in your industry, and ${
        lead.company || "your company"
      } really caught my attention. Your approach to business is impressive, and I can see huge potential for digital enhancement that could give you a competitive edge.

<div class="highlight-box">
  <h3>🚀 What I Can Build for You:</h3>
  <div class="skills-grid">
    <div class="skill-item">
      <span class="skill-icon">⚡</span>
      <span class="skill-text">Lightning-fast Web Applications</span>
    </div>
    <div class="skill-item">
      <span class="skill-icon">📱</span>
      <span class="skill-text">Mobile Apps</span>
    </div>
    <div class="skill-item">
      <span class="skill-icon">💼</span>
      <span class="skill-text">Business Management Systems</span>
    </div>
    <div class="skill-item">
      <span class="skill-icon">🛒</span>
      <span class="skill-text">E-commerce Platforms</span>
    </div>
    <div class="skill-item">
      <span class="skill-icon">📊</span>
      <span class="skill-text">Real-time Analytics Dashboards</span>
    </div>
    <div class="skill-item">
      <span class="skill-icon">💳</span>
      <span class="skill-text">Payment Gateway Integration</span>
    </div>
  </div>
</div>

I recently helped a trading company increase their operational efficiency by 60% through a custom dashboard, and built an e-commerce platform that boosted sales by 40% in the first quarter. These aren't just numbers – they're real results that transformed businesses.

<div class="cta-section">
  <div class="cta-text">Ready to discuss how technology can accelerate ${
    lead.company || "your business"
  }?</div>
  <a href="mailto:mnoumankhalid195@gmail.com?subject=Development Discussion - ${
    lead.company || "Business"
  }" class="cta-button">Let's Schedule a Call</a>
</div>

I believe every business deserves technology that works as hard as they do. Would you be open to a 15-minute conversation to explore what's possible?`,

      friendly: `Hey! Hope you're having an awesome day! 🌟

I'm Muhammad Nouman, and I absolutely LOVE building digital experiences that make people go "wow!" I came across ${
        lead.company || "your company"
      } and honestly, I got excited about all the cool things we could create together.

<div class="highlight-box">
  <h3>🎯 Here's What Gets Me Excited:</h3>
  <p>Building apps and websites that don't just look pretty – they actually solve real problems and make life easier! Whether it's a sleek mobile app, a powerful web platform, or an e-commerce site that converts like crazy, I'm all about creating digital magic.</p>
</div>

<div class="skills-grid">
  <div class="skill-item">
    <span class="skill-icon">🚀</span>
    <span class="skill-text">React.js & React Native Apps</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">⚡</span>
    <span class="skill-text">Node.js Backend Systems</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">💎</span>
    <span class="skill-text">Modern UI/UX Design</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">🔥</span>
    <span class="skill-text">Performance Optimization</span>
  </div>
</div>

I just finished a project where I built a real-time trading platform that handles thousands of transactions seamlessly, and let me tell you – seeing clients succeed because of something I built? That's pure joy right there! 🎉

<div class="cta-section">
  <div class="cta-text">Want to chat about some exciting possibilities for ${
    lead.company || "your business"
  }?</div>
  <a href="mailto:mnoumankhalid195@gmail.com?subject=Let's Collaborate - ${
    lead.company || "Business"
  }" class="cta-button">I'm All Ears!</a>
</div>

How about a quick virtual coffee chat? I promise it'll be fun and full of ideas! ☕`,

      formal: `I trust this message finds you well. I am Muhammad Nouman, a certified Full-Stack MERN Developer with extensive experience in enterprise-grade application development.

Having conducted thorough research on ${
        lead.company || "your organization"
      }, I am impressed by your market positioning and strategic vision. I believe there is significant potential for technological enhancement that could further strengthen your competitive advantage.

<div class="highlight-box">
  <h3>Professional Expertise & Capabilities:</h3>
  <p>My technical proficiency encompasses the complete MERN stack ecosystem, with particular emphasis on scalable architecture design, performance optimization, and security implementation. I specialize in developing sophisticated digital solutions that align with organizational objectives and deliver measurable business value.</p>
</div>

<div class="skills-grid">
  <div class="skill-item">
    <span class="skill-icon">🏗️</span>
    <span class="skill-text">Enterprise Architecture Design</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">🔒</span>
    <span class="skill-text">Security & Compliance Systems</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">📈</span>
    <span class="skill-text">Scalable Database Solutions</span>
  </div>
  <div class="skill-item">
    <span class="skill-icon">⚙️</span>
    <span class="skill-text">API Development & Integration</span>
  </div>
</div>

My recent portfolio includes successful implementations for financial institutions and trading enterprises, demonstrating proven capability in delivering mission-critical applications that support business growth and operational efficiency.

<div class="cta-section">
  <div class="cta-text">I would welcome the opportunity to discuss how my expertise could benefit ${
    lead.company || "your organization"
  }</div>
  <a href="mailto:mnoumankhalid195@gmail.com?subject=Professional Consultation - ${
    lead.company || "Organization"
  }" class="cta-button">Schedule Consultation</a>
</div>

Would you be available for a brief consultation to explore potential collaboration opportunities?`,
    },
  };

  return contents[category]?.[tone] || contents.proposal.professional;
};

// Generate compelling email subjects
const generateEmailSubject = (category, tone, lead) => {
  const subjects = {
    proposal: {
      professional: `💻 Custom Development Solutions for ${
        lead.company || "Your Business"
      }`,
      friendly: `🚀 Let's Build Something Amazing Together!`,
      formal: `Professional Development Services - ${
        lead.company || "Your Organization"
      }`,
    },
    follow_up: {
      professional: `Following Up: Development Opportunities for ${
        lead.company || "Your Company"
      }`,
      friendly: `😊 Still Excited About Our Collaboration!`,
      formal: `Re: Development Services Discussion - ${
        lead.company || "Your Organization"
      }`,
    },
    introduction: {
      professional: `👋 Muhammad Nouman - Full-Stack Developer for ${
        lead.company || "Your Business"
      }`,
      friendly: `Hey ${
        lead.company || "There"
      }! Let's Create Something Awesome 🌟`,
      formal: `Professional Introduction - Development Expertise for ${
        lead.company || "Your Organization"
      }`,
    },
  };

  return subjects[category]?.[tone] || subjects.proposal.professional;
};

// Helper function to wrap plain text content in professional HTML
const wrapContentInTemplate = (
  content,
  category = "default",
  tone = "professional",
  userInfo = {},
  leadData = {}
) => {
  // Convert plain text to HTML with proper formatting
  const htmlContent = content
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n            ");

  return getEmailTemplate(htmlContent, category, tone, userInfo, leadData);
};

module.exports = {
  getEmailTemplate,
  wrapContentInTemplate,
  generateEmailContent,
  generateEmailSubject,
};
