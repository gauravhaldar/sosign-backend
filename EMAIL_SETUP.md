# Email Configuration Setup

To enable automatic email notifications when petitions are created, you need to configure the following environment variables in your `.env` file:

## Required Environment Variables

Add these variables to your `backend/.env` file:

```env
# Email Configuration
# Choose email service: 'gmail' for Gmail SMTP or 'custom' for custom SMTP
EMAIL_SERVICE=gmail

# For Gmail SMTP
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# For custom SMTP (if EMAIL_SERVICE is not 'gmail')
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false

# Email sender information
EMAIL_FROM=SOSIGN <noreply@sosign.com>

# Frontend URL (for generating petition links in emails)
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password (not your regular Gmail password) in `EMAIL_PASSWORD`

## Custom SMTP Setup

If you're using a different email provider (like SendGrid, Mailgun, etc.):

1. Set `EMAIL_SERVICE=custom`
2. Configure your SMTP settings:
   - `SMTP_HOST`: Your SMTP server hostname
   - `SMTP_PORT`: Usually 587 for TLS or 465 for SSL
   - `SMTP_SECURE`: Set to `true` for SSL (port 465) or `false` for TLS (port 587)
   - `EMAIL_USER`: Your SMTP username
   - `EMAIL_PASSWORD`: Your SMTP password

## Testing

After configuration, the system will automatically send emails to decision makers when:
- A new petition is created
- The petition has decision makers with email addresses
- Email configuration is properly set up

## Email Template

The system sends a professional HTML email with:
- Petition title and details
- Creator information
- Direct link to view the petition
- Professional SOSIGN branding

## Troubleshooting

- Check your email credentials
- Ensure your email provider allows SMTP access
- For Gmail, make sure you're using an App Password, not your regular password
- Check the server logs for email sending errors
