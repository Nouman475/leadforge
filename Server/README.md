# LeadForge Server

A comprehensive backend server for the LeadForge lead generation and management system, built with Node.js, Express, and PostgreSQL.

## Features

- **Lead Management**: Complete CRUD operations for leads with status tracking
- **Email Templates**: AI-powered email template generation and management
- **Bulk Email Campaigns**: Send personalized bulk emails with tracking
- **Dashboard Analytics**: Comprehensive statistics and performance metrics
- **PostgreSQL Database**: Robust data persistence with Sequelize ORM
- **RESTful API**: Well-structured API endpoints following REST principles
- **Email Service**: Integrated email sending with Nodemailer
- **Data Validation**: Request validation with Joi
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: API rate limiting for security
- **CORS Support**: Cross-origin resource sharing configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Email**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to server directory**
   ```bash
   cd Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=leadforge_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Email (for bulk email functionality)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

4. **Database Setup**
   ```bash
   # Create database (make sure PostgreSQL is running)
   createdb leadforge_db
   
   # Run migrations
   npm run migrate
   
   # Seed sample data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will be running at `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Leads
- `GET /api/leads` - Get all leads (with filtering, pagination, search)
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/bulk` - Bulk create leads
- `GET /api/leads/stats` - Get lead statistics

### Email Templates
- `GET /api/email-templates` - Get all templates (with filtering)
- `GET /api/email-templates/:id` - Get single template
- `POST /api/email-templates` - Create new template
- `PUT /api/email-templates/:id` - Update template
- `DELETE /api/email-templates/:id` - Delete template
- `POST /api/email-templates/:id/clone` - Clone template
- `POST /api/email-templates/:id/increment-usage` - Increment usage count
- `GET /api/email-templates/stats` - Get template statistics

### Email Campaigns
- `GET /api/email-campaigns` - Get all campaigns
- `GET /api/email-campaigns/:id` - Get single campaign
- `POST /api/email-campaigns` - Create and send campaign
- `PUT /api/email-campaigns/:id` - Update campaign
- `DELETE /api/email-campaigns/:id` - Delete campaign
- `GET /api/email-campaigns/:id/history` - Get campaign email history
- `GET /api/email-campaigns/stats` - Get campaign statistics

### Dashboard
- `GET /api/dashboard` - Get comprehensive dashboard stats
- `GET /api/dashboard/funnel` - Get lead funnel data
- `GET /api/dashboard/email-performance` - Get email performance over time
- `GET /api/dashboard/template-usage` - Get template usage statistics

## Database Schema

### Leads
- `id` (UUID, Primary Key)
- `name` (String, Required)
- `email` (String, Required, Unique)
- `phone` (String, Optional)
- `company` (String, Optional)
- `status` (Enum: new, contacted, qualified, proposal, closed)
- `notes` (Text, Optional)
- `source` (String, Optional)
- `lead_score` (Integer, 0-100)
- `last_contacted` (DateTime, Optional)
- `created_at`, `updated_at` (DateTime)

### Email Templates
- `id` (UUID, Primary Key)
- `name` (String, Required)
- `category` (Enum: introduction, followup, proposal, meeting, thankyou, reminder, custom)
- `tone` (Enum: professional, friendly, casual, formal, persuasive)
- `subject` (String, Optional)
- `content` (Text, Required)
- `is_active` (Boolean, Default: true)
- `usage_count` (Integer, Default: 0)
- `created_at`, `updated_at` (DateTime)

### Email Campaigns
- `id` (UUID, Primary Key)
- `name` (String, Required)
- `subject` (String, Required)
- `content` (Text, Required)
- `template_id` (UUID, Foreign Key, Optional)
- `status` (Enum: draft, scheduled, sending, completed, failed)
- `scheduled_at` (DateTime, Optional)
- `sent_at` (DateTime, Optional)
- `total_recipients` (Integer)
- `emails_sent` (Integer)
- `emails_failed` (Integer)
- `created_at`, `updated_at` (DateTime)

### Email History
- `id` (UUID, Primary Key)
- `campaign_id` (UUID, Foreign Key, Optional)
- `lead_id` (UUID, Foreign Key, Required)
- `template_id` (UUID, Foreign Key, Optional)
- `recipient_email` (String, Required)
- `recipient_name` (String, Required)
- `subject` (String, Required)
- `content` (Text, Required)
- `status` (Enum: pending, sent, failed, bounced, opened, clicked)
- `sent_at`, `opened_at`, `clicked_at` (DateTime, Optional)
- `error_message` (Text, Optional)
- `email_provider_id` (String, Optional)
- `created_at`, `updated_at` (DateTime)

## Email Configuration

The server supports email sending through SMTP. Configure your email provider in the `.env` file:

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `SMTP_PASSWORD`

### Other Providers
Update `SMTP_HOST` and `SMTP_PORT` according to your provider's settings.

## Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

### Project Structure
```
Server/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── leadController.js    # Lead management logic
│   ├── emailTemplateController.js
│   ├── emailCampaignController.js
│   └── dashboardController.js
├── middleware/
│   ├── errorHandler.js      # Error handling middleware
│   └── validation.js        # Request validation middleware
├── models/
│   ├── Lead.js             # Lead model
│   ├── EmailTemplate.js    # Email template model
│   ├── EmailCampaign.js    # Email campaign model
│   ├── EmailHistory.js     # Email history model
│   └── index.js            # Model associations
├── routes/
│   ├── leadRoutes.js       # Lead API routes
│   ├── emailTemplateRoutes.js
│   ├── emailCampaignRoutes.js
│   └── dashboardRoutes.js
├── scripts/
│   ├── migrate.js          # Database migration script
│   └── seed.js             # Database seeding script
├── services/
│   └── emailService.js     # Email sending service
├── .env.example            # Environment variables template
├── package.json
├── server.js               # Main server file
└── README.md
```

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Error Handling**: Secure error responses
- **Environment Variables**: Sensitive data protection

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up SSL/TLS certificates
4. Configure reverse proxy (nginx)
5. Set up database backups
6. Configure monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
