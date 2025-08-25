# LeadForge

A comprehensive lead management automation tool built with React.js and Ant Design. This application helps you manage leads, generate AI-powered email templates, send bulk emails, and track your sales pipeline.

## Features

### 🎯 Lead Management
- **CRUD Operations**: Add, edit, delete, and view leads
- **Status Tracking**: Track leads through different stages (New, Contacted, Qualified, Proposal Sent, Closed)
- **Export Functionality**: Export leads to Excel (.xlsx) or CSV formats
- **Search & Filter**: Filter leads by status and search functionality
- **Data Persistence**: All data is stored locally in browser storage

### 📊 Dashboard
- **Real-time Statistics**: View total leads, conversion rates, and status distribution
- **Visual Analytics**: Progress bars showing lead distribution across different statuses
- **Recent Activity**: Quick view of recently added leads

### 🤖 AI Email Templates
- **Smart Generation**: AI-powered email template generation for different scenarios
- **Multiple Categories**: Introduction, Follow-up, Proposal, Meeting Request, Thank You, Reminder
- **Tone Customization**: Professional, Friendly, Casual, Formal, Persuasive tones
- **Template Library**: Save and reuse your favorite templates
- **Custom Prompts**: Generate templates based on custom requirements

### 📧 Bulk Email System
- **Mass Communication**: Send personalized emails to multiple leads at once
- **Smart Personalization**: Automatic placeholder replacement with lead data
- **Template Integration**: Use saved templates for bulk campaigns
- **Progress Tracking**: Real-time progress monitoring during bulk sends
- **Email History**: Track all sent emails with delivery status
- **Preview Function**: Preview personalized emails before sending

## Installation

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm start
   ```
4. **Open your browser** and navigate to `http://localhost:3000`

## Dependencies

- **React 18.2.0**: Core framework
- **Ant Design 5.12.8**: UI component library
- **XLSX 0.18.5**: Excel file generation
- **File-saver 2.0.5**: File download functionality
- **Axios 1.6.2**: HTTP client for API calls
- **Moment 2.29.4**: Date manipulation
- **UUID 9.0.1**: Unique ID generation

## Usage Guide

### Managing Leads
1. Navigate to **Lead Management** from the sidebar
2. Click **Add Lead** to create new leads
3. Use the **Export Excel/CSV** buttons to download your lead data
4. Edit or delete leads using the action buttons in the table

### Creating Email Templates
1. Go to **Email Templates** section
2. Select a category and tone for your email
3. Click **Generate Template** to create AI-powered content
4. Customize the generated template as needed
5. Save templates for future use

### Sending Bulk Emails
1. Navigate to **Bulk Email** section
2. Filter leads by status if needed
3. Select recipients using checkboxes
4. Choose a saved template or create custom content
5. Preview emails before sending
6. Click **Send Bulk Email** to start the campaign

## Email Personalization

The system automatically personalizes emails using these placeholders:
- `[Name]` - Lead's name
- `[Company Name]` - Lead's company
- `[Email]` - Lead's email address
- `[Phone]` - Lead's phone number
- `[Your Name]` - Your name (configurable)
- `[Your Company]` - Your company name (configurable)
- `[Your Title]` - Your job title (configurable)

## Data Storage

All data is stored locally in your browser's localStorage:
- **Leads**: Stored as JSON in 'leads' key
- **Email Templates**: Stored as JSON in 'emailTemplates' key
- **Email History**: Stored as JSON in 'emailHistory' key

## Future Enhancements

- **Real Email Integration**: Connect with email providers (Gmail, Outlook)
- **CRM Integration**: Sync with popular CRM systems
- **Advanced Analytics**: Detailed reporting and analytics
- **Team Collaboration**: Multi-user support
- **API Integration**: Connect with external lead sources
- **Proposal Generator**: Automated proposal creation and sending

## Support

For issues or feature requests, please create an issue in the project repository.

## License

This project is licensed under the MIT License.
