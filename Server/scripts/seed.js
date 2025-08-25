const { sequelize } = require('../config/database');
const { Lead, EmailTemplate, EmailCampaign, EmailHistory } = require('../models');

// Sample data
const sampleLeads = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1234567890',
    company: 'Tech Solutions Inc',
    status: 'new',
    notes: 'Interested in our enterprise package',
    source: 'website',
    lead_score: 75
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@startup.com',
    phone: '+1987654321',
    company: 'Startup Innovations',
    status: 'contacted',
    notes: 'Follow up next week',
    source: 'referral',
    lead_score: 85
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@corp.com',
    phone: '+1122334455',
    company: 'Corporate Solutions',
    status: 'qualified',
    notes: 'Ready for proposal',
    source: 'linkedin',
    lead_score: 90
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@business.com',
    phone: '+1555666777',
    company: 'Business Dynamics',
    status: 'proposal',
    notes: 'Proposal sent, awaiting response',
    source: 'cold_email',
    lead_score: 80
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@enterprise.com',
    phone: '+1999888777',
    company: 'Enterprise Group',
    status: 'closed',
    notes: 'Deal closed successfully',
    source: 'trade_show',
    lead_score: 95
  }
];

const sampleTemplates = [
  {
    name: 'Professional Introduction',
    category: 'introduction',
    tone: 'professional',
    subject: 'Partnership Opportunity with [Company Name]',
    content: `Dear [Name],

I hope this email finds you well. My name is [Your Name] from [Your Company], and I'm reaching out because I believe there's a valuable opportunity for collaboration between our organizations.

[Your Company] specializes in [Your Service/Product], and I noticed that [Company Name] has been [specific observation about their business/recent achievement]. This caught my attention because [reason for relevance].

I'd love to schedule a brief 15-minute call to discuss how we might be able to help [Company Name] achieve [specific goal/benefit]. Would you be available for a quick conversation this week or next?

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`,
    is_active: true,
    usage_count: 5
  },
  {
    name: 'Friendly Follow-up',
    category: 'followup',
    tone: 'friendly',
    subject: 'Quick follow-up!',
    content: `Hi [Name],

Thanks again for taking the time to chat with me last week. I really enjoyed our conversation about [topic]!

I've put together some information that I think you'll find helpful regarding [specific topic]. Take a look when you get a chance.

What do you think about hopping on a quick call next week to discuss the next steps?

Talk soon!
[Your Name]`,
    is_active: true,
    usage_count: 3
  },
  {
    name: 'Meeting Request',
    category: 'meeting',
    tone: 'professional',
    subject: 'Meeting Request - [Purpose]',
    content: `Dear [Name],

I hope this email finds you well. I would like to schedule a meeting to discuss [specific purpose/topic].

The meeting would cover:
• [Agenda item 1]
• [Agenda item 2]
• [Agenda item 3]

I estimate we'll need approximately [duration] for our discussion. Would you be available [suggest 2-3 time slots]?

Please let me know what works best for your schedule, and I'll send a calendar invitation with all the details.

Best regards,
[Your Name]`,
    is_active: true,
    usage_count: 2
  }
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Clear existing data (optional - remove in production)
    if (process.env.NODE_ENV === 'development') {
      await EmailHistory.destroy({ where: {} });
      await EmailCampaign.destroy({ where: {} });
      await EmailTemplate.destroy({ where: {} });
      await Lead.destroy({ where: {} });
      console.log('🧹 Existing data cleared');
    }
    
    // Seed leads
    const createdLeads = await Lead.bulkCreate(sampleLeads);
    console.log(`✅ Created ${createdLeads.length} sample leads`);
    
    // Seed email templates
    const createdTemplates = await EmailTemplate.bulkCreate(sampleTemplates);
    console.log(`✅ Created ${createdTemplates.length} sample email templates`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`   - ${createdLeads.length} leads`);
    console.log(`   - ${createdTemplates.length} email templates`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
