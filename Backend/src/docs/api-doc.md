# API Documentation

## Authentication API

Base URL: `/auth`

---

### User Signup

**POST** `/auth/register`

Registers a new user account.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "role": "TRAVELLER"
}
```

| Field     | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| email     | string | Yes      | Valid email address                          |
| password  | string | Yes      | Min 8 characters                             |
| full_name | string | Yes      | User's full name                             |
| role      | string | No       | ADMIN, USER(Recommended), HOST, or TRAVELLER |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "TRAVELLER",
    "is_verified": false,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Validation error  
**409 Conflict** - Email already exists

#### Notes

- Upon successful registration, a 4-digit OTP is generated and sent to the user's email
- OTP is valid for 10 minutes
- User must verify email using the OTP before accessing protected features
- Default OTP for development: `1221`

---

### User Login

**POST** `/auth/login`

Authenticates user and returns tokens.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Response

**200 OK**

```json
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

**401 Unauthorized** - Invalid credentials

---

### Refresh Token

**POST** `/auth/refresh`

Generates new access token using refresh token.

Requires: Bearer token in `Authorization` header

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**401 Unauthorized** - Invalid or expired refresh token

---

### Logout

**POST** `/auth/logout`

Invalidates the user's session.

Requires: Bearer token in `Authorization` header

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Logout successful"
}
```

**400 Bad Request** - Missing refresh token

---

### Verify Email

**POST** `/auth/verify-email`

Verifies user's email address using OTP code sent during registration.

#### Request Body

```json
{
  "email": "user@example.com",
  "otp": "1221"
}
```

| Field | Type   | Required | Description                     |
| ----- | ------ | -------- | ------------------------------- |
| email | string | Yes      | User's email address            |
| otp   | string | Yes      | 4-digit OTP code sent via email |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**400 Bad Request** - Missing email or OTP  
**401 Unauthorized** - Invalid or expired OTP  
**404 Not Found** - User not found

#### Notes

- OTP is valid for 10 minutes after registration
- OTP is automatically deleted after successful verification
- Default OTP for development: `1221`

---

### OTP Verify

**POST** `/auth/otpVerify`

Verifies OTP and updates user's email verification status to true.

#### Request Body

```json
{
  "email": "user@example.com",
  "otp": "1221"
}
```

| Field | Type   | Required | Description                     |
| ----- | ------ | -------- | ------------------------------- |
| email | string | Yes      | User's email address            |
| otp   | string | Yes      | 4-digit OTP code sent via email |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "OTP verified successfully. Email verified.",
  "data": {
    "email": "user@example.com",
    "is_verified": true
  }
}
```

**400 Bad Request** - Missing email or OTP

```json
{
  "status": "error",
  "message": "Email is required",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Email is required"
    }
  }
}
```

**401 Unauthorized** - Invalid or expired OTP

```json
{
  "status": "error",
  "message": "Invalid or expired OTP",
  "error": {
    "code": "AUTHENTICATION_ERROR"
  }
}
```

**404 Not Found** - User not found

```json
{
  "status": "error",
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

---

### Forgot Password

**POST** `/auth/forgot-password`

Sends a password reset OTP to the user's email address.

#### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type   | Required | Description          |
| ----- | ------ | -------- | -------------------- |
| email | string | Yes      | User's email address |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Password reset OTP sent to your email address",
  "data": {
    "email": "user@example.com"
  }
}
```

**400 Bad Request** - Missing or invalid email

```json
{
  "status": "error",
  "message": "Email is required",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Email is required"
    }
  }
}
```

**404 Not Found** - User not found

```json
{
  "status": "error",
  "message": "User not found with this email address",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- OTP is valid for 10 minutes
- Email is sent asynchronously (fire-and-forget)
- Default OTP for development: `1221`
- If user doesn't exist, returns 404 error

---

### Reset Password

**POST** `/auth/reset-password`

Verifies OTP and resets the user's password.

#### Request Body

```json
{
  "email": "user@example.com",
  "otp": "1221",
  "newPassword": "newSecurePassword123"
}
```

| Field       | Type   | Required | Description                     |
| ----------- | ------ | -------- | ------------------------------- |
| email       | string | Yes      | User's email address            |
| otp         | string | Yes      | 4-digit OTP code sent via email |
| newPassword | string | Yes      | New password (min 8 characters) |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Password reset successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

**400 Bad Request** - Missing or invalid fields

```json
{
  "status": "error",
  "message": "Password must be at least 8 characters",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "newPassword": "Password must be at least 8 characters"
    }
  }
}
```

**401 Unauthorized** - Invalid or expired OTP

```json
{
  "status": "error",
  "message": "Invalid or expired OTP",
  "error": {
    "code": "AUTHENTICATION_ERROR"
  }
}
```

**404 Not Found** - User not found

```json
{
  "status": "error",
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- OTP must be obtained from `/auth/forgot-password` endpoint first
- OTP is valid for 10 minutes after generation
- Password must be at least 8 characters long
- OTP is automatically deleted after successful password reset
- Default OTP for development: `1221`

````

#### What Happens

1. OTP is verified against Redis storage
2. If valid, user's `is_verified` field is updated to `true` in database
3. OTP is deleted from Redis
4. User can now access protected features

#### Notes

- OTP is valid for 10 minutes after registration
- OTP is automatically deleted after successful verification
- Default OTP for development: `1221`
- If Redis is not connected, default OTP `1221` will work
- This endpoint is idempotent - calling it multiple times with same OTP won't cause errors

---

## User Profile API

Base URL: `/users`

All endpoints require: Bearer token in `Authorization` header

---

### Get Profile

**GET** `/users/me`

Fetches the logged-in user's profile.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "TRAVELLER",
    "is_verified": true,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
````

**404 Not Found** - User not found

---

### Update Profile

**PUT** `/users/me`

Updates the logged-in user's profile details.

#### Request Body

```json
{
  "full_name": "John Smith",
  "phone": "+1234567890"
}
```

| Field     | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| full_name | string | No       | User's full name |
| phone     | string | No       | Phone number     |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Smith",
    "phone": "+1234567890",
    "role": "TRAVELLER",
    "is_verified": true,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Validation error  
**404 Not Found** - User not found

---

### Change Password

**PUT** `/users/change-password`

Changes the logged-in user's password.

#### Request Body

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

| Field           | Type   | Required | Description                |
| --------------- | ------ | -------- | -------------------------- |
| currentPassword | string | Yes      | Current password           |
| newPassword     | string | Yes      | New password (min 8 chars) |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource updated successfully"
}
```

**400 Bad Request** - Validation error  
**401 Unauthorized** - Current password incorrect  
**404 Not Found** - User not found

---

## Role Management API

Base URL: `/admin/roles`

All endpoints require:

- Authentication: Bearer token in `Authorization` header
- Authorization: ADMIN role

---

## Create Role

**POST** `/admin/roles`

Creates a new role.

### Request Body

```json
{
  "name": "MODERATOR",
  "permissions": {
    "users": { "read": true, "write": false },
    "trips": { "read": true, "write": true }
  }
}
```

| Field       | Type   | Required | Description                  |
| ----------- | ------ | -------- | ---------------------------- |
| name        | string | Yes      | Role name (stored uppercase) |
| permissions | object | No       | Permission configuration     |

### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "MODERATOR",
    "permissions": { "users": { "read": true, "write": false } },
    "is_active": true,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Missing or invalid name  
**409 Conflict** - Role already exists

---

## List Roles

**GET** `/admin/roles`

Returns all roles sorted by creation date (newest first).

### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "ADMIN",
      "permissions": {},
      "is_active": true,
      "createdAt": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

## Update Role

**PUT** `/admin/roles/:id`

Updates an existing role.

### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Role ID     |

### Request Body

```json
{
  "name": "SUPER_ADMIN",
  "permissions": { "all": true }
}
```

| Field       | Type   | Required | Description     |
| ----------- | ------ | -------- | --------------- |
| name        | string | No       | New role name   |
| permissions | object | No       | New permissions |

### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "SUPER_ADMIN",
    "permissions": { "all": true },
    "is_active": true,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Empty name  
**404 Not Found** - Role not found  
**409 Conflict** - Name already taken

---

## Toggle Role Status

**PATCH** `/admin/roles/:id/status`

Activates or deactivates a role.

### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Role ID     |

### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "MODERATOR",
    "permissions": {},
    "is_active": false,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**404 Not Found** - Role not found

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

| Status | Code                 | Description              |
| ------ | -------------------- | ------------------------ |
| 400    | VALIDATION_ERROR     | Invalid input            |
| 401    | AUTHENTICATION_ERROR | Missing/invalid token    |
| 403    | AUTHORIZATION_ERROR  | Insufficient permissions |
| 404    | NOT_FOUND_ERROR      | Role not found           |
| 409    | CONFLICT_ERROR       | Duplicate role name      |
| 500    | INTERNAL_ERROR       | Server error             |

---

## Banner Management API

Base URL: `/admin/banners`

All endpoints require: Bearer token + ADMIN role

---

### Create Banner

**POST** `/admin/banners`

Creates a new banner with image upload support.

#### Content-Type

- `multipart/form-data` (for image upload)
- `application/json` (for direct URL)

#### Request Body (multipart/form-data)

| Field      | Type   | Required | Description                         |
| ---------- | ------ | -------- | ----------------------------------- |
| image      | File   | Yes\*    | Banner image (JPEG, PNG, GIF, WebP) |
| title      | string | Yes      | Banner title                        |
| subtitle   | string | Yes      | Banner subtitle                     |
| cta_text   | string | Yes      | Call-to-action text                 |
| cta_link   | string | Yes      | Call-to-action link                 |
| position   | number | Yes      | Display order                       |
| start_date | Date   | Yes      | Start date (ISO format)             |
| end_date   | Date   | Yes      | End date (ISO format)               |
| image_url  | string | No       | Direct image URL (if not uploading) |

\*Either `image` file or `image_url` must be provided

#### Example (cURL with image upload)

```bash
curl -X POST http://localhost:3001/api/v1/admin/banners \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@banner.jpg" \
  -F "title=Summer Sale" \
  -F "subtitle=Up to 50% off on all trips" \
  -F "cta_text=Book Now" \
  -F "cta_link=/trips" \
  -F "position=1" \
  -F "start_date=2026-01-01T00:00:00.000Z" \
  -F "end_date=2026-03-31T23:59:59.000Z"
