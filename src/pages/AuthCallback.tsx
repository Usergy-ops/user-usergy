import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OAuthAuthService } from '@/services/oauthAuthService';
import { OAuthProfileService } from '@/services/oauthProfileService';

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
        console.log('OAuth callback processing started with enhanced service');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (callbackState === 'processing') {
            setCallbackState('timeout');
            setErrorMessage('Authentication is taking longer than expected');
          }
        }, 30000);

        // Use the enhanced OAuth service to handle callback
        const result = await OAuthAuthService.handleOAuthCallback();

        if (result.error) {
          console.error('OAuth callback error:', result.error);
          setCallbackState('error');
          setErrorMessage(result.error);
          return;
        }

        if (result.success && result.user) {
          console.log('OAuth callback successful with enhanced service', { 
            user_id: result.user.id,
            email: result.user.email,
            needs_profile_completion: result.needsProfileCompletion
          });

          // Create or update OAuth profile if this is a new user
          if (result.isNewUser) {
            console.log('Creating OAuth profile for new user...');
            const profileResult = await OAuthProfileService.createOAuthProfile(result.user);
            
            if (!profileResult.success) {
              console.error('Failed to create OAuth profile:', profileResult.error);
              // Don't fail the entire flow, just log the error
            }
          }
          
          setCallbackState('success');
          
          toast({
            title: "Authentication Successful!",
            description: "You've been signed in successfully. Redirecting...",
          });

          // Redirect after a brief delay to show success
          setTimeout(() => {
            if (result.needsProfileCompletion) {
              navigate('/profile-completion');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
          
        } else if (!loading) {
          // No session and auth is not loading - this might be an error
          console.warn('No session found in enhanced OAuth callback');
          setCallbackState('error');
          setErrorMessage('No authentication session found. Please try signing in again.');
        }

      } catch (error) {
        console.error('Enhanced OAuth callback processing error:', error);
        setCallbackState('error');
        setErrorMessage('An unexpected error occurred during authentication');
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
