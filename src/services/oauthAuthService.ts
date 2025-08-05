
/**
 * OAuth-specific authentication service
 * Handles Google OAuth flows with enhanced error recovery
 */

import { supabase } from '@/integrations/supabase/client';
import { trackUserAction, monitoring } from '@/utils/monitoring';
import { handleCentralizedError, createAuthenticationError } from '@/utils/centralizedErrorHandling';

export interface OAuthResult {
  success?: boolean;
  error?: string;
  user?: any;
  session?: any;
  needsProfileCompletion?: boolean;
  isNewUser?: boolean;
}

export class OAuthAuthService {
  private static readonly OAUTH_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  static async initiateGoogleAuth(mode: 'signin' | 'signup'): Promise<OAuthResult> {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log('Initiating Google OAuth:', { mode, redirectTo });
      
      trackUserAction('google_oauth_initiated', { 
        mode, 
        redirect_to: redirectTo,
        timestamp: Date.now()
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: mode === 'signup' ? 'consent' : 'select_account'
          },
          skipBrowserRedirect: false,
          ...(mode === 'signup' && {
            data: {
              account_type: 'client',
              signup_source: 'google_oauth_signup',
              oauth_provider: 'google',
              signup_intent: true,
              oauth_signup: true
            }
          })
        }
      });

      if (error) {
        console.error('Google OAuth initiation error:', error);
        monitoring.logError(new Error(error.message), 'google_oauth_initiation', { mode });
        
        return {
          error: this.getOAuthErrorMessage(error.message),
          success: false
        };
      }

      return {
        success: true
      };
    } catch (error) {
      const authError = createAuthenticationError('Failed to initiate Google authentication');
      await handleCentralizedError(error as Error, 'google_oauth_init', undefined, { mode });
      return { error: authError.message };
    }
  }

  static async handleOAuthCallback(): Promise<OAuthResult> {
    try {
      console.log('Processing OAuth callback...');
      
      // Check for OAuth errors in URL
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error) {
        console.error('OAuth callback error:', { error, errorDescription });
        monitoring.logError(new Error(`OAuth error: ${error}`), 'oauth_callback_error', {
          error,
          error_description: errorDescription
        });
        
        return {
          error: this.getOAuthCallbackErrorMessage(error, errorDescription),
          success: false
        };
      }

      // Get session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session retrieval error:', sessionError);
        monitoring.logError(sessionError, 'oauth_session_retrieval');
        return {
          error: 'Failed to retrieve authentication session',
          success: false
        };
      }

      if (!session?.user) {
        console.warn('No session found in OAuth callback');
        return {
          error: 'No authentication session found',
          success: false
        };
      }

      const isOAuthUser = !!(
        session.user.app_metadata?.provider || 
        session.user.user_metadata?.provider
      );

      const isNewUser = this.isNewOAuthUser(session.user);
      const needsProfileCompletion = isOAuthUser && isNewUser;

      console.log('OAuth callback successful:', {
        user_id: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider,
        is_new_user: isNewUser,
        needs_profile_completion: needsProfileCompletion
      });

      trackUserAction('oauth_callback_success', {
        user_id: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider || 'google',
        is_new_user: isNewUser,
        oauth_user: isOAuthUser
      });

      return {
        success: true,
        user: session.user,
        session,
        isNewUser,
        needsProfileCompletion
      };
    } catch (error) {
      const authError = createAuthenticationError('OAuth callback processing failed');
      await handleCentralizedError(error as Error, 'oauth_callback_processing');
      return { error: authError.message };
    }
  }

  private static isNewOAuthUser(user: any): boolean {
    // Check if this is a new OAuth user based on metadata
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const isRecentlyCreated = timeDiff < 60000; // Within last minute

    const hasMinimalProfile = !user.user_metadata?.profile_completed;
    const isOAuthProvider = !!(user.app_metadata?.provider || user.user_metadata?.provider);

    return isOAuthProvider && isRecentlyCreated && hasMinimalProfile;
  }

  private static getOAuthErrorMessage(errorMsg: string): string {
    const baseMsg = errorMsg.toLowerCase();
    
    if (baseMsg.includes('popup')) {
      return 'Popup was blocked. Please allow popups and try again.';
    } else if (baseMsg.includes('network') || baseMsg.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    } else if (baseMsg.includes('cancelled') || baseMsg.includes('closed')) {
      return 'Authentication was cancelled. Please try again.';
    } else if (baseMsg.includes('invalid_request')) {
      return 'OAuth configuration issue. Please contact support.';
    } else if (baseMsg.includes('access_denied')) {
      return 'Google authorization was denied. Please allow access to continue.';
    }
    
    return 'Failed to authenticate with Google. Please try again.';
  }

  private static getOAuthCallbackErrorMessage(error: string, description?: string): string {
    if (error === 'access_denied') {
      return 'Authentication was cancelled or access was denied';
    } else if (description) {
      return description;
    }
    
    return 'Authentication failed. Please try again.';
  }
}