```

#### Example (JSON with direct URL)

```json
{
  "title": "Summer Sale",
  "subtitle": "Up to 50% off on all trips",
  "image_url": "https://example.com/banner.jpg",
  "cta_text": "Book Now",
  "cta_link": "/trips",
  "position": 1,
  "start_date": "2026-01-01T00:00:00.000Z",
  "end_date": "2026-03-31T23:59:59.000Z"
}
```

| end_date | Date | Yes | End date |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Summer Sale",
    "subtitle": "Up to 50% off on all trips",
    "image_url": "http://localhost:9000/tripping-uploads/banners/1737104400000-abc123.jpg",
    "cta_text": "Book Now",
    "cta_link": "/trips",
    "position": 1,
    "is_active": true,
    "start_date": "2026-01-01T00:00:00.000Z",
    "end_date": "2026-03-31T23:59:59.000Z",
    "createdAt": "2026-01-16T10:00:00.000Z",
    "updatedAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**Image Upload Notes:**

- When uploading via `image` field, the file is automatically saved to MinIO
- The `image_url` in response will be the MinIO public URL
- Max file size: 5MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Images stored in: `tripping-uploads/banners/`

---

### List Banners

**GET** `/admin/banners`

Returns all banners sorted by position.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [...]
}
```

---

### Update Banner

**PUT** `/admin/banners/:id`

Updates an existing banner. Supports image upload.

#### Content-Type

- `multipart/form-data` (for image upload)
- `application/json` (for other fields)

#### Request Body (multipart/form-data)

All fields are optional. Include only fields to update.

| Field      | Type   | Description                         |
| ---------- | ------ | ----------------------------------- |
| image      | File   | New banner image (replaces old one) |
| title      | string | Updated title                       |
| subtitle   | string | Updated subtitle                    |
| cta_text   | string | Updated CTA text                    |
| cta_link   | string | Updated CTA link                    |
| position   | number | Updated position                    |
| start_date | Date   | Updated start date                  |
| end_date   | Date   | Updated end date                    |
| image_url  | string | Direct URL (if not uploading file)  |

#### Example (with new image)

```bash
curl -X PUT http://localhost:3001/api/v1/admin/banners/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@new-banner.jpg" \
  -F "title=Updated Summer Sale"
```

#### Example (without image)

```bash
curl -X PUT http://localhost:3001/api/v1/admin/banners/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","subtitle":"Updated Subtitle"}'
```

#### Response

**200 OK** - Updated banner with new image URL if uploaded  
**404 Not Found** - Banner not found

---

### Delete Banner

**DELETE** `/admin/banners/:id`

**200 OK** - `{ "status": "success", "message": "Resource deleted successfully" }`  
**404 Not Found** - Banner not found

---

### Toggle Banner Status

**PATCH** `/admin/banners/:id/status`

Activates or deactivates a banner.

**200 OK** - Updated banner with toggled `is_active`  
**404 Not Found** - Banner not found

---

## Category Management API

Base URL: `/admin/categories`

All endpoints require: Bearer token + ADMIN role

---

### Create Category

**POST** `/admin/categories`

Creates a new category with optional image upload support.

#### Content-Type

- `multipart/form-data` (for image upload)
- `application/json` (for direct URL)

#### Request Body (multipart/form-data)

| Field    | Type   | Required | Description                                           |
| -------- | ------ | -------- | ----------------------------------------------------- |
| image    | File   | Yes\*    | Category icon (JPEG, PNG, WebP)                       |
| name     | string | Yes      | Category name (must be unique, case insensitive)      |
| type     | string | Yes      | EXPERIENCE, DESTINATION, or SEASON (case insensitive) |
| icon_url | string | Yes\*    | Direct icon URL (if not uploading file)               |

\*Either `image` file or `icon_url` must be provided

#### Example (cURL with image upload)

```bash
curl -X POST http://localhost:3001/api/v1/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@icon.png" \
  -F "name=Adventure" \
  -F "type=EXPERIENCE"
```

#### Example (JSON with direct URL)

```json
{
  "name": "Adventure",
  "type": "EXPERIENCE",
  "icon_url": "https://example.com/icons/adventure.svg"
}
```

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Adventure",
    "type": "EXPERIENCE",
    "icon_url": "http://localhost:9000/tripping-uploads/categories/1737104400000-icon.png",
    "is_active": true,
    "createdAt": "2026-01-16T10:00:00.000Z",
    "updatedAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Validation error

```json
{
  "status": "error",
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "name": "Name is required",
      "type": "Type is required (EXPERIENCE, DESTINATION, or SEASON)",
      "icon_url": "Icon is required (upload image file or provide icon_url)"
    }
  }
}
```

**400 Bad Request** - Duplicate name

```json
{
  "status": "error",
  "message": "Category name already exists",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "name": "Category with this name already exists"
    }
  }
}
```

#### Notes

- **Category name must be unique** (case insensitive check)
- Type is case insensitive (e.g., "experience", "EXPERIENCE", "Experience" all work)
- Type is automatically normalized to uppercase in the database
- Valid types: EXPERIENCE, DESTINATION, SEASON
- When uploading via `image` field, the file is automatically saved to MinIO
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Images stored in: `tripping-uploads/categories/`

---

### List Categories

**GET** `/admin/categories`

Returns all categories sorted by creation date (newest first).

---

### Update Category

**PUT** `/admin/categories/:id`

All fields optional. Can also update `is_active`.

**200 OK** - Updated category  
**404 Not Found** - Category not found

---

### Delete Category

**DELETE** `/admin/categories/:id`

**200 OK** - `{ "status": "success", "message": "Resource deleted successfully" }`  
**404 Not Found** - Category not found

---

## Trip Moderation API

Base URL: `/admin/trips`

All endpoints require: Bearer token + ADMIN role

---

### Get Pending Trips

**GET** `/admin/trips/pending`

Returns trips awaiting approval.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "host": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "title": "Mountain Adventure",
      "slug": "mountain-adventure",
      "description": "An exciting mountain trip",
      "duration_days": 5,
      "duration_nights": 4,
      "base_price": 15000,
      "status": "PENDING_APPROVAL",
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### Review Trip

**POST** `/admin/trips/:id/review`

Approve, reject, or request changes for a trip.

#### Request Body

```json
{
  "status": "APPROVED",
  "reasons": ["Content meets guidelines", "Photos are high quality"],
  "admin_message": "Great trip listing!"
}
```

| Field         | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| status        | string   | Yes      | APPROVED, CHANGES_REQUESTED, or REJECTED |
| reasons       | string[] | Yes      | List of reasons for the decision         |
| admin_message | string   | No       | Optional message to host                 |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "trip_id": "507f1f77bcf86cd799439011",
    "admin_id": "507f1f77bcf86cd799439014",
    "status": "APPROVED",
    "reasons": ["Content meets guidelines"],
    "admin_message": "Great trip listing!",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Validation error  
**404 Not Found** - Trip not found

---

### Moderation History

**GET** `/admin/trips/:id/moderations`

View audit history for a trip.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "trip_id": "507f1f77bcf86cd799439011",
      "admin_id": "507f1f77bcf86cd799439014",
      "status": "CHANGES_REQUESTED",
      "reasons": ["Need better photos"],
      "admin_message": "Please update the cover image",
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

**404 Not Found** - Trip not found

---

## Admin Users API

Base URL: `/admin/users`

All endpoints require: Bearer token + ADMIN role

---

### Get All Users

**GET** `/admin/users`

Returns all users with pagination and filtering. Excludes the currently logged-in admin.

#### Query Parameters

| Parameter | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| role      | string | No       | Filter by role (ADMIN, HOST, USER)     |
| search    | string | No       | Search by name, email, or phone        |
| page      | number | No       | Page number (default: 1)               |
| limit     | number | No       | Items per page (default: 20, max: 100) |

#### Example Request

```bash
curl 'http://localhost:3001/api/v1/admin/users?role=HOST&page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": {
        "id": "507f1f77bcf86cd799439012",
        "name": "HOST"
      },
      "location": {
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "pincode": "10001"
      },
      "is_verified": true,
      "is_active": true,
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

### Get User by ID

**GET** `/admin/users/:id`

Returns detailed information for a specific user.

#### Response

**200 OK** - User object with role and location details  
**404 Not Found** - User not found

---

### Update User Role

**PATCH** `/admin/users/:id/role`

Changes a user's role. Admins cannot change their own role.

#### Request Body

```json
{
  "role_name": "HOST"
}
```

| Field     | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| role_name | string | Yes      | New role: ADMIN, HOST, or USER |

#### Example Request

```bash
curl -X PATCH 'http://localhost:3001/api/v1/admin/users/507f1f77bcf86cd799439011/role' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"role_name":"HOST"}'
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "User role updated successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "oldRole": "USER",
    "newRole": "HOST"
  }
}
```

**400 Bad Request** - Invalid role name  
**403 Forbidden** - Cannot change own role  
**404 Not Found** - User or role not found

---

## Admin Trips API

Base URL: `/admin/trips`

All endpoints require: Bearer token + ADMIN role

---

### Get All Trips

**GET** `/admin/trips`

Returns all trips with pagination and filtering.

#### Query Parameters

| Parameter | Type   | Required | Description                                                     |
| --------- | ------ | -------- | --------------------------------------------------------------- |
| status    | string | No       | Filter by status (DRAFT, PENDING_APPROVAL, PUBLISHED, ARCHIVED) |
| page      | number | No       | Page number (default: 1)                                        |
| limit     | number | No       | Items per page (default: 20, max: 100)                          |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Mountain Adventure",
      "slug": "mountain-adventure",
      "host": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "pricePerPerson": 15000,
      "status": "PUBLISHED",
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### Update Trip Status

**PATCH** `/admin/trips/:id/status`

Changes a trip's status.

#### Request Body

```json
{
  "status": "PUBLISHED"
}
```

| Field  | Type   | Required | Description                                        |
| ------ | ------ | -------- | -------------------------------------------------- |
| status | string | Yes      | REJECTED, PUBLISHED, ARCHIVED, or PENDING_APPROVAL |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Trip status updated successfully",
  "data": {
    "tripId": "507f1f77bcf86cd799439011",
    "oldStatus": "PENDING_APPROVAL",
    "newStatus": "PUBLISHED"
  }
}
```

**400 Bad Request** - Invalid status  
**404 Not Found** - Trip not found

---

## Admin Bookings API

Base URL: `/admin/bookings`

All endpoints require: Bearer token + ADMIN role

---

### Get All Bookings

**GET** `/admin/bookings`

Returns all bookings with pagination and filtering.

#### Query Parameters

| Parameter      | Type   | Required | Description                                                   |
| -------------- | ------ | -------- | ------------------------------------------------------------- |
| status         | string | No       | Filter by booking status (PENDING, CONFIRMED, CANCELLED)      |
| payment_status | string | No       | Filter by payment status (PENDING, SUCCESS, FAILED, REFUNDED) |
| page           | number | No       | Page number (default: 1)                                      |
| limit          | number | No       | Items per page (default: 20, max: 100)                        |

#### Example Request

