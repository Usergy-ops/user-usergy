
# Google Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for your Supabase project.

## Prerequisites

1. A Google Cloud project
2. Access to your Supabase project dashboard
3. Your application's domain or localhost for testing

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Choose **Web application** as the application type

### 1.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Configure the consent screen with:
   - App name
   - User support email
   - Developer contact information
   - Privacy policy URL
   - Terms of service URL
3. Add your Supabase domain to **Authorized domains**: `<PROJECT_ID>.supabase.co`
4. Configure the following scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

### 1.3 Set Authorized URLs

In your OAuth Client ID configuration:

**Authorized JavaScript Origins:**
- `http://localhost:3000` (for local development)
- `https://yourdomain.com` (for production)
- `https://<PROJECT_ID>.supabase.co` (Supabase domain)

**Authorized Redirect URIs:**
- `https://<PROJECT_ID>.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` (for local development)

## Step 2: Configure Supabase

### 2.1 Add Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Configure**
4. Enable the Google provider
5. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 2.2 Configure URL Settings

1. Go to **Authentication** > **URL Configuration**
2. Set your **Site URL** to your application's URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add redirect URLs:
   - `http://localhost:3000/**` (for development)
   - `https://yourdomain.com/**` (for production)

## Step 3: Implementation

### 3.1 Basic Google Sign-In

```typescript
import { supabase } from '@/integrations/supabase/client';

const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Unexpected error during Google sign-in:', error);
    return { error: 'An unexpected error occurred' };
  }
};
```

### 3.2 Google One-Tap Integration

For enhanced UX, you can integrate Google One-Tap:

```typescript
const initializeGoogleOneTap = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleOneTap,
    });

    window.google.accounts.id.prompt();
  }
};

const handleGoogleOneTap = async (response: any) => {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });

    if (error) {
      console.error('Google One-Tap error:', error);
      return;
    }

    // Handle successful sign-in
    console.log('User signed in:', data.user);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};
```

## Step 4: Testing

### 4.1 Local Development

1. Ensure localhost URLs are configured in both Google Cloud Console and Supabase
2. Test the sign-in flow in your local environment
3. Verify that user data is properly stored in Supabase

### 4.2 Production

1. Update all URLs to use your production domain
2. Test in production environment
3. Monitor for any authentication errors

## Common Issues and Solutions

### Issue: "Invalid redirect URI"

**Solution:**
- Verify that all redirect URIs are properly configured in Google Cloud Console
- Ensure the redirect URI format matches exactly: `https://<PROJECT_ID>.supabase.co/auth/v1/callback`

### Issue: "Unauthorized domain"

**Solution:**
- Add your domain to the authorized domains in Google Cloud Console OAuth consent screen
- For Supabase, add `<PROJECT_ID>.supabase.co`

### Issue: "Access blocked"

**Solution:**
- Ensure your OAuth consent screen is properly configured
- Add required scopes: email, profile, openid
- Verify that your app is not in testing mode for production use

## Security Considerations

1. **Client Secret Protection**: Never expose your Google Client Secret in client-side code
2. **HTTPS Only**: Always use HTTPS in production
3. **Domain Validation**: Regularly audit authorized domains and redirect URIs
4. **Token Validation**: Supabase handles token validation, but ensure proper error handling
5. **Rate Limiting**: Implement rate limiting for authentication attempts

## Monitoring

Monitor authentication events in:
- Supabase Dashboard > Authentication > Users
- Google Cloud Console > APIs & Services > Credentials
- Your application's monitoring system

## Next Steps

After successful setup:
1. Test the complete authentication flow
2. Implement proper error handling
3. Add profile creation/update logic
4. Configure user permissions and roles
5. Set up monitoring and logging

For additional support, consult:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
