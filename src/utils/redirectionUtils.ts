
import { monitoring, trackUserAction } from '@/utils/monitoring';

export interface RedirectOptions {
  accountType: string;
  isNewUser?: boolean;
  fallbackUrl?: string;
  delay?: number;
  retryAttempts?: number;
}

export const generateRedirectUrl = (
  accountType: string, 
  isNewUser: boolean = true,
  currentDomain?: string
): string => {
  console.log('Generating redirect URL:', {
    accountType,
    isNewUser,
    currentDomain: currentDomain || window.location.hostname
  });

  // For new users, always redirect to profile completion/setup
  if (isNewUser) {
    if (accountType === 'user') {
      return 'https://user.usergy.ai/profile-completion';
    } else if (accountType === 'client') {
      return 'https://client.usergy.ai/profile';
    }
  }

  // For existing users, redirect to dashboard on appropriate domain
  if (accountType === 'user') {
    return 'https://user.usergy.ai/dashboard';
  } else if (accountType === 'client') {
    return 'https://client.usergy.ai/dashboard';
  }

  // Fallback to current domain
  const currentHost = currentDomain || window.location.hostname;
  return `https://${currentHost}/dashboard`;
};

export const performCrossDomainRedirect = async (options: RedirectOptions): Promise<void> => {
  const { accountType, isNewUser = true, fallbackUrl, delay = 1500, retryAttempts = 3 } = options;
  
  try {
    const redirectUrl = generateRedirectUrl(accountType, isNewUser);
    
    console.log('Performing cross-domain redirect:', {
      accountType,
      isNewUser,
      redirectUrl,
      currentUrl: window.location.href
    });

    // Track the redirect attempt
    trackUserAction('cross_domain_redirect_attempt', {
      from_domain: window.location.hostname,
      to_url: redirectUrl,
      account_type: accountType,
      is_new_user: isNewUser
    });

    // If redirecting to the same domain, use navigate instead
    const currentHost = window.location.hostname;
    const targetUrl = new URL(redirectUrl);
    const targetHost = targetUrl.hostname;

    if (currentHost === targetHost) {
      console.log('Same domain redirect, using history navigation');
      window.history.pushState(null, '', targetUrl.pathname + targetUrl.search);
      window.location.reload();
      return;
    }

    // For cross-domain redirects, use window.location.href with retry logic
    let attempts = 0;
    const attemptRedirect = () => {
      attempts++;
      console.log(`Redirect attempt ${attempts}/${retryAttempts} to: ${redirectUrl}`);
      
      try {
        // Add a small delay for better UX
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, delay);
      } catch (error) {
        console.error(`Redirect attempt ${attempts} failed:`, error);
        
        if (attempts < retryAttempts) {
          console.log(`Retrying redirect in ${delay * attempts}ms...`);
          setTimeout(attemptRedirect, delay * attempts);
        } else {
          console.error('All redirect attempts failed, using fallback');
          handleRedirectFailure(fallbackUrl || '/dashboard');
        }
      }
    };

    attemptRedirect();
    
  } catch (error) {
    console.error('Cross-domain redirect error:', error);
    monitoring.logError(error as Error, 'cross_domain_redirect_error', {
      accountType,
      isNewUser,
      currentUrl: window.location.href
    });
    
    handleRedirectFailure(fallbackUrl || '/dashboard');
  }
};

const handleRedirectFailure = (fallbackUrl: string) => {
  console.log('Using fallback redirect:', fallbackUrl);
  
  trackUserAction('redirect_fallback_used', {
    fallback_url: fallbackUrl,
    original_domain: window.location.hostname
  });
  
  // Use window.location for fallback as well
  setTimeout(() => {
    window.location.href = fallbackUrl;
  }, 1000);
};

export const handleAuthSuccessRedirect = async (
  user: any,
  accountType: string,
  isNewUser: boolean = true
): Promise<void> => {
  console.log('Handling auth success redirect:', {
    userId: user?.id,
    email: user?.email,
    accountType,
    isNewUser,
    currentDomain: window.location.hostname
  });

  try {
    // Enhanced account type detection from user metadata if not provided
    const finalAccountType = accountType || 
      user?.user_metadata?.account_type || 
      (user?.email?.includes('user.usergy.ai') ? 'user' : 'client');

    await performCrossDomainRedirect({
      accountType: finalAccountType,
      isNewUser,
      fallbackUrl: '/dashboard'
    });
    
  } catch (error) {
    console.error('Auth success redirect error:', error);
    monitoring.logError(error as Error, 'auth_success_redirect_error', {
      userId: user?.id,
      accountType,
      isNewUser
    });
  }
};

export const debugRedirectContext = () => {
  const context = {
    current_url: window.location.href,
    current_domain: window.location.hostname,
    current_path: window.location.pathname,
    url_params: Object.fromEntries(new URLSearchParams(window.location.search)),
    referrer: document.referrer,
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  console.log('Redirect context debug:', context);
  return context;
};
