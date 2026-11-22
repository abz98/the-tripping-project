# OTP Service

Handles OTP (One-Time Password) generation, storage, and verification using Redis.

## Features

- Generate 4-digit OTP codes
- Store OTPs in Redis with 10-minute expiration
- Verify OTP codes
- Automatic cleanup after verification

## Configuration

OTPs are stored in Redis with the key format: `otp:{email}`

- **Expiry Time**: 10 minutes (600 seconds)
- **Default OTP**: `1221` (for development)

## Usage

```typescript
import { otpService } from "./services/otp";

// Generate OTP
const otp = await otpService.generateOTP("user@example.com");

// Verify OTP
const isValid = await otpService.verifyOTP("user@example.com", "1221");

// Delete OTP
await otpService.deleteOTP("user@example.com");
```

## Redis Setup

Make sure Redis is running locally or configure the connection in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

To start Redis locally:

```bash
redis-server
```