```bash
curl 'http://localhost:3001/api/v1/admin/bookings?status=CONFIRMED&page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "trip": {
        "id": "507f1f77bcf86cd799439013",
        "title": "Mountain Adventure",
        "slug": "mountain-adventure"
      },
      "host": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "batch": {
        "id": "507f1f77bcf86cd799439015",
        "startDate": "2026-11-20",
        "endDate": "2026-11-27"
      },
      "num_travelers": 2,
      "total_amount": 31998,
      "status": "CONFIRMED",
      "payment_status": "SUCCESS",
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13,
    "hasMore": true
  }
}
```

---

## Admin Payments API

Base URL: `/admin/payments`

All endpoints require: Bearer token + ADMIN role

---

### Get All Payments

**GET** `/admin/payments`

Returns all payment transactions with pagination and filtering.

#### Query Parameters

| Parameter | Type   | Required | Description                                                   |
| --------- | ------ | -------- | ------------------------------------------------------------- |
| status    | string | No       | Filter by payment status (PENDING, SUCCESS, FAILED, REFUNDED) |
| gateway   | string | No       | Filter by payment gateway (razorpay, stripe, etc.)            |
| page      | number | No       | Page number (default: 1)                                      |
| limit     | number | No       | Items per page (default: 20, max: 100)                        |

#### Example Request

```bash
curl 'http://localhost:3001/api/v1/admin/payments?status=SUCCESS&gateway=razorpay&page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "booking": {
        "id": "507f1f77bcf86cd799439013",
        "num_travelers": 2
      },
      "trip": {
        "id": "507f1f77bcf86cd799439014",
        "title": "Mountain Adventure",
        "slug": "mountain-adventure"
      },
      "amount": 31998,
      "currency": "INR",
      "gateway": "razorpay",
      "gateway_payment_id": "pay_abc123xyz",
      "gateway_order_id": "order_def456uvw",
      "status": "SUCCESS",
      "metadata": {
        "method": "card",
        "card_network": "Visa"
      },
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 320,
    "totalPages": 16,
    "hasMore": true
  }
}
```

**Notes:**

- Payments are sorted by creation date (newest first)
- Includes related user, booking, and trip information
- Gateway-specific IDs are included for reconciliation
- Metadata contains additional payment details from the gateway

---

## Host Trip Management API

Base URL: `/host/trips`

All endpoints require: Bearer token + HOST role

---

### Create Trip

**POST** `/host/trips`

Creates a new trip with all related data (batches, images, category, cancellation policy) in a single transaction.

#### Request Body

```json
{
  "title": "Rajasthan Desert Adventure",
  "categoryId": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
  "destination": ["Jaipur", "Jodhpur", "Jaisalmer"],
  "pricePerPerson": 15999,
  "route": {
    "startLocation": "Delhi",
    "endLocation": "Jaisalmer",
    "pickupLocations": ["Ambala", "Karnal", "Baramulla"]
  },
  "tags": ["Vacation", "Fun", "Camping", "Desert", "Culture"],
  "batches": [
    {
      "startDate": "2026-11-20",
      "endDate": "2026-11-27",
      "duration": {
        "nights": 7,
        "days": 8
      },
      "totalSlots": 20
    },
    {
      "startDate": "2026-12-05",
      "endDate": "2026-12-12",
      "duration": {
        "nights": 7,
        "days": 8
      },
      "totalSlots": 20
    }
  ],
  "images": ["https://cdn.example.com/trips/img1.jpg", "https://cdn.example.com/trips/img2.jpg"],
  "aboutTrip": "Experience the royal culture, desert safaris, and historic forts of Rajasthan.",
  "cancellationPolicy": {
    "type": "FREE_CANCELLATION",
    "freeCancellationDay": 4
  },
  "additionalMessage": "Carry warm clothes for desert nights. Pickup points will be confirmed 24 hours before departure.",
  "tripRequestDescription": "This is a special request description for the trip.",
  "status": "DRAFT"
}
```

| Field                                  | Type     | Required | Description                                                    |
| -------------------------------------- | -------- | -------- | -------------------------------------------------------------- |
| title                                  | string   | Yes      | Trip title                                                     |
| categoryId                             | string[] | Yes      | Array of category ObjectIds (min: 1, must exist and be active) |
| destination                            | string[] | Yes      | Array of destination cities (min: 1)                           |
| pricePerPerson                         | number   | Yes      | Price per person (> 0)                                         |
| route.startLocation                    | string   | Yes      | Starting point                                                 |
| route.endLocation                      | string   | Yes      | Ending point                                                   |
| route.pickupLocations                  | string[] | Yes      | Pickup points (must be array)                                  |
| tags                                   | string[] | Yes      | Trip tags (min: 1)                                             |
| batches                                | array    | Yes      | Trip batches (min: 1)                                          |
| batches[].startDate                    | string   | Yes      | Batch start date (ISO format)                                  |
| batches[].endDate                      | string   | Yes      | Batch end date (must be after start date)                      |
| batches[].duration.days                | number   | Yes      | Number of days                                                 |
| batches[].duration.nights              | number   | Yes      | Number of nights                                               |
| batches[].totalSlots                   | number   | Yes      | Total slots (> 0)                                              |
| images                                 | string[] | Yes      | Image URLs (min: 1, max: 15, uploaded to MinIO)                |
| aboutTrip                              | string   | Yes      | Trip description                                               |
| cancellationPolicy.type                | string   | Yes      | FREE_CANCELLATION, PARTIAL_CANCELLATION, or NO_CANCELLATION    |
| cancellationPolicy.freeCancellationDay | number   | Yes      | Days before trip for free cancellation (≥ 0)                   |
| additionalMessage                      | string   | No       | Additional message to travelers                                |
| tripRequestDescription                 | string   | No       | Special request description for the trip                       |
| status                                 | string   | No       | DRAFT or PENDING_APPROVAL (default: DRAFT)                     |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "host": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "title": "Rajasthan Desert Adventure",
    "slug": "rajasthan-desert-adventure-abc123",
    "categoryId": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
    "destination": ["Jaipur", "Jodhpur", "Jaisalmer"],
    "pricePerPerson": 15999,
    "route": {
      "startLocation": "Delhi",
      "endLocation": "Jaisalmer",
      "pickupLocations": ["Ambala", "Karnal", "Baramulla"]
    },
    "tags": ["Vacation", "Fun", "Camping", "Desert", "Culture"],
    "batches": [
      {
        "id": "507f1f77bcf86cd799439014",
        "startDate": "2026-11-20",
        "endDate": "2026-11-27",
        "duration": {
          "nights": 7,
          "days": 8
        },
        "totalSlots": 20,
        "availableSlots": 20,
        "status": "OPEN"
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "startDate": "2026-12-05",
        "endDate": "2026-12-12",
        "duration": {
          "nights": 7,
          "days": 8
        },
        "totalSlots": 20,
        "availableSlots": 20,
        "status": "OPEN"
      }
    ],
    "images": ["https://cdn.example.com/trips/img1.jpg", "https://cdn.example.com/trips/img2.jpg"],
    "aboutTrip": "Experience the royal culture, desert safaris, and historic forts of Rajasthan.",
    "cancellationPolicy": {
      "type": "FREE",
      "freeCancellationDay": 4
    },
    "additionalMessage": "Carry warm clothes for desert nights. Pickup points will be confirmed 24 hours before departure.",
    "tripRequestDescription": "This is a special request description for the trip.",
    "status": "DRAFT",
    "is_featured": false,
    "createdAt": "2026-01-17T10:00:00.000Z",
    "updatedAt": "2026-01-17T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Validation error

```json
{
  "status": "error",
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "title": "Title is required",
      "categoryId": "At least one category ID is required",
      "destination": "At least one destination is required",
      "pricePerPerson": "Price per person must be greater than 0",
      "route.startLocation": "Start location is required",
      "batches": "At least one batch is required",
      "batches[0].startDate": "Start date is required",
      "batches[0].dates": "End date must be after start date",
      "images": "At least one image is required",
      "images": "Maximum 15 images allowed",
      "aboutTrip": "About trip description is required",
      "cancellationPolicy": "Cancellation policy is required"
    }
  }
}
```

**400 Bad Request** - Invalid category

```json
{
  "status": "error",
  "message": "One or more invalid category IDs",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

#### Notes

- Trip is created with status `DRAFT` (or `PENDING_APPROVAL` if specified)
- Slug is auto-generated from title
- `approval_requests_left` is set to 3
- Creates trip along with:
  - Trip category association
  - Multiple batches (with `available_slots` = `total_slots`, status = `OPEN`)
  - Multiple images (first image is marked as cover)
  - Cancellation policy
- Uses MongoDB transaction - all or nothing
- Category must exist and be active
- Images: minimum 1, maximum 15 (uploaded to MinIO storage)
- Batch dates are validated (end date must be after start date)
- Trip must be submitted for approval before it can be published

---

### Get My Trips

**GET** `/host/trips`

Returns all trips for the authenticated host, sorted by creation date (newest first).

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "host_id": "507f1f77bcf86cd799439012",
      "title": "Mountain Adventure",
      "slug": "mountain-adventure-abc123",
      "description": "An exciting mountain expedition",
      "duration_days": 5,
      "duration_nights": 4,
      "start_location": "Delhi",
      "end_location": "Manali",
      "pickup_locations": ["Delhi", "Chandigarh"],
      "route_summary": "Delhi → Chandigarh → Manali",
      "base_price": 15000,
      "tax_included": false,
      "trip_tags": ["adventure", "mountains"],
      "status": "DRAFT",
      "is_featured": false,
      "createdAt": "2026-01-17T10:00:00.000Z",
      "updatedAt": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

#### Notes

- Only returns trips where `is_deleted: false`
- Includes trips in all statuses (DRAFT, PENDING_APPROVAL, CHANGES_REQUESTED, REJECTED, PUBLISHED, ARCHIVED)

---

### Update Trip

**PUT** `/host/trips/:id`

Updates an existing trip. Only trips in `DRAFT` or `CHANGES_REQUESTED` status can be edited.

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Trip ID     |

#### Request Body

All fields are optional. Include only fields to update.

```json
{
  "title": "Updated Mountain Adventure",
  "description": "An updated exciting mountain expedition",
  "base_price": 18000,
  "trip_tags": ["adventure", "mountains", "trekking"]
}
```

| Field            | Type     | Description               |
| ---------------- | -------- | ------------------------- |
| title            | string   | Updated trip title        |
| description      | string   | Updated trip description  |
| duration_days    | number   | Updated number of days    |
| duration_nights  | number   | Updated number of nights  |
| start_location   | string   | Updated starting point    |
| end_location     | string   | Updated ending point      |
| pickup_locations | string[] | Updated pickup points     |
| route_summary    | string   | Updated route overview    |
| base_price       | number   | Updated price             |
| tax_included     | boolean  | Updated tax included flag |
| trip_tags        | string[] | Updated tags              |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "host": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "title": "Updated Mountain Adventure",
    "slug": "mountain-adventure-abc123",
    "description": "An updated exciting mountain expedition",
    "duration_days": 5,
    "duration_nights": 4,
    "start_location": "Delhi",
    "end_location": "Manali",
    "pickup_locations": ["Delhi", "Chandigarh"],
    "route_summary": "Delhi → Chandigarh → Manali",
    "base_price": 18000,
    "tax_included": false,
    "trip_tags": ["adventure", "mountains", "trekking"],
    "status": "DRAFT",
    "is_featured": false,
    "createdAt": "2026-01-17T10:00:00.000Z",
    "updatedAt": "2026-01-17T10:30:00.000Z"
  }
}
```

