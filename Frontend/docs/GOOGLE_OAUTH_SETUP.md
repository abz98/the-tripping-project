# Google OAuth Setup Guide

## Overview

Google OAuth login has been implemented in the login component. Follow these steps to complete the setup.

## Frontend Setup (Already Complete) ✅

The frontend implementation is ready with:

- Google Sign-In button integration
- Automatic credential handling
- Token exchange with backend
- Error handling and user feedback

## Required: Get Google Client ID

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity Services**

### 2. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: TripWiz Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:4200` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:4200` (development)
     - `https://yourdomain.com` (production)
5. Click **Create**
6. Copy the **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)

### 3. Update Frontend Configuration

Open `src/app/login/login.ts` and replace the placeholder:

```typescript
google.accounts.id.initialize({
  client_id: "YOUR_GOOGLE_CLIENT_ID", // ← Replace this
  callback: (response: any) => this.handleGoogleCallback(response),
  auto_select: false,
});
```

With your actual Client ID:

```typescript
google.accounts.id.initialize({
  client_id: "123456789-abc123def456.apps.googleusercontent.com",
  callback: (response: any) => this.handleGoogleCallback(response),
  auto_select: false,
});
```

## Backend Setup (Required)

### 1. Install Google Auth Library

```bash
npm install google-auth-library
```

### 2. Create Google Auth Endpoint

Create or update `src/routes/auth.routes.js`:

```javascript
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        status: "error",
        message: "Google credential is required",
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        full_name: name,
        googleId,
        profilePicture: picture,
        isEmailVerified: true, // Google emails are pre-verified
        role: "USER",
        authProvider: "GOOGLE",
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.profilePicture = picture || user.profilePicture;
      user.isEmailVerified = true;
      await user.save();
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.json({
      status: "success",
      message: "Google login successful",
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      status: "error",
      message: "Invalid Google credential",
    });
  }
});
```

### 3. Update User Model

Add Google-specific fields to your User model:

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google users
  full_name: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  authProvider: {
    type: String,
    enum: ["LOCAL", "GOOGLE"],
    default: "LOCAL",
  },
  isEmailVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["USER", "HOST", "ADMIN"],
    default: "USER",
  },
  // ... other fields
});
```

### 4. Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### 5. JWT Token Generation

Ensure your JWT generation includes necessary user data:

```javascript
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
}
```

## Testing

### 1. Test Login Flow

1. Start your backend server
2. Start your frontend: `npm start`
3. Navigate to `/login`
4. Click the Google Sign-In button
5. Select your Google account
6. Verify you're redirected to `/home`
7. Check that authentication state is maintained

### 2. Test Registration Flow

1. Navigate to `/login` and click "Register"
2. Click the Google Sign-In button
3. Select your Google account
4. Verify new user is created in database
5. Verify you're redirected to `/home`

### 3. Verify Token Storage

Open browser DevTools → Application → Cookies:

- `accessToken` should be present
- `refreshToken` should be present
- `tokenExpiry` should be present

### 4. Test Logout

1. Click profile dropdown → Logout
2. Verify cookies are cleared
3. Verify redirect to `/login`

## Security Considerations

### 1. HTTPS in Production

Always use HTTPS in production for OAuth:

```javascript
// In production
const origins = ["https://yourdomain.com"];
```

### 2. Validate Tokens Server-Side

Always verify Google tokens on the backend:

```javascript
const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: process.env.GOOGLE_CLIENT_ID,
});
```

### 3. Secure Cookie Settings

In production, use secure cookies:

```javascript
res.cookie("accessToken", token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: "strict",
  maxAge: 3600000, // 1 hour
});
```

### 4. Rate Limiting

Implement rate limiting on auth endpoints:

```javascript
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
});

router.post("/auth/google", authLimiter, googleAuthHandler);
```

## Troubleshooting

### Issue: "Invalid Client ID"

**Solution**: Verify your Client ID is correct in `login.ts` and matches the one in Google Cloud Console.

### Issue: "Redirect URI mismatch"

**Solution**: Add your current URL to Authorized redirect URIs in Google Cloud Console.

### Issue: "Google button not showing"

**Solution**:

1. Check browser console for errors
2. Verify Google script is loaded: `https://accounts.google.com/gsi/client`
3. Ensure `renderGoogleButton()` is called after script loads

### Issue: "Token verification failed"

**Solution**:

1. Verify `GOOGLE_CLIENT_ID` in backend `.env` matches frontend
2. Check token hasn't expired
3. Ensure `google-auth-library` is installed

### Issue: "User created but not logged in"

**Solution**:

1. Check JWT token generation
2. Verify tokens are being saved to cookies
3. Check `AuthService.setTokens()` is called

## Production Checklist

- [ ] Replace `YOUR_GOOGLE_CLIENT_ID` with actual Client ID
- [ ] Add production domain to Google Cloud Console
- [ ] Set `GOOGLE_CLIENT_ID` in production environment variables
- [ ] Enable HTTPS
- [ ] Configure secure cookies
- [ ] Implement rate limiting
- [ ] Test OAuth flow in production
- [ ] Monitor error logs
- [ ] Set up OAuth consent screen in Google Cloud Console
- [ ] Add privacy policy and terms of service links

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [google-auth-library NPM](https://www.npmjs.com/package/google-auth-library)

## Support

For issues or questions:

1. Check Google Cloud Console for OAuth configuration
2. Verify Client ID matches in frontend and backend
3. Check browser console for JavaScript errors
4. Check backend logs for token verification errors
5. Ensure all authorized origins and redirect URIs are configured
