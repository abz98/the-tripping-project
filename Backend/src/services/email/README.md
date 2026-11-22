# Email Service

Handles sending emails using Nodemailer with Gmail SMTP.

## Features

- Send OTP verification emails
- HTML email templates
- Gmail integration

## Configuration

Configure Gmail credentials in `.env`:

```env
EMAIL_NAME=your-email@gmail.com
EMAIL_TOKEN=your-app-password
```

### Getting Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to Security > 2-Step Verification > App passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_TOKEN`

## Usage

```typescript
import { emailService } from "./services/email";

// Send OTP email
await emailService.sendOTPEmail("user@example.com", "1221", "John Doe");
```

## Email Template

The OTP email includes:

- Professional HTML template
- OTP code in a highlighted box
- 10-minute validity notice
- Responsive design


## Redis Setup

To run Redis locally using Docker:

```bash
docker run -d \
  --name redis-local \
  -p 6379:6379 \
  redis:latest