**400 Bad Request** - Cannot edit trip in current status

```json
{
  "status": "error",
  "message": "Can only edit trips in DRAFT or CHANGES_REQUESTED status",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**403 Forbidden** - Not your trip

```json
{
  "status": "error",
  "message": "You do not have permission to access this resource",
  "error": {
    "code": "FORBIDDEN_ERROR"
  }
}
```

**404 Not Found** - Trip not found

```json
{
  "status": "error",
  "message": "Trip not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- Only trips in `DRAFT` or `CHANGES_REQUESTED` status can be edited
- Cannot edit trips that are `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`, or `ARCHIVED`
- Slug is not updated even if title changes

---

### Submit For Approval

**POST** `/host/trips/:id/submit`

Submits trip for admin review. Changes status to `PENDING_APPROVAL` and decrements `approval_requests_left`.

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Trip ID     |

#### Request Body

No request body required.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Trip submitted for approval",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "host": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "title": "Mountain Adventure",
    "slug": "mountain-adventure-abc123",
    "description": "An exciting mountain expedition",
    "duration_days": 5,
    "duration_nights": 4,
    "start_location": "Delhi",
    "end_location": "Manali",
    "pickup_locations": ["Delhi", "Chandigarh"],
    "route_summary": "Delhi → Chandigarh → Manali",
    "base_price": 15000,
    "tax_included": false,
    "trip_tags": ["adventure", "mountains"],
    "status": "PENDING_APPROVAL",
    "is_featured": false,
    "createdAt": "2026-01-17T10:00:00.000Z",
    "updatedAt": "2026-01-17T10:45:00.000Z"
  }
}
```

**400 Bad Request** - Invalid status

```json
{
  "status": "error",
  "message": "Can only submit trips in DRAFT or CHANGES_REQUESTED status",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**400 Bad Request** - No requests remaining

```json
{
  "status": "error",
  "message": "No approval requests remaining",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**403 Forbidden** - Not your trip

```json
{
  "status": "error",
  "message": "You do not have permission to access this resource",
  "error": {
    "code": "FORBIDDEN_ERROR"
  }
}
```

**404 Not Found** - Trip not found

```json
{
  "status": "error",
  "message": "Trip not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- Can only submit trips in `DRAFT` or `CHANGES_REQUESTED` status
- Each trip has 3 approval requests (set at creation)
- Each submission decrements `approval_requests_left` by 1
- Once `approval_requests_left` reaches 0, trip cannot be submitted again

---

### Delete Trip

**DELETE** `/host/trips/:id`

Soft deletes the trip (sets `is_deleted: true`). Trip data is preserved but hidden from listings.

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Trip ID     |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Resource deleted successfully"
}
```

**403 Forbidden** - Not your trip

```json
{
  "status": "error",
  "message": "You do not have permission to access this resource",
  "error": {
    "code": "FORBIDDEN_ERROR"
  }
}
```

**404 Not Found** - Trip not found

```json
{
  "status": "error",
  "message": "Trip not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- This is a soft delete - trip data is preserved in database
- Deleted trips will not appear in trip listings
- Deleted trips cannot be restored via API (requires database access)

---

## Host Batch Management API

All endpoints require: Bearer token + HOST role

---

### Create Batch

**POST** `/host/trips/:tripId/batches`

#### Request Body

```json
{
  "start_date": "2026-02-01T00:00:00.000Z",
  "end_date": "2026-02-05T00:00:00.000Z",
  "total_slots": 20,
  "price_override": 18000
}
```

| Field          | Type   | Required | Description              |
| -------------- | ------ | -------- | ------------------------ |
| start_date     | Date   | Yes      | Batch start date         |
| end_date       | Date   | Yes      | Batch end date           |
| total_slots    | number | Yes      | Total available slots    |
| price_override | number | No       | Override trip base price |

#### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "trip_id": "507f1f77bcf86cd799439012",
    "start_date": "2026-02-01T00:00:00.000Z",
    "end_date": "2026-02-05T00:00:00.000Z",
    "total_slots": 20,
    "available_slots": 20,
    "price_override": 18000,
    "status": "OPEN"
  }
}
```

---

### List Batches

**GET** `/host/trips/:tripId/batches`

Returns all batches for a trip sorted by start date.

---

### Update Batch

**PUT** `/host/batches/:id`

Only OPEN batches can be updated. Cannot reduce slots below booked count.

**200 OK** - Updated batch  
**400 Bad Request** - Batch not open or invalid slots  
**403 Forbidden** - Not your batch  
**404 Not Found** - Batch not found

---

### Close Batch

**PATCH** `/host/batches/:id/close`

Closes booking for a batch.

**200 OK** - Batch status changed to `CLOSED`  
**400 Bad Request** - Batch not open  
**403 Forbidden** - Not your batch  
**404 Not Found** - Batch not found

---

## Host Trip Content API

All endpoints require: Bearer token + HOST role

---

### Add Itinerary

**POST** `/host/trips/:tripId/itinerary`

#### Request Body

```json
{
  "day_number": 1,
  "title": "Arrival & Acclimatization",
  "description": "Arrive at base camp and rest",
  "tags": ["arrival", "rest"]
}
```

| Field       | Type     | Required | Description      |
| ----------- | -------- | -------- | ---------------- |
| day_number  | number   | Yes      | Day number (≥ 1) |
| title       | string   | Yes      | Day title        |
| description | string   | Yes      | Day description  |
| tags        | string[] | No       | Tags             |

---

### Update Itinerary

**PUT** `/host/itinerary/:id`

All fields optional.

**200 OK** - Updated itinerary  
**403 Forbidden** - Not your trip  
**404 Not Found** - Itinerary not found

---

### Add Inclusion/Exclusion

**POST** `/host/trips/:tripId/inclusions`

#### Request Body

```json
{
  "type": "INCLUDED",
  "description": "All meals included"
}
```

| Field       | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| type        | string | Yes      | INCLUDED or EXCLUDED |
| description | string | Yes      | Description          |

---

### Upload Media

**POST** `/host/trips/:tripId/media`

#### Request Body

```json
{
  "media_url": "https://example.com/image.jpg",
  "media_type": "IMAGE",
  "is_cover": true
}
```

| Field      | Type    | Required | Description        |
| ---------- | ------- | -------- | ------------------ |
| media_url  | string  | Yes      | Media URL          |
| media_type | string  | Yes      | IMAGE or VIDEO     |
| is_cover   | boolean | No       | Set as cover image |

Note: Setting `is_cover: true` will unset any existing cover.

---

### Delete Media

**DELETE** `/host/media/:id`

**200 OK** - Media deleted  
**403 Forbidden** - Not your trip  
**404 Not Found** - Media not found

---

## Public API

No authentication required.

---

### Get Active Banners

**GET** `/public/banners`

Returns active banners within their date range.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Summer Sale",
      "subtitle": "Up to 50% off",
      "image_url": "https://example.com/banner.jpg",
      "cta_text": "Book Now",
      "cta_link": "/trips",
      "position": 1
    }
  ]
}
```

---

### Get Categories

**GET** `/public/categories`

Returns active categories sorted by creation date (newest first).

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Adventure",
      "type": "EXPERIENCE",
      "icon_url": "http://localhost:9000/tripping-uploads/categories/icon.png",
      "is_active": true,
      "createdAt": "2026-01-16T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### Get Trips by Category

**GET** `/public/trips/category/:categoryId`

Get all published trips that belong to a specific category.

#### Path Parameters

| Parameter  | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| categoryId | string | Yes      | Category ObjectId to filter by |

#### Example Request

