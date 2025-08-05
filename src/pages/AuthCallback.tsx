import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackUserAction } from '@/utils/monitoring';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [callbackState, setCallbackState] = useState<'processing' | 'success' | 'error' | 'timeout'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleAuthCallback = async () => {
      try {
        console.log('OAuth callback processing started');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (callbackState === 'processing') {
            setCallbackState('timeout');
            setErrorMessage('Authentication is taking longer than expected');
          }
        }, 30000); // 30 second timeout

        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Check for OAuth errors in URL
        if (error) {
          console.error('OAuth callback error:', { error, errorDescription });
          setCallbackState('error');
          
          let userFriendlyError = 'Authentication failed';
          if (error === 'access_denied') {
            userFriendlyError = 'Authentication was cancelled or access was denied';
          } else if (errorDescription) {
            userFriendlyError = errorDescription;
          }
          
          setErrorMessage(userFriendlyError);
          
          trackUserAction('oauth_callback_error', {
            error,
            error_description: errorDescription,
            url: window.location.href
          });
          
          return;
        }

        // Get session from Supabase (this should now contain the OAuth session)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
          setCallbackState('error');
          setErrorMessage('Failed to retrieve authentication session');
          return;
        }

        if (session?.user) {
          console.log('OAuth callback successful', { 
            user_id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider 
          });
          
          setCallbackState('success');
          
          // Track successful OAuth completion
          trackUserAction('oauth_callback_success', {
            user_id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider || 'google',
            oauth_user: true
          });
          
          toast({
            title: "Authentication Successful!",
            description: "You've been signed in successfully. Redirecting...",
          });

          // Determine where to redirect based on account setup
          // Check if this is a client account that needs profile completion
          const isOAuthSignup = session.user.app_metadata?.provider && 
            !session.user.user_metadata?.profile_completed;

          // Redirect after a brief delay to show success
          setTimeout(() => {
            if (isOAuthSignup) {
              navigate('/profile-completion');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
          
        } else if (!loading) {
          // No session and auth is not loading - this might be an error
          console.warn('No session found in callback');
          setCallbackState('error');
          setErrorMessage('No authentication session found. Please try signing in again.');
        }
        // If loading is still true, keep waiting

      } catch (error) {
        console.error('OAuth callback processing error:', error);
        setCallbackState('error');
        setErrorMessage('An unexpected error occurred during authentication');
        
        trackUserAction('oauth_callback_error', {
          error: error instanceof Error ? error.message : 'unknown_error',
          url: window.location.href
        });
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    // Only process if we're not already in an error state and auth is not loading
    if (callbackState === 'processing') {
      handleAuthCallback();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate, toast, callbackState, loading, user]);

  const handleRetry = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (callbackState) {
      case 'processing':
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
            <p className="text-muted-foreground">Please wait while we sign you in...</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
            <p className="text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
          </div>
        );
        
      case 'timeout':
        return (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Taking Longer Than Expected</h2>
            <p className="text-muted-foreground mb-6">
              Authentication is taking longer than usual. You can wait a bit more or try again.
            </p>
            <Button onClick={handleRetry} className="w-full max-w-sm">
              Return to Sign In
            </Button>
          </div>
        );
        
      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button onClick={handleRetry} className="w-full max-w-sm">
              Try Again
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
