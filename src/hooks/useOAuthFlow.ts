
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { OAuthAuthService } from '@/services/oauthAuthService';
import { OAuthProfileService } from '@/services/oauthProfileService';
import { trackUserAction } from '@/utils/monitoring';

interface UseOAuthFlowOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface OAuthFlowState {
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
}

export const useOAuthFlow = (options: UseOAuthFlowOptions = {}) => {
  const [state, setState] = useState<OAuthFlowState>({
    isProcessing: false,
    error: null,
    isComplete: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const processCallback = useCallback(async () => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('Processing OAuth callback with enhanced flow...');
      
      const result = await OAuthAuthService.handleOAuthCallback();

      if (result.error) {
        console.error('OAuth callback error:', result.error);
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: result.error || 'Authentication failed'
        }));
        
        if (options.onError) {
          options.onError(result.error || 'Authentication failed');
        }
        return;
      }

      if (result.success && result.user) {
        console.log('OAuth callback successful', { 
          user_id: result.user.id,
          email: result.user.email,
          needs_profile_completion: result.needsProfileCompletion
        });

        // Create OAuth profile for new users
        if (result.isNewUser) {
          console.log('Creating OAuth profile for new user...');
          const profileResult = await OAuthProfileService.createOAuthProfile(result.user);
          
          if (!profileResult.success) {
            console.error('Failed to create OAuth profile:', profileResult.error);
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          isComplete: true 
        }));
        
        toast({
          title: "Authentication Successful!",
          description: "You've been signed in successfully. Redirecting...",
        });

        // Handle redirection
        setTimeout(() => {
          if (result.needsProfileCompletion) {
            navigate('/profile-completion');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
        
        if (options.onSuccess) {
          options.onSuccess();
        }
      } else {
        console.warn('No session found in OAuth callback');
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: 'No authentication session found. Please try signing in again.'
        }));
      }

    } catch (error) {
      console.error('OAuth callback processing error:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: 'An unexpected error occurred during authentication'
      }));
      
      if (options.onError) {
        options.onError('An unexpected error occurred during authentication');
      }
    }
  }, [navigate, toast, options]);

  const retry = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    state,
    processCallback,
    retry
  };
};