```bash
GET /api/v1/public/trips/category/696b63dd4d933bd73a317d2c
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "host": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "title": "Rajasthan Desert Adventure",
      "slug": "rajasthan-desert-adventure-abc123",
      "categoryId": ["696b63dd4d933bd73a317d2c", "696b63ef4d933bd73a317d2e"],
      "destination": ["Jaipur", "Jodhpur", "Jaisalmer"],
      "pricePerPerson": 15999,
      "route": {
        "startLocation": "Delhi",
        "endLocation": "Jaisalmer",
        "pickupLocations": ["Ambala", "Karnal", "Baramulla"]
      },
      "tags": ["Vacation", "Fun", "Camping", "Desert", "Culture"],
      "batches": [
        {
          "id": "507f1f77bcf86cd799439014",
          "startDate": "2026-11-20",
          "endDate": "2026-11-27",
          "duration": {
            "nights": 7,
            "days": 8
          },
          "totalSlots": 20,
          "availableSlots": 15,
          "status": "OPEN"
        }
      ],
      "images": ["https://cdn.example.com/trips/img1.jpg"],
      "aboutTrip": "Experience the royal culture, desert safaris, and historic forts of Rajasthan.",
      "cancellationPolicy": {
        "type": "FREE",
        "freeCancellationDay": 4
      },
      "status": "PUBLISHED",
      "is_featured": false,
      "createdAt": "2026-01-17T10:00:00.000Z",
      "updatedAt": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

**400 Bad Request** - Invalid category ID

```json
{
  "status": "error",
  "message": "Invalid category ID",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

#### Notes

- Only returns trips with status = "PUBLISHED"
- Trips are sorted by featured status (featured first) then by creation date (newest first)
- Returns empty array if no trips found for the category
- Category must be a valid MongoDB ObjectId

---

### Search Trips

**GET** `/public/trips`

Search and filter published trips based on destination, number of travellers, and start date.

#### Query Parameters

| Parameter   | Type   | Required | Description                                                                 |
| ----------- | ------ | -------- | --------------------------------------------------------------------------- |
| destination | string | No       | Filter by destination (searches in pickup_locations, case insensitive)      |
| travellers  | number | No       | Filter by number of travellers (checks available_slots in batches)          |
| startDate   | string | No       | Filter by start date (YYYY-MM-DD format, checks if date falls within batch) |

#### Example Requests

```bash
# Get all published trips
GET /api/v1/public/trips

# Search by destination
GET /api/v1/public/trips?destination=Yemmiganur

# Search by destination and travellers
GET /api/v1/public/trips?destination=Jaipur&travellers=3

# Search by all filters
GET /api/v1/public/trips?destination=Delhi&travellers=5&startDate=2026-01-21
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "host": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "title": "Rajasthan Desert Adventure",
      "slug": "rajasthan-desert-adventure-abc123",
      "categoryId": ["507f1f77bcf86cd799439013"],
      "destination": ["Jaipur", "Jodhpur", "Jaisalmer"],
      "pricePerPerson": 15999,
      "route": {
        "startLocation": "Delhi",
        "endLocation": "Jaisalmer",
        "pickupLocations": ["Ambala", "Karnal", "Baramulla"]
      },
      "tags": ["Vacation", "Fun", "Camping", "Desert", "Culture"],
      "batches": [
        {
          "id": "507f1f77bcf86cd799439014",
          "startDate": "2026-11-20",
          "endDate": "2026-11-27",
          "duration": {
            "nights": 7,
            "days": 8
          },
          "totalSlots": 20,
          "availableSlots": 15,
          "status": "OPEN"
        }
      ],
      "images": ["https://cdn.example.com/trips/img1.jpg"],
      "aboutTrip": "Experience the royal culture, desert safaris, and historic forts of Rajasthan.",
      "cancellationPolicy": {
        "type": "FREE",
        "freeCancellationDay": 4
      },
      "status": "PUBLISHED",
      "is_featured": false,
      "createdAt": "2026-01-17T10:00:00.000Z",
      "updatedAt": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

#### Filter Logic

- **destination**: Case-insensitive partial match on `pickup_locations` array
- **travellers**: Only returns trips with batches that have `available_slots >= travellers` and status = "OPEN"
- **startDate**: Only returns trips with batches where `start_date <= startDate <= end_date` and status = "OPEN"
- All filters are combined with AND logic (all conditions must match)
- Only trips with status = "PUBLISHED" are returned

#### Notes

- If no query parameters provided, returns all published trips
- Invalid date format for `startDate` is ignored (must be YYYY-MM-DD)
- Invalid `travellers` value (non-numeric or <= 0) is ignored
- Empty results array returned if no trips match the filters

---

### Get Featured Trips

**GET** `/public/trips/featured`

Returns published featured trips.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Mountain Adventure",
      "slug": "mountain-adventure-abc123",
      "description": "An exciting mountain trip",
      "duration_days": 5,
      "duration_nights": 4,
      "start_location": "Delhi",
      "end_location": "Manali",
      "base_price": 15000,
      "is_featured": true
    }
  ]
}
```

---

## Cities API

Base URL: `/public/cities`

No authentication required.

---

### Search Cities by District

**GET** `/public/cities/search/district`

Search for cities using case-insensitive regex matching on district name.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                              |
| --------- | ------ | -------- | ------- | ---------------------------------------- |
| q         | string | Yes      | -       | District search query (case insensitive) |
| page      | number | No       | 1       | Page number                              |
| limit     | number | No       | 50      | Items per page (max: 100)                |

#### Example Request

```bash
GET /api/v1/public/cities/search/district?q=Ganganagar&page=1&limit=50
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "City": "SGM",
      "State": "Rajasthan",
      "District": "Ganganagar"
    },
    {
      "City": "Anupgarh",
      "State": "Rajasthan",
      "District": "Ganganagar"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

**400 Bad Request** - Missing or empty query

```json
{
  "status": "error",
  "message": "District search query is required",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "district": "District search query cannot be empty"
    }
  }
}
```

#### Notes

- Search is case-insensitive (e.g., "ganganagar", "Ganganagar", "GANGANAGAR" all work)
- Partial matches are supported (e.g., "ganga" will match "Ganganagar")
- Results are sorted by State → District → City
- Maximum 100 items per page

---

### Search Cities by City Name

**GET** `/public/cities/search/city`

Search for cities using case-insensitive regex matching on city name.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                          |
| --------- | ------ | -------- | ------- | ------------------------------------ |
| q         | string | Yes      | -       | City search query (case insensitive) |
| page      | number | No       | 1       | Page number                          |
| limit     | number | No       | 50      | Items per page (max: 100)            |

#### Example Request

```bash
GET /api/v1/public/cities/search/city?q=Delhi&page=1&limit=10
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "City": "Delhi",
      "State": "Delhi",
      "District": "Central Delhi"
    },
    {
      "City": "New Delhi",
      "State": "Delhi",
      "District": "New Delhi"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### Search Cities by State

**GET** `/public/cities/search/state`

Search for cities using case-insensitive regex matching on state name.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                           |
| --------- | ------ | -------- | ------- | ------------------------------------- |
| q         | string | Yes      | -       | State search query (case insensitive) |
| page      | number | No       | 1       | Page number                           |
| limit     | number | No       | 50      | Items per page (max: 100)             |

#### Example Request

```bash
GET /api/v1/public/cities/search/state?q=Rajasthan&page=1&limit=20
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "City": "Jaipur",
      "State": "Rajasthan",
      "District": "Jaipur"
    },
    {
      "City": "Jodhpur",
      "State": "Rajasthan",
      "District": "Jodhpur"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Get All States

**GET** `/public/cities/states`

Returns a sorted list of all unique states.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Delhi",
    "Gujarat",
    "Haryana",
    "Karnataka",
    "Kerala",
    "Maharashtra",
    "Rajasthan",
    "Tamil Nadu",
    "Uttar Pradesh",
    "West Bengal"
  ]
}
```

#### Notes

- Returns all unique state names from the database
- Results are sorted alphabetically
- No pagination (returns all states)

---

### Get Districts by State

**GET** `/public/cities/districts`

Returns a sorted list of all districts for a given state.

#### Query Parameters

| Parameter | Type   | Required | Description                   |
| --------- | ------ | -------- | ----------------------------- |
| state     | string | Yes      | State name (case insensitive) |

#### Example Request

```bash
GET /api/v1/public/cities/districts?state=Rajasthan
```

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": ["Ajmer", "Alwar", "Bikaner", "Ganganagar", "Jaipur", "Jodhpur", "Kota", "Udaipur"]
}
```

**400 Bad Request** - Missing state parameter

```json
{
  "status": "error",
  "message": "State is required",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "state": "State cannot be empty"
    }
  }
}
```

#### Notes

- State name matching is case-insensitive
- Returns all unique districts for the specified state
- Results are sorted alphabetically
- No pagination (returns all districts)

---

## Trips API

No authentication required.

---

### List Trips

**GET** `/trips`

Search and filter published trips.

#### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| search    | string | Search in title/description  |
| category  | string | Filter by category           |
| minPrice  | number | Minimum price                |
| maxPrice  | number | Maximum price                |
| duration  | number | Duration in days             |
| page      | number | Page number (default: 1)     |
| limit     | number | Items per page (default: 10) |

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Mountain Adventure",
      "slug": "mountain-adventure-abc123",
      "description": "An exciting trip",
      "duration_days": 5,
      "duration_nights": 4,
      "start_location": "Delhi",
      "end_location": "Manali",
      "base_price": 15000,
      "is_featured": true,
      "cover_image": "https://example.com/cover.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Trip Details

**GET** `/trips/:slug`

Get full trip details by slug.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Mountain Adventure",
    "slug": "mountain-adventure-abc123",
    "description": "An exciting trip",
    "duration_days": 5,
    "duration_nights": 4,
    "start_location": "Delhi",
    "end_location": "Manali",
    "pickup_locations": ["Delhi", "Chandigarh"],
    "route_summary": "Delhi → Manali",
    "base_price": 15000,
    "tax_included": false,
    "trip_tags": ["adventure"],
    "is_featured": true,
    "itineraries": [...],
    "inclusions": [...],
    "media": [...]
  }
}
```

**404 Not Found** - Trip not found

---

### Trip Reviews

**GET** `/trips/:id/reviews`

Get reviews for a trip.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user_id": "507f1f77bcf86cd799439012",
      "rating": 5,
      "comment": "Amazing experience!",
      "createdAt": "2026-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### Trip Batches

**GET** `/trips/:id/batches`

Get available dates/batches for a trip.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "start_date": "2026-02-01T00:00:00.000Z",
      "end_date": "2026-02-05T00:00:00.000Z",
      "total_slots": 20,
      "available_slots": 15,
      "price_override": 18000,
      "status": "OPEN"
    }
  ]
}
```

---

## Bookings API

All endpoints require: Bearer token

---

### Create Booking

**POST** `/bookings`

Book a trip.

#### Request Body

**New Format (Recommended):**

```json
{
  "batchId": "507f1f77bcf86cd799439012",
  "pickupLocation": "Vicarabad, Andhra Pradesh",
  "slots": 3,
  "message": "Looking forward to this trip!"
}
```

| Field          | Type   | Required | Description                                   |
| -------------- | ------ | -------- | --------------------------------------------- |
| batchId        | string | Yes      | Batch ID                                      |
| pickupLocation | string | No       | Pickup location (must match trip's locations) |
| slots          | number | Yes      | Number of travelers (≥ 1)                     |
| message        | string | No       | Special message or request for the host       |

**Old Format (Backward Compatible):**

```json
{
  "trip_id": "507f1f77bcf86cd799439011",
  "batch_id": "507f1f77bcf86cd799439012",
  "num_travelers": 2
}
```

| Field         | Type   | Required | Description                                       |
| ------------- | ------ | -------- | ------------------------------------------------- |
| trip_id       | string | No       | Trip ID (auto-derived from batch if not provided) |
| batch_id      | string | Yes      | Batch ID                                          |
| num_travelers | number | Yes      | Number of travelers (≥ 1)                         |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Resource created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439014",
    "trip_id": "507f1f77bcf86cd799439011",
    "batch_id": "507f1f77bcf86cd799439012",
    "num_travelers": 3,
    "pickup_location": "Vicarabad, Andhra Pradesh",
    "message": "Looking forward to this trip!",
    "total_amount": 45000,
    "status": "PENDING",
    "payment_status": "PENDING",
    "createdAt": "2026-01-18T10:00:00.000Z",
    "updatedAt": "2026-01-18T10:00:00.000Z",
    "trip": { "title": "Mountain Adventure", "slug": "mountain-adventure" },
    "batch": { "start_date": "2026-02-01", "end_date": "2026-02-05" }
  }
}
```

**400 Bad Request** - Validation error

```json
{
  "status": "error",
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "batchId": "Batch ID is required",
      "slots": "Number of travelers must be at least 1"
    }
  }
}
```

**400 Bad Request** - Not enough slots

