
/**
 * Centralized authentication redirection utility
 * Handles proper domain-based redirections for user.usergy.ai and client.usergy.ai
 */

export interface RedirectionConfig {
  accountType: 'user' | 'client' | null;
  isNewUser?: boolean;
  isGoogleAuth?: boolean;
  currentDomain?: string;
}

export const getRedirectionUrl = (config: RedirectionConfig): string => {
  const { accountType, isNewUser = false, isGoogleAuth = false, currentDomain } = config;
  
  // Determine current context
  const currentUrl = window.location.href;
  const currentHost = window.location.hostname;
  const isUserDomain = currentHost.includes('user.usergy.ai') || currentUrl.includes('user.usergy.ai');
  const isClientDomain = currentHost.includes('client.usergy.ai') || currentUrl.includes('client.usergy.ai');
  
  // Enhanced logging for debugging
  console.log('Redirection Config:', {
    accountType,
    isNewUser,
    isGoogleAuth,
    currentDomain,
    currentUrl,
    currentHost,
    isUserDomain,
    isClientDomain
  });
  
  // For user accounts
  if (accountType === 'user' || isUserDomain) {
    if (isNewUser || isGoogleAuth) {
      return 'https://user.usergy.ai/profile-completion';
    }
    return 'https://user.usergy.ai/dashboard';
  }
  
  // For client accounts
  if (accountType === 'client' || isClientDomain) {
    if (isNewUser || isGoogleAuth) {
      return 'https://client.usergy.ai/profile';
    }
    return 'https://client.usergy.ai/dashboard';
  }
  
  // Default fallback based on current domain
  if (isUserDomain) {
    return isNewUser ? 'https://user.usergy.ai/profile-completion' : 'https://user.usergy.ai/dashboard';
  }
  
  if (isClientDomain) {
    return isNewUser ? 'https://client.usergy.ai/profile' : 'https://client.usergy.ai/dashboard';
  }
  
  // Ultimate fallback
  return '/dashboard';
};

export const performRedirection = (config: RedirectionConfig): void => {
  const redirectUrl = getRedirectionUrl(config);
  
  console.log('Performing redirection:', {
    config,
    redirectUrl,
    currentLocation: window.location.href
  });
  
  // Use window.location.href for cross-domain redirects
  if (redirectUrl.startsWith('https://')) {
    window.location.href = redirectUrl;
  } else {
    // Use history API for same-domain redirects
    window.history.pushState({}, '', redirectUrl);
    window.location.reload();
  }
};

export const detectAccountTypeFromContext = (): 'user' | 'client' => {
  const currentUrl = window.location.href;
  const currentHost = window.location.hostname;
  const urlParams = new URLSearchParams(window.location.search);
  const referrerUrl = document.referrer || currentUrl;
  
  // Check URL parameters first (highest priority)
  if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
    return 'user';
  }
  
  // Check domain/host (second priority)
  if (currentHost.includes('user.usergy.ai') || referrerUrl.includes('user.usergy.ai')) {
    return 'user';
  }
  
  // Check URL paths (third priority)  
  if (currentUrl.includes('/user')) {
    return 'user';
  }
  
  // Default to client
  return 'client';
};

export const getGoogleOAuthRedirectUrl = (accountType?: 'user' | 'client'): string => {
  const detectedType = accountType || detectAccountTypeFromContext();
  
  return getRedirectionUrl({
    accountType: detectedType,
    isNewUser: true,
    isGoogleAuth: true
  });
};
