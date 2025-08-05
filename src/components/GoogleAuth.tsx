
import React from 'react';
import { OAuthButton } from '@/components/auth/OAuthButton';

interface GoogleAuthProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

/**
 * @deprecated Use OAuthButton from @/components/auth/OAuthButton instead
 * This component is maintained for backward compatibility
 */
export const GoogleAuth: React.FC<GoogleAuthProps> = (props) => {
  console.warn('GoogleAuth is deprecated. Use OAuthButton from @/components/auth/OAuthButton instead.');
  return <OAuthButton {...props} />;
};