```json
{
  "status": "error",
  "message": "Not enough slots available",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**400 Bad Request** - Invalid pickup location

```json
{
  "status": "error",
  "message": "Invalid pickup location",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

#### Notes

- Trip ID is automatically derived from the batch if not provided
- Pickup location is validated against the trip's available pickup locations
- Available slots are automatically decremented when booking is created
- Total amount is calculated as: (batch price or trip base price) × number of travelers

---

### Booking Details

**GET** `/bookings/:id`

Get booking information.

**200 OK** - Booking details  
**403 Forbidden** - Not your booking  
**404 Not Found** - Booking not found

---

### Cancel Booking

**PATCH** `/bookings/:id/cancel`

Cancel a booking. Restores available slots.

#### Request Body (optional)

```json
{
  "reason": "Change of plans"
}
```

**200 OK** - Booking cancelled  
**400 Bad Request** - Already cancelled or completed  
**403 Forbidden** - Not your booking  
**404 Not Found** - Booking not found

---

### My Bookings

**GET** `/users/me/bookings`

Get all bookings for the authenticated user.

#### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "trip_id": "507f1f77bcf86cd799439011",
      "batch_id": "507f1f77bcf86cd799439012",
      "num_travelers": 2,
      "total_amount": 30000,
      "status": "CONFIRMED",
      "payment_status": "PAID",
      "trip": { "title": "Mountain Adventure", "slug": "mountain-adventure" },
      "batch": { "start_date": "2026-02-01", "end_date": "2026-02-05" }
    }
  ]
}
```

---

### Host Pending Bookings

**GET** `/host/bookings/pending`

Get all pending booking requests for the host's trips.

Requires: Bearer token + HOST role

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "user_id": "507f1f77bcf86cd799439014",
      "trip_id": "507f1f77bcf86cd799439011",
      "batch_id": "507f1f77bcf86cd799439012",
      "num_travelers": 3,
      "pickup_location": "Vicarabad, Andhra Pradesh",
      "message": "Looking forward to this trip!",
      "total_amount": 45000,
      "status": "PENDING",
      "payment_status": "PENDING",
      "createdAt": "2026-01-18T10:00:00.000Z",
      "updatedAt": "2026-01-18T10:00:00.000Z",
      "trip": {
        "title": "Mountain Adventure",
        "slug": "mountain-adventure"
      },
      "batch": {
        "start_date": "2026-02-01T00:00:00.000Z",
        "end_date": "2026-02-05T00:00:00.000Z"
      },
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### Notes

- Returns all bookings with status `PENDING` for trips owned by the authenticated host
- Includes user details (name and email) for each booking
- Sorted by creation date (newest first)
- Empty array returned if host has no trips or no pending bookings
- When a booking is created with PENDING status, an email notification is automatically sent to the host

---

### Reject Booking Request

**POST** `/host/bookings/:id/reject`

Reject a pending booking request for your trip.

Requires: Bearer token + HOST role

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Booking ID  |

#### Request Body

```json
{
  "reason": "Unfortunately, we are unable to accommodate your request at this time."
}
```

| Field  | Type   | Required | Description                                   |
| ------ | ------ | -------- | --------------------------------------------- |
| reason | string | No       | Reason for rejection (sent to user via email) |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Booking rejected successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439014",
    "trip_id": "507f1f77bcf86cd799439011",
    "batch_id": "507f1f77bcf86cd799439012",
    "num_travelers": 3,
    "total_amount": 45000,
    "status": "CANCELLED",
    "payment_status": "PENDING",
    "cancellation_reason": "Rejected by host",
    "createdAt": "2026-01-18T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Only pending bookings can be rejected

```json
{
  "status": "error",
  "message": "Only pending bookings can be rejected",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**403 Forbidden** - Not your trip

```json
{
  "status": "error",
  "message": "Access forbidden",
  "error": {
    "code": "FORBIDDEN_ERROR"
  }
}
```

**404 Not Found** - Booking not found

```json
{
  "status": "error",
  "message": "Booking not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### What Happens

1. Booking status is changed from `PENDING` to `CANCELLED`
2. Cancellation reason is set to provided reason or "Rejected by host"
3. Available slots are restored to the batch
4. User receives an email notification with the rejection reason

#### Notes

- Only bookings with status `PENDING` can be rejected
- Only the trip owner (host) can reject bookings for their trips
- Slots are automatically restored to the batch when booking is rejected
- User receives an automated email notification with the rejection reason

---

### Confirm Booking Request

**POST** `/host/bookings/:id/confirm`

Confirm a pending booking request for your trip. Changes status to CONFIRMED and notifies user to complete payment.

Requires: Bearer token + HOST role

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| id        | Booking ID  |

#### Request Body

No request body required.

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Booking confirmed successfully. User notified to complete payment.",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439014",
    "trip_id": "507f1f77bcf86cd799439011",
    "batch_id": "507f1f77bcf86cd799439012",
    "num_travelers": 3,
    "pickup_location": "Vicarabad, Andhra Pradesh",
    "message": "Looking forward to this trip!",
    "total_amount": 45000,
    "status": "CONFIRMED",
    "payment_status": "PENDING",
    "createdAt": "2026-01-18T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Only pending bookings can be confirmed

```json
{
  "status": "error",
  "message": "Only pending bookings can be confirmed",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**403 Forbidden** - Not your trip

```json
{
  "status": "error",
  "message": "Access forbidden",
  "error": {
    "code": "FORBIDDEN_ERROR"
  }
}
```

**404 Not Found** - Booking not found

```json
{
  "status": "error",
  "message": "Booking not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### What Happens

1. Booking status is changed from `PENDING` to `CONFIRMED`
2. Slots remain reserved (not restored)
3. User receives an email notification with payment instructions
4. Email includes:
   - Booking confirmation
   - Total amount due
   - Payment deadline (24 hours)
   - Payment link
   - Trip details

#### Notes

- Only bookings with status `PENDING` can be confirmed
- Only the trip owner (host) can confirm bookings for their trips
- Slots remain reserved for the user
- User receives an automated email with payment instructions
- Payment must be completed within 24 hours to finalize the booking
- If payment is not completed, booking may be cancelled

---

## Payments API

---

### Initiate Payment

**POST** `/payments/initiate`

Requires: Bearer token

Start payment for a booking.

#### Request Body

```json
{
  "booking_id": "507f1f77bcf86cd799439011",
  "gateway": "razorpay"
}
```

| Field      | Type   | Required | Description                         |
| ---------- | ------ | -------- | ----------------------------------- |
| booking_id | string | Yes      | Booking ID                          |
| gateway    | string | No       | Payment gateway (default: razorpay) |

#### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "booking_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439013",
    "amount": 30000,
    "currency": "INR",
    "gateway": "razorpay",
    "gateway_order_id": "order_abc123",
    "status": "INITIATED",
    "checkout_url": "https://payment-gateway.example.com/pay/order_abc123",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Already paid or cancelled booking

---

### Payment Webhook

**POST** `/payments/webhook`

No authentication (called by payment gateway).

#### Request Body

```json
{
  "gateway_payment_id": "pay_xyz789",
  "gateway_order_id": "order_abc123",
  "status": "SUCCESS",
  "metadata": {}
}
```

| Field              | Type   | Required | Description        |
| ------------------ | ------ | -------- | ------------------ |
| gateway_payment_id | string | Yes      | Gateway payment ID |
| gateway_order_id   | string | Yes      | Gateway order ID   |
| status             | string | Yes      | SUCCESS or FAILED  |
| metadata           | object | No       | Additional data    |

On SUCCESS: Updates booking to CONFIRMED and payment_status to PAID.

---

### Get Public Payment Details

**GET** `/public/payments/:paymentId`

Get payment details for payment gateway integration. No authentication required.

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| paymentId | Payment ID  |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": {
    "paymentId": "507f1f77bcf86cd799439012",
    "bookingId": "507f1f77bcf86cd799439011",
    "tripTitle": "Rajasthan Desert Adventure",
    "amount": 45000,
    "currency": "INR",
    "status": "PENDING",
    "razorpayOrderId": "order_1737104400000_abc123",
    "razorpayKeyId": "rzp_test_key",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "description": "Payment for Rajasthan Desert Adventure - 3 traveler(s)"
  }
}
```

| Field           | Type   | Description                              |
| --------------- | ------ | ---------------------------------------- |
| paymentId       | string | Payment ID                               |
| bookingId       | string | Associated booking ID                    |
| tripTitle       | string | Trip name                                |
| amount          | number | Payment amount in smallest currency unit |
| currency        | string | Currency code (INR)                      |
| status          | string | PENDING, COMPLETED, or FAILED            |
| razorpayOrderId | string | Razorpay order ID for payment processing |
| razorpayKeyId   | string | Razorpay public key ID                   |
| customerName    | string | Customer's full name                     |
| customerEmail   | string | Customer's email                         |
| customerPhone   | string | Customer's phone number                  |
| description     | string | Payment description                      |

**404 Not Found** - Payment not found

```json
{
  "status": "error",
  "message": "Payment not found",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### Notes

- This endpoint is public (no authentication required) for payment gateway integration
- Status mapping:
  - `INITIATED` or `PENDING` → `PENDING`
  - `SUCCESS` → `COMPLETED`
  - `FAILED` → `FAILED`
- Use `razorpayOrderId` and `razorpayKeyId` to initialize Razorpay checkout
- Customer details are included for pre-filling payment form

---

### Get Payment by Booking ID

**GET** `/public/bookings/:bookingId/payment`

Get or create payment details for a booking. No authentication required.

#### Path Parameters

| Parameter | Description |
| --------- | ----------- |
| bookingId | Booking ID  |

#### Response

**200 OK**

```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": {
    "paymentId": "507f1f77bcf86cd799439012",
    "bookingId": "507f1f77bcf86cd799439011",
    "tripTitle": "Rajasthan Desert Adventure",
    "amount": 45000,
    "currency": "INR",
    "status": "PENDING",
    "razorpayOrderId": "order_S5osjV1HgYXkpQ",
    "razorpayKeyId": "rzp_test_S5nCphxViZezp4",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "description": "Payment for Rajasthan Desert Adventure - 3 traveler(s)"
  }
}
```

**400 Bad Request** - Invalid booking ID, cancelled booking, or already paid

```json
{
  "status": "error",
  "message": "Booking is already paid",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**404 Not Found** - Booking not found

#### Notes

- This endpoint is public (no authentication required)
- If no payment exists for the booking, it automatically creates one
- Creates a real Razorpay order via API (falls back to mock if Razorpay fails)
- Use this endpoint when user clicks payment link from email (which contains booking ID)
- Returns same format as `/public/payments/:paymentId` endpoint

---

### Verify Payment

**POST** `/public/payments/verify`

Verify Razorpay payment signature and complete payment. No authentication required.

#### Request Body

```json
{
  "razorpay_payment_id": "pay_S5ovIQFWGAZ9xA",
  "razorpay_order_id": "order_S5ouJ5R8zQlzme",
  "razorpay_signature": "7eb1d9c47f8a5919eee7c37ae767fe0e02f8bb1f9592cc79cad23b8ef9f8d4fd"
}
```

| Field               | Type   | Required | Description                              |
| ------------------- | ------ | -------- | ---------------------------------------- |
| razorpay_payment_id | string | Yes      | Payment ID from Razorpay                 |
| razorpay_order_id   | string | Yes      | Order ID from Razorpay                   |
| razorpay_signature  | string | Yes      | Signature from Razorpay for verification |

#### Response

**200 OK** - Payment verified successfully

```json
{
  "status": "success",
  "message": "Payment verified successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "booking_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439013",
    "amount": 45000,
    "currency": "INR",
    "gateway": "razorpay",
    "gateway_payment_id": "pay_S5ovIQFWGAZ9xA",
    "gateway_order_id": "order_S5ouJ5R8zQlzme",
    "status": "SUCCESS",
    "createdAt": "2026-01-19T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:30:00.000Z"
  }
}
```

**400 Bad Request** - Invalid signature or missing fields

```json
{
  "status": "error",
  "message": "Invalid payment signature",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

**404 Not Found** - Payment not found for order ID

```json
{
  "status": "error",
  "message": "Payment not found for this order",
  "error": {
    "code": "NOT_FOUND_ERROR"
  }
}
```

#### What Happens on Success

1. Payment signature is verified using HMAC SHA256
2. Payment status is updated to `SUCCESS`
3. Booking `payment_status` is updated to `PAID`
4. User receives confirmation email with:
   - Booking confirmation details
   - Trip dates and pickup location
   - Host contact information (name, email, phone)
   - Total amount paid

#### Notes

- This endpoint is public (no authentication required)
- Called by frontend after Razorpay payment completion
- Signature verification ensures payment authenticity
- Email is sent asynchronously (doesn't block response)
- If signature is invalid, payment status is set to `FAILED`

---

### Payment Status

**GET** `/payments/:id`

Requires: Bearer token

Get payment details.

**200 OK** - Payment details  
**403 Forbidden** - Not your payment  
**404 Not Found** - Payment not found

---

## Reviews API

All endpoints require: Bearer token

---

### Submit Review

**POST** `/reviews`

Submit a review for a completed trip.

#### Request Body

```json
{
  "trip_id": "507f1f77bcf86cd799439011",
  "rating": 5,
  "comment": "Amazing experience! Highly recommended."
}
```

| Field   | Type   | Required | Description    |
| ------- | ------ | -------- | -------------- |
| trip_id | string | Yes      | Trip ID        |
| rating  | number | Yes      | Rating 1-5     |
| comment | string | Yes      | Review comment |

#### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "trip_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439013",
    "rating": 5,
    "comment": "Amazing experience! Highly recommended.",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

**400 Bad Request** - Must have completed booking, or already reviewed

---

### Update Review

**PUT** `/reviews/:id`

Edit your review.

#### Request Body

```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

**200 OK** - Updated review  
**403 Forbidden** - Not your review  
**404 Not Found** - Review not found

---

### Delete Review

**DELETE** `/reviews/:id`

Remove your review.

**200 OK** - Review deleted  
**403 Forbidden** - Not your review  
**404 Not Found** - Review not found

---

## Support API

No authentication required.

---

### Contact Us

**POST** `/support/contact`

Submit a contact message.

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I have a question about your trips."
}
```

| Field   | Type   | Required | Description     |
| ------- | ------ | -------- | --------------- |
| name    | string | Yes      | Sender name     |
| email   | string | Yes      | Valid email     |
| phone   | string | Yes      | Phone number    |
| message | string | Yes      | Message content |

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "I have a question about your trips.",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

---

### Subscribe Newsletter

**POST** `/newsletter/subscribe`

Subscribe to email newsletter.

#### Request Body

```json
{
  "email": "john@example.com"
}
```

#### Response

**201 Created**

```json
{
  "status": "success",
  "message": "Subscribed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "subscribed_at": "2026-01-16T10:00:00.000Z"
  }
}
```

Note: If already subscribed, returns existing subscription (idempotent).

---

## Chat System API

Base URL: `/api/trips/:tripId/chat`

All endpoints require: Bearer token in `Authorization` header

### Overview

The chat system provides three-way communication between users, hosts, and admins with strict message visibility rules:

- **USER messages**: Visible only to HOST and ADMIN
- **HOST messages**: Visible to ALL USERS and ADMIN
- **ADMIN messages**: Visible to ALL USERS and HOST

---

### Get Chat Messages

**GET** `/api/trips/:tripId/chat/messages`

Fetches chat messages for a trip with pagination and automatic visibility filtering.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| tripId    | string | Yes      | Trip ID     |

#### Query Parameters

| Parameter | Type   | Required | Default | Description                  |
| --------- | ------ | -------- | ------- | ---------------------------- |
| page      | number | No       | 1       | Page number                  |
| limit     | number | No       | 50      | Messages per page (max: 100) |

#### Example Request

```bash
GET /api/trips/507f1f77bcf86cd799439011/chat/messages?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "chatId": "507f1f77bcf86cd799439019",
        "senderId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe",
          "email": "john@example.com",
          "profilePicture": "https://example.com/avatar.jpg"
        },
        "senderRole": "USER",
        "messageType": "TEXT",
        "content": "When do we depart?",
        "createdAt": "2026-01-19T10:00:00.000Z",
        "isEdited": false
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "chatId": "507f1f77bcf86cd799439019",
        "senderId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Host Name",
          "email": "host@example.com"
        },
        "senderRole": "HOST",
        "messageType": "TEXT",
        "content": "We depart at 8:00 AM sharp!",
        "createdAt": "2026-01-19T10:05:00.000Z",
        "isEdited": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "hasMore": true,
      "totalPages": 3
    }
  }
}
```

**403 Forbidden** - Not a participant

```json
{
  "success": false,
  "message": "Not a participant of this chat"
}
```

**404 Not Found** - Chat not found

```json
{
  "success": false,
  "message": "Chat not found for this trip"
}
```

#### Notes

- Messages are automatically filtered based on user's role and visibility rules
- Messages are returned in chronological order (oldest first)
- Only active participants can access chat messages
- Deleted messages are excluded from results

---

### Get Chat Participants

**GET** `/api/trips/:tripId/chat/participants`

Returns all active participants in a trip chat, grouped by role.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| tripId    | string | Yes      | Trip ID     |

#### Example Request

```bash
GET /api/trips/507f1f77bcf86cd799439011/chat/participants
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "participants": {
      "host": {
        "_id": "507f1f77bcf86cd799439015",
        "chatId": "507f1f77bcf86cd799439019",
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Host Name",
          "email": "host@example.com",
          "profilePicture": "https://example.com/host-avatar.jpg"
        },
        "role": "HOST",
        "joinedAt": "2026-01-15T10:00:00.000Z",
        "isActive": true
      },
      "admins": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "chatId": "507f1f77bcf86cd799439019",
          "userId": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Admin User",
            "email": "admin@example.com"
          },
          "role": "ADMIN",
          "joinedAt": "2026-01-15T10:00:00.000Z",
          "isActive": true
        }
      ],
      "users": [
        {
          "_id": "507f1f77bcf86cd799439017",
          "chatId": "507f1f77bcf86cd799439019",
          "userId": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "role": "USER",
          "joinedAt": "2026-01-16T10:00:00.000Z",
          "isActive": true
        }
      ]
    },
    "total": 10
  }
}
```

**403 Forbidden** - Unauthorized access

```json
{
  "success": false,
  "message": "Unauthorized access to chat"
}
```

**404 Not Found** - Chat not found

```json
{
  "success": false,
  "message": "Chat not found for this trip"
}
```

#### Notes

- Only active participants can view the participant list
- Participants are grouped by role for easier frontend handling
- Includes user profile information (name, email, profile picture)

---

### Get Unread Message Count

**GET** `/api/trips/:tripId/chat/unread-count`

Returns the number of unread messages for the current user.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| tripId    | string | Yes      | Trip ID     |

#### Example Request

```bash
GET /api/trips/507f1f77bcf86cd799439011/chat/unread-count
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

