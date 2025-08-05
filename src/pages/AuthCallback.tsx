
import React from 'react';
import { OAuthCallback } from '@/components/auth/OAuthCallback';

/**
 * OAuth Authentication Callback Page
 * Handles the redirect from OAuth providers (Google, etc.)
 */
export default function AuthCallback() {
  return <OAuthCallback />;
}
