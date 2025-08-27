# LeadForge Email System Enhancements

## Overview
This document outlines the comprehensive enhancements made to the LeadForge email system, implementing advanced tracking, personalization, and automation features.

## 🚀 New Features Implemented

### 1. Database Enhancements
- **Lead Statistics Tracking**: Added columns for email counts, scores, and engagement metrics
- **Email History Improvements**: Added retry logic, idempotency, and webhook support
- **New Lead Statuses**: `hot_lead`, `unresponsive`, `contact_failed`, `unsubscribed`

### 2. Email Personalization
- **Token Support**: Both `{{token}}` and `[token]` formats supported
- **Available Tokens**:
  - `{{first_name}}`, `{{last_name}}`, `{{full_name}}`
  - `{{email}}`, `{{company}}`, `{{phone}}`, `{{status}}`
- **Backward Compatibility**: Legacy `[name]` format still works

### 3. Webhook System
- **Email Provider Integration**: Handles opens, clicks, bounces, unsubscribes
- **Real-time Updates**: Automatic lead scoring and status updates
- **Idempotency**: Prevents duplicate webhook processing

### 4. Lead Scoring & Automation
- **Dynamic Scoring**: Points for opens (10), clicks (25), quick responses (20)
- **Time Decay**: Older interactions worth less over time
- **Automatic Status Updates**: Based on engagement patterns
- **High-Value Lead Identification**: Score ≥70 flagged for attention

### 5. Retry & Reliability
- **Exponential Backoff**: 1s, 5s, 15s delays for retries
- **Max Retry Limit**: 3 attempts before permanent failure
- **Batch Processing**: Handles failed emails in manageable chunks
- **Automatic Scheduler**: Runs every 5 minutes

### 6. Security & Compliance
- **HTML Sanitization**: Prevents XSS and injection attacks
- **Unsubscribe Links**: Automatic compliance footer
- **Token Validation**: Only safe personalization tokens allowed
- **GDPR Ready**: Unsubscribe tracking and data management

## 📊 Database Schema Changes

### Leads Table Additions
```sql
emails_sent_count INTEGER DEFAULT 0
emails_failed_count INTEGER DEFAULT 0  
emails_opened_count INTEGER DEFAULT 0
emails_clicked_count INTEGER DEFAULT 0
last_email_at DATE
last_template_id UUID
unsubscribed BOOLEAN DEFAULT false
unsubscribed_at DATE
```

### Email History Table Additions
```sql
retry_count INTEGER DEFAULT 0
message_uuid UUID UNIQUE
provider_response TEXT
bounce_reason STRING
unsubscribe_token STRING UNIQUE
```

## 🔗 New API Endpoints

### Webhooks
- `POST /api/webhooks/email-events` - Handle provider webhooks
- `GET /api/webhooks/unsubscribe/:token` - Unsubscribe endpoint

### Enhanced Tracking
- Automatic tracking pixels in all emails
- Click tracking through redirect URLs
- Unsubscribe links in email footers

## 🛠️ Usage Instructions

### Running Migrations
```bash
npm run migrate:new
```

### Starting Retry Service
The retry service starts automatically with the server and runs every 5 minutes.

### Webhook Configuration
Configure your email provider to send webhooks to:
```
POST https://your-domain.com/api/webhooks/email-events
```

Expected webhook payload:
```json
{
  "event": "opened|clicked|bounced|unsubscribed",
  "data": {
    "email_provider_id": "provider-message-id",
    "message_uuid": "uuid",
    "reason": "bounce reason (for bounces)"
  }
}
```

### Template Personalization
Use these tokens in your email templates:
```html
<p>Hi {{first_name}},</p>
<p>We noticed you work at {{company}}.</p>
<p>You can reach us at {{email}} if you have questions.</p>
```

## 📈 Lead Scoring Rules

### Point System
- **Email Opened**: +10 points
- **Email Clicked**: +25 points  
- **Quick Response** (< 1 hour): +20 points
- **Multiple Opens**: +5 points each
- **Multiple Clicks**: +15 points each

### Status Automation
- **Score ≥70**: Auto-qualify as `qualified`
- **2+ Clicks**: Mark as `hot_lead`
- **5+ Emails, 0 Opens**: Mark as `unresponsive`
- **Hard Bounce**: Mark as `contact_failed`

### Template Category Bonuses
- **Proposal Templates**: 1.5x score multiplier
- **Follow-up Templates**: 1.2x score multiplier

## 🔒 Security Features

### HTML Sanitization
- Removes dangerous tags: `<script>`, `<object>`, `<embed>`
- Strips event handlers: `onclick`, `onload`, etc.
- Validates URLs and attributes
- Preserves safe formatting tags

### Token Validation
- Only whitelisted personalization tokens allowed
- Prevents template injection attacks
- Validates token syntax and names

## 🚦 Monitoring & Maintenance

### Health Checks
- Monitor webhook endpoint response times
- Track retry service success rates
- Watch lead score distribution changes

### Performance Optimization
- Batch processing for large operations
- Database indexes on key lookup fields
- Efficient webhook deduplication

### Troubleshooting
- Check logs for webhook processing errors
- Monitor retry queue for stuck emails
- Validate email provider configuration

## 🔄 Migration Path

1. **Run Database Migrations**: `npm run migrate:new`
2. **Update Environment Variables**: Add `BASE_URL` for tracking links
3. **Configure Email Provider**: Set up webhook endpoints
4. **Test Personalization**: Verify token replacement works
5. **Monitor Lead Scores**: Check scoring algorithm performance

## 📝 Next Steps

### Recommended Enhancements
- A/B testing for email templates
- Advanced segmentation rules
- Email scheduling and drip campaigns
- Integration with CRM systems
- Advanced analytics dashboard

### Performance Scaling
- Redis caching for lead scores
- Queue system for high-volume sending
- Database read replicas for analytics
- CDN for tracking pixel delivery