**404 Not Found** - Chat not found

```json
{
  "success": false,
  "message": "Chat not found"
}
```

#### Notes

- Count is based on messages received after user's `lastReadAt` timestamp
- Excludes user's own messages from count
- Returns 0 if user is not an active participant

---

### Mark Messages as Read

**POST** `/api/trips/:tripId/chat/mark-read`

Marks all messages in the chat as read for the current user.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| tripId    | string | Yes      | Trip ID     |

#### Example Request

```bash
POST /api/trips/507f1f77bcf86cd799439011/chat/mark-read
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

#### Response

**200 OK**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

**404 Not Found** - Chat not found

```json
{
  "success": false,
  "message": "Chat not found"
}
```

#### Notes

- Updates the user's `lastReadAt` timestamp to current time
- Affects unread count calculation for future messages
- Idempotent - can be called multiple times safely

---

### Send System Message (Admin Only)

**POST** `/api/trips/:tripId/chat/system-message`

Sends a system message visible to all participants. Admin role required.

#### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| tripId    | string | Yes      | Trip ID     |

#### Request Body

```json
{
  "content": "Trip departure time changed to 8:00 AM"
}
```

| Field   | Type   | Required | Description                             |
| ------- | ------ | -------- | --------------------------------------- |
| content | string | Yes      | System message content (max 5000 chars) |

#### Example Request

```bash
POST /api/trips/507f1f77bcf86cd799439011/chat/system-message
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "content": "Trip departure time changed to 8:00 AM"
}
```

#### Response

**201 Created**

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "507f1f77bcf86cd799439022",
      "chatId": "507f1f77bcf86cd799439019",
      "senderId": "000000000000000000000000",
      "senderRole": "ADMIN",
      "messageType": "SYSTEM",
      "content": "Trip departure time changed to 8:00 AM",
      "visibleTo": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
      "createdAt": "2026-01-19T10:30:00.000Z"
    }
  }
}
```

**400 Bad Request** - Missing content

```json
{
  "success": false,
  "message": "Message content is required"
}
```

**403 Forbidden** - Not an admin

```json
{
  "success": false,
  "message": "Only admins can send system messages"
}
```

**404 Not Found** - Chat not found

```json
{
  "success": false,
  "message": "Chat not found"
}
```

#### Notes

- Only users with ADMIN role can send system messages
- System messages are visible to all participants
- System messages have a special sender ID (all zeros)
- Useful for announcements, policy changes, or important updates

---

## Socket.IO Real-Time Chat

Base URL: `ws://your-server-url` or `wss://your-server-url` (for production)

### Connection

