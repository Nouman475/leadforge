# MongoDB Setup Guide for LeadForge

## 🎉 Successfully Converted from PostgreSQL to MongoDB!

Your LeadForge application has been converted to use MongoDB instead of PostgreSQL.

## 📋 Prerequisites

1. **Install MongoDB**
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

2. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Server
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Update your `.env` file with MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/leadforge
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leadforge
```

### 3. Start MongoDB (Local Installation)

```bash
# Windows
mongod

# Or if installed as service, it should already be running
```

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## 📊 Database Models

### Lead Model
- name, email, phone, company
- status: new, contacted, qualified, proposal, closed, lost
- score, emails_sent_count, emails_opened_count, emails_clicked_count
- timestamps

### EmailTemplate Model
- name, subject, content
- category: introduction, followup, proposal, meeting, thankyou, reminder, custom
- tone: professional, friendly, casual, formal, persuasive
- usage_count, is_favorite

### EmailCampaign Model
- name, subject, content
- status: draft, scheduled, sending, completed, failed
- emails_sent, emails_failed
- timestamps

### EmailHistory Model
- campaign_id, lead_id
- recipient_email, recipient_name
- subject, content
- status: pending, sent, failed, bounced, opened, clicked
- tracking data: opened_at, clicked_at, open_count, click_count

## 🔧 Key Changes from PostgreSQL

1. **No Sequelize** - Using Mongoose ODM
2. **No Migrations** - MongoDB is schema-less
3. **ObjectId** instead of UUID for IDs
4. **Simpler Queries** - MongoDB query syntax
5. **Better Performance** - NoSQL advantages

## 📝 API Endpoints (Same as Before)

### Leads
- GET `/api/leads` - Get all leads
- GET `/api/leads/:id` - Get single lead
- POST `/api/leads` - Create lead
- PUT `/api/leads/:id` - Update lead
- DELETE `/api/leads/:id` - Delete lead
- POST `/api/leads/bulk` - Bulk import leads

### Email Templates
- GET `/api/email-templates` - Get all templates
- GET `/api/email-templates/:id` - Get single template
- POST `/api/email-templates` - Create template
- PUT `/api/email-templates/:id` - Update template
- DELETE `/api/email-templates/:id` - Delete template

### Email Campaigns
- GET `/api/email-campaigns` - Get all campaigns
- GET `/api/email-campaigns/:id` - Get single campaign
- POST `/api/email-campaigns` - Create campaign
- PUT `/api/email-campaigns/:id` - Update campaign
- DELETE `/api/email-campaigns/:id` - Delete campaign

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics
- GET `/api/dashboard/funnel` - Get lead funnel data
- GET `/api/dashboard/email-performance` - Get email performance
- GET `/api/dashboard/template-usage` - Get template usage

## 🎯 Testing

Test the server:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "LeadForge Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Make sure MongoDB is running
2. Check your MONGODB_URI in .env
3. For local: `mongodb://localhost:27017/leadforge`
4. For Atlas: Use connection string from MongoDB Atlas

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Module Not Found

**Problem:** `Cannot find module 'mongoose'`

**Solution:**
```bash
npm install
```

## 📚 MongoDB Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/docs/
- MongoDB University (Free): https://university.mongodb.com/

## ✅ Verification Checklist

- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] .env file configured
- [ ] Server starts without errors
- [ ] Health check endpoint works
- [ ] Can create leads via API
- [ ] Can create email templates
- [ ] Dashboard loads correctly

## 🎊 You're All Set!

Your LeadForge application is now running on MongoDB. Enjoy the benefits of NoSQL!

For any issues, check the console logs or MongoDB logs for detailed error messages.
