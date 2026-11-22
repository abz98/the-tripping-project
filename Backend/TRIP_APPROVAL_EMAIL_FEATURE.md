# Trip Approval Email Notification Feature

## Overview

Implemented automatic email notifications to all admin users when a host creates or submits a trip for approval.

## Changes Made

### 1. Email Service (`src/services/email/email.service.ts`)

- Added new method `sendTripApprovalNotification()` to send formatted emails to admins
- Email includes:
  - Trip title and ID
  - Host name and email
  - Destinations
  - Price per person
  - Direct link to review the trip in admin panel

### 2. Trips Service (`src/services/trips/trips.service.ts`)

- Added `notifyAdminsAboutNewTrip()` helper function that:
  - Finds all users with ADMIN role
  - Sends email notifications to each verified admin
  - Uses Promise.allSettled to handle multiple emails gracefully
- Updated `create()` method to send notifications when trip status is "PENDING_APPROVAL"
- Updated `submitForApproval()` method to send notifications when a draft trip is submitted

### 3. Environment Configuration (`src/config/env.config.ts`)

- Added `adminPanelUrl` configuration field
- Defaults to `http://localhost:4200/admin` if not set

### 4. Environment Variables (`.env`)

- Added `ADMIN_PANEL_URL` variable for configuring the admin panel URL in emails

## How It Works

### Scenario 1: Host creates trip with PENDING_APPROVAL status

```typescript
// When creating a trip with status: "PENDING_APPROVAL"
const trip = await tripService.create(hostId, {
  title: "Amazing Trip",
  status: "PENDING_APPROVAL",
  // ... other fields
});
// → Admins receive email notification immediately
```

### Scenario 2: Host submits draft trip for approval

```typescript
// When submitting a draft trip
await tripService.submitForApproval(tripId, hostId);
// → Admins receive email notification
```

## Email Template Features

- Professional HTML email with responsive design
- Orange theme for approval notifications
- Trip details in a highlighted box
- Call-to-action button linking to admin panel
- Plain text fallback for email clients that don't support HTML

## Error Handling

- Email failures don't block trip creation/submission
- Errors are logged but don't throw exceptions
- Uses Promise.allSettled to ensure all admin emails are attempted
- Gracefully handles missing admin role or no admin users

## Configuration

Set the admin panel URL in your `.env` file:

```
ADMIN_PANEL_URL=https://admin.yoursite.com
```

## Testing

To test the feature:

1. Ensure you have users with ADMIN role in the database
2. Create a trip with `status: "PENDING_APPROVAL"` OR
3. Create a draft trip and call `submitForApproval()`
4. Check admin email inboxes for notification

## Notes

- Only verified admin users receive notifications
- Email sending is non-blocking and won't fail trip operations
- All email operations are logged for debugging