Connect to Socket.IO server with JWT authentication:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "YOUR_JWT_TOKEN",
  },
  transports: ["websocket", "polling"],
});
```

### Client → Server Events

#### Join Chat Room

```javascript
socket.emit("join:chat", {
  chatId: "507f1f77bcf86cd799439019",
});
```

**Parameters:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| chatId | string | Yes      | Chat ID     |

**Response Event:** `joined:chat`

---

#### Leave Chat Room

```javascript
socket.emit("leave:chat", {
  chatId: "507f1f77bcf86cd799439019",
});
```

**Parameters:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| chatId | string | Yes      | Chat ID     |

---

#### Send Message

```javascript
socket.emit("send:message", {
  chatId: "507f1f77bcf86cd799439019",
  content: "Hello everyone!",
  messageType: "TEXT",
  metadata: {
    tempId: "temp-123", // For optimistic updates
  },
});
```

**Parameters:**

| Field       | Type   | Required | Description                                          |
| ----------- | ------ | -------- | ---------------------------------------------------- |
| chatId      | string | Yes      | Chat ID                                              |
| content     | string | Yes      | Message content (max 5000 chars)                     |
| messageType | string | No       | TEXT, IMAGE, or FILE (default: TEXT)                 |
| metadata    | object | No       | Additional metadata (e.g., tempId for optimistic UI) |

**Response Event:** `message:sent`

---

#### Typing Indicators

```javascript
// Start typing
socket.emit("typing:start", {
  chatId: "507f1f77bcf86cd799439019",
});

// Stop typing
socket.emit("typing:stop", {
  chatId: "507f1f77bcf86cd799439019",
});
```

**Parameters:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| chatId | string | Yes      | Chat ID     |

---

#### Mark as Read

```javascript
socket.emit("mark:read", {
  chatId: "507f1f77bcf86cd799439019",
});
```

**Parameters:**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| chatId | string | Yes      | Chat ID     |

**Response Event:** `marked:read`

---

### Server → Client Events

#### Successfully Joined Chat

```javascript
socket.on("joined:chat", (data) => {
  console.log("Joined chat:", data);
  // data: { chatId, roomName, unreadCount }
});
```

**Data:**

```json
{
  "chatId": "507f1f77bcf86cd799439019",
  "roomName": "trip:507f1f77bcf86cd799439019",
  "unreadCount": 5
}
```

---

#### New Message Received

```javascript
socket.on("new:message", (data) => {
  console.log("New message:", data.message);
  // Add message to UI
});
```

**Data:**

```json
{
  "message": {
    "_id": "507f1f77bcf86cd799439020",
    "chatId": "507f1f77bcf86cd799439019",
    "sender": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "senderRole": "USER",
    "content": "Hello everyone!",
    "messageType": "TEXT",
    "metadata": {},
    "createdAt": "2026-01-19T10:00:00.000Z",
    "isEdited": false
  }
}
```

**Note:** Messages are only emitted to users who should see them based on visibility rules.

---

#### User Typing

```javascript
socket.on("user:typing", (data) => {
  console.log("User is typing:", data.userId);
  // Show typing indicator
});
```

**Data:**

```json
{
  "userId": "507f1f77bcf86cd799439012",
  "chatId": "507f1f77bcf86cd799439019"
}
```

---

#### User Stopped Typing

```javascript
socket.on("user:stopped-typing", (data) => {
  console.log("User stopped typing:", data.userId);
  // Hide typing indicator
});
```

**Data:**

```json
{
  "userId": "507f1f77bcf86cd799439012",
  "chatId": "507f1f77bcf86cd799439019"
}
```

---

#### Participant Joined

```javascript
socket.on("participant:joined", (data) => {
  console.log("New participant:", data.userName);
  // Update participant list
});
```

**Data:**

```json
{
  "chatId": "507f1f77bcf86cd799439019",
  "userId": "507f1f77bcf86cd799439012",
  "userName": "John Doe"
}
```

---

#### Participant Left

```javascript
socket.on("participant:left", (data) => {
  console.log("Participant left:", data.userName);
  // Update participant list
});
```

**Data:**

```json
{
  "chatId": "507f1f77bcf86cd799439019",
  "userId": "507f1f77bcf86cd799439012",
  "userName": "John Doe"
}
```

---

#### Message Sent Confirmation

```javascript
socket.on("message:sent", (data) => {
  console.log("Message sent successfully:", data.messageId);
  // Update optimistic UI with real message ID
});
```

**Data:**

```json
{
  "messageId": "507f1f77bcf86cd799439020",
  "tempId": "temp-123"
}
```

---

#### Marked as Read Confirmation

```javascript
socket.on("marked:read", (data) => {
  console.log("Messages marked as read");
});
```

**Data:**

```json
{
  "chatId": "507f1f77bcf86cd799439019"
}
```

---

#### Error

```javascript
socket.on("error", (data) => {
  console.error("Socket error:", data.message);
  // Handle error
});
```

**Data:**

```json
{
  "message": "Unauthorized access to chat",
  "code": "UNAUTHORIZED"
}
```

**Error Codes:**

| Code               | Description                     |
| ------------------ | ------------------------------- |
| UNAUTHORIZED       | User not authorized for chat    |
| JOIN_CHAT_ERROR    | Failed to join chat             |
| SEND_MESSAGE_ERROR | Failed to send message          |
| MARK_READ_ERROR    | Failed to mark messages as read |

---

### Chat Integration with Bookings

#### Automatic Chat Creation

When payment is verified successfully, the user is automatically:

1. Added to the trip chat as a participant (with HOST)
2. Joined to the Socket.IO room
3. A system message is sent: "User X joined the trip chat"

**Backend Integration:**

```typescript
// In paymentService.verifyAndCompletePaymentByOrderId()
import { paymentChatIntegrationService } from "../chat/payment-integration.service";

await paymentChatIntegrationService.onPaymentSuccess(tripId, userId, userName, hostId);
```

**Chat Group Members:**

- ✅ **Host** - Automatically added when first user joins
- ✅ **User** - Automatically added after successful payment verification
- ⚠️ **Admin** - Must manually join using the admin endpoint (see below)

#### Admin Joining Trip Chat

Admins can manually join any trip chat for moderation or support purposes.

**POST** `/admin/trips/:id/chat/join`

**Authentication:** Required (Admin only)

**Response:**

```json
{
  "status": "success",
  "message": "Successfully joined trip chat"
}
```

#### Booking Cancellation

When a booking is cancelled or refunded, the user is:

1. Removed from the trip chat (soft delete)
2. Disconnected from the Socket.IO room
3. A system message is sent: "User X left the trip chat"

**Backend Integration:**

```typescript
// In bookingService.cancel()
await paymentChatIntegrationService.onBookingCancellation(tripId, userId, userName);
```

---

### Message Visibility Rules (CRITICAL)

The chat system enforces strict visibility rules based on sender role:

#### USER Messages

- **Visible to:** HOST + ADMIN only
- **Not visible to:** Other USERS

**Example:**

```
User A sends: "When do we depart?"
✓ Host sees it
✓ Admin sees it
✗ User B does NOT see it
✗ User C does NOT see it
```

#### HOST Messages

- **Visible to:** ALL USERS + ADMIN

**Example:**

```
Host sends: "We depart at 8:00 AM"
✓ User A sees it
✓ User B sees it
✓ User C sees it
✓ Admin sees it
```

#### ADMIN Messages

- **Visible to:** ALL USERS + HOST

**Example:**

```
Admin sends: "Please ensure all documents are ready"
✓ User A sees it
✓ User B sees it
✓ User C sees it
✓ Host sees it
```

#### SYSTEM Messages

- **Visible to:** ALL participants

**Example:**

```
System: "User X joined the trip chat"
✓ All users see it
✓ Host sees it
✓ Admin sees it
```

---

### Frontend Implementation Example

```javascript
// Initialize Socket.IO
const socket = io("http://localhost:3000", {
  auth: { token: localStorage.getItem("token") },
});

// Join chat when component mounts
useEffect(() => {
  socket.emit("join:chat", { chatId: tripChatId });

  // Listen for new messages
  socket.on("new:message", (data) => {
    setMessages((prev) => [...prev, data.message]);
  });

  // Listen for typing indicators
  socket.on("user:typing", (data) => {
    setTypingUsers((prev) => [...prev, data.userId]);
  });

  socket.on("user:stopped-typing", (data) => {
    setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
  });

  // Cleanup
  return () => {
    socket.emit("leave:chat", { chatId: tripChatId });
    socket.off("new:message");
    socket.off("user:typing");
    socket.off("user:stopped-typing");
  };
}, [tripChatId]);

// Send message
const sendMessage = (content) => {
  socket.emit("send:message", {
    chatId: tripChatId,
    content,
    messageType: "TEXT",
  });
};

// Typing indicators
const handleTyping = () => {
  socket.emit("typing:start", { chatId: tripChatId });

  // Clear typing after 3 seconds
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("typing:stop", { chatId: tripChatId });
  }, 3000);
};
```

---

### Security & Best Practices

1. **Authentication**: All socket connections require valid JWT token
2. **Authorization**: Users must be active participants to access chat
3. **Visibility Enforcement**: Server-side filtering ensures message visibility rules
4. **Input Validation**: Message content limited to 5000 characters
5. **Rate Limiting**: Consider implementing rate limits for message sending
6. **XSS Prevention**: Sanitize message content on frontend before rendering

---

### Troubleshooting

#### Messages not appearing

**Check:**

- User is an active participant in the chat
- User's role matches visibility rules
- Socket connection is established
- JWT token is valid

#### Socket connection failing

**Check:**

- JWT token is provided in auth header
- CORS is configured correctly
- Frontend URL matches backend configuration
- WebSocket transport is enabled

#### Unread count incorrect

**Check:**

- `lastReadAt` timestamp is updated when marking as read
- Own messages are excluded from unread count
- User is an active participant

---

### Environment Variables

Add to `.env`:

```env
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:4200
PORT=3000
```

---

### Installation & Setup

1. **Install dependencies:**

```bash
npm install socket.io
npm install --save-dev @types/socket.io
```

2. **Create database indexes:**

```bash
npm run setup:chat-indexes
```

3. **Update server entry point:**

```typescript
// src/index.ts
import { createServer } from "http";
import { initializeSocketService } from "./services/socket/socket.service";

const app = express();
const httpServer = createServer(app);
initializeSocketService(httpServer);
httpServer.listen(PORT);
```

For complete implementation details, see:

- `CHAT_SYSTEM_IMPLEMENTATION.md` - Full implementation guide
- `CHAT_ARCHITECTURE.md` - System architecture
- `CHAT_QUICK_REFERENCE.md` - Quick reference guide
- `src/services/chat/README.md` - Service documentation

---
