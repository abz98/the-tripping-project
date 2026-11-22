# Authentication Implementation Guide

## Overview

Complete authentication system with login, registration, OTP verification, JWT token management, and HTTP interceptor.

## Features Implemented

### 1. Auth Service (`src/app/services/auth.service.ts`)

- **Login**: POST `/auth/login` with email and password
- **Register**: POST `/auth/register` with user details
- **OTP Verification**: POST `/auth/otpVerify` with email and OTP
- **Token Management**: Stores JWT tokens in cookies
- **LocalStorage**: Temporary email storage for OTP verification

### 2. HTTP Interceptor (`src/app/interceptors/auth.interceptor.ts`)

- Automatically adds `Authorization: Bearer <token>` header to all API requests
- Skips authentication for `/auth/register` and `/auth/login` endpoints
- Configured globally in app module

### 3. Auth Guard (`src/app/guards/auth.guard.ts`)

- Protects routes requiring authentication
- Redirects unauthenticated users to login page
- Applied to: home, profile, trip details, host panel routes

### 4. Login Component

**Validation:**

- Email: Required, valid email format
- Password: Required

**Flow:**

1. User enters credentials
2. Form validation runs
3. API call to `/auth/login`
4. On success: Store tokens in cookies and redirect to `/home`
5. On error: Display error message

### 5. Registration Component

**Validation:**

- Full Name: Required, min 2 characters
- Email: Required, valid email format
- Password: Required, min 8 chars, must contain uppercase, lowercase, number, special character
- Confirm Password: Required, must match password

**Flow:**

1. User fills registration form
2. Form validation runs
3. API call to `/auth/register`
4. On success: Store email in localStorage and show OTP screen
5. On error: Display error message

### 6. OTP Verification

**Flow:**

1. User enters 4-digit OTP
2. Retrieve email from localStorage
3. API call to `/auth/otpVerify` with email and OTP
4. On success: Clear localStorage, redirect to login page
5. On error: Display error message

## API Endpoints

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123",
  "full_name": "John Doe",
  "role": "USER"
}
```

### OTP Verification

```bash
POST /api/v1/auth/otpVerify
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "1221"
}
```

## Token Storage

### Cookies (Secure)

- `accessToken`: JWT access token (expires based on API response)
- `refreshToken`: JWT refresh token (30 days)
- `tokenExpiry`: ISO timestamp for token expiration
- Settings: `SameSite=Strict`, `path=/`

### LocalStorage (Temporary)

- `tempEmail`: User email during registration (cleared after OTP verification)

## Protected Routes

All routes except `/login` are protected by `authGuard`:

- `/home`
- `/home/profile`
- `/home/tripDetails/:tripId`
- `/host`
- `/host/edit`

## Environment Configuration

API base URL configured in:

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: false,
  apiBaseUrl: "http://localhost:3001/api/v1",
  // ...
};
```

## Usage Examples

### Using Auth Service in Components

```typescript
import { AuthService } from '../services/auth.service';

constructor(private authService: AuthService) {}

// Check if user is authenticated
this.authService.isAuthenticated$.subscribe(isAuth => {
  console.log('User authenticated:', isAuth);
});

// Logout
this.authService.logout();

// Get access token
const token = this.authService.getAccessToken();
```

### Making Authenticated API Calls

```typescript
// The interceptor automatically adds the Bearer token
this.http.get(`${environment.apiBaseUrl}/trips`).subscribe((data) => {
  console.log(data);
});
```

## Security Features

1. **JWT Tokens**: Secure token-based authentication
2. **HTTP-Only Cookies**: Tokens stored in cookies (can be upgraded to httpOnly via backend)
3. **Token Expiration**: Automatic expiration checking
4. **Route Guards**: Prevent unauthorized access
5. **Interceptor**: Centralized token management
6. **Password Validation**: Strong password requirements

## Testing

1. Start backend server on `http://localhost:3001`
2. Start frontend: `npm run start`
3. Navigate to login page
4. Test registration flow with OTP verification
5. Test login flow with redirect to home
6. Test protected routes (should redirect to login if not authenticated)

## Future Enhancements

- Refresh token rotation
- Remember me functionality
- Social login (Google OAuth)
- Password reset flow
- Session timeout warnings
- Multi-factor authentication
