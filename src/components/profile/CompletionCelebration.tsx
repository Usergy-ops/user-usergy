
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useProfile } from '@/contexts/ProfileContext';
import { CheckCircle, Sparkles, Users, Zap, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const CompletionCelebration: React.FC = () => {
  const { profileData } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  const {
    isChecking,
    missingFields,
    completionError,
    checkCompletion,
    isProfileComplete,
    requiredFieldsCount,
    completedFieldsCount,
    completionPercentage
  } = useProfileCompletion();

  // Poll for completion with timeout
  useEffect(() => {
    if (isProfileComplete) {
      console.log('Profile is complete, stopping polling');
      return;
    }

    if (hasTimedOut) {
      console.log('Polling timed out, not starting new polling');
      return;
    }

    const startPolling = async () => {
      console.log('Starting completion polling, attempt:', pollingAttempts + 1);
      
      const isComplete = await checkCompletion();
      
      if (isComplete) {
        console.log('Profile completion confirmed via polling');
        toast({
          title: "Profile Complete!",
          description: "Your Explorer profile is now complete. Welcome to the community!",
        });
        return;
      }

      setPollingAttempts(prev => prev + 1);
    };

    // Initial check
    startPolling();

    // Set up polling interval
    const pollInterval = setInterval(startPolling, 2000);

    // Timeout after 15 seconds
    const timeout = setTimeout(() => {
      console.log('Polling timeout reached after 15 seconds');
      setHasTimedOut(true);
      clearInterval(pollInterval);
      
      if (!isProfileComplete) {
        toast({
          title: "Profile Completion Timeout",
          description: "We're having trouble verifying your profile completion. Please check the missing fields below.",
          variant: "destructive"
        });
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isProfileComplete, hasTimedOut, pollingAttempts, checkCompletion, toast]);

  const handleContinue = () => {
    if (isProfileComplete) {
      console.log('Navigating to dashboard - profile is complete');
      navigate('/dashboard');
    } else {
      console.log('Cannot navigate - profile is not complete');
      toast({
        title: "Profile Incomplete",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = async () => {
    console.log('Manual retry requested');
    setHasTimedOut(false);
    setPollingAttempts(0);
    await checkCompletion();
  };

  const showError = hasTimedOut || (completionError && !isChecking);
  const showLoading = isChecking && !hasTimedOut;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        
        {/* Success Animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-start to-primary-end rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              {showError ? (
                <AlertCircle className="w-12 h-12 text-destructive" />
              ) : showLoading ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <CheckCircle className="w-12 h-12 text-success animate-scale-in" />
              )}
            </div>
          </div>
          
          {/* Floating particles - only show when complete */}
          {isProfileComplete && (
            <>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                <Sparkles className="w-6 h-6 text-primary-start animate-bounce" />
              </div>
              <div className="absolute top-8 right-1/4 transform translate-x-4">
                <Sparkles className="w-4 h-4 text-primary-end animate-bounce" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="absolute top-8 left-1/4 transform -translate-x-4">
                <Sparkles className="w-5 h-5 text-success animate-bounce" style={{ animationDelay: '1s' }} />
              </div>
            </>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {showError ? 'Profile Setup Issue' : showLoading ? 'Finalizing Your Profile...' : 'Welcome to the'}{' '}
            <span className="bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
              Explorer Community!
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {showError ? (
              '⚠️ We encountered an issue completing your profile. Please review the details below.'
            ) : showLoading ? (
              '⏳ Almost there! We\'re finishing up your profile setup...'
            ) : (
              '🎉 Congratulations! Your profile is now complete and ready for project matching.'
            )}
          </p>
        </div>

        {/* Error Details */}
        {showError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-destructive mb-4">Profile Completion Issues</h3>
            
            {completionError && (
              <p className="text-sm text-muted-foreground mb-4">{completionError}</p>
            )}
            
            {missingFields.length > 0 && (
              <div className="text-left">
                <p className="text-sm font-medium mb-2">Missing Required Fields:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {missingFields.map(field => (
                    <li key={field.field}>• {field.displayName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Achievement Stats */}
        <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 mb-8 border border-border/50">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Your Explorer Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-primary-start/10 to-primary-end/10 rounded-xl">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Explorer</div>
              <div className="text-sm text-muted-foreground">Status Achieved</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-success/10 to-success/20 rounded-xl">
              {showError ? (
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              ) : showLoading ? (
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
              ) : (
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              )}
              <div className="text-2xl font-bold text-foreground">
                {completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {completedFieldsCount}/{requiredFieldsCount} fields complete
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-primary-end/10 to-primary-start/10 rounded-xl">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {isProfileComplete ? 'Ready' : 'Preparing...'}
              </div>
              <div className="text-sm text-muted-foreground">For Matching</div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">What's Next?</h3>
          <div className="text-left space-y-3 text-muted-foreground">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Access your personalized Explorer dashboard</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Browse and apply to exclusive projects</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Get matched with projects that fit your expertise</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Connect with innovative companies and startups</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          {showError ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleRetry}
                size="lg"
                variant="outline"
                className="px-8 py-4"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/profile-completion')}
                size="lg"
                className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 px-8 py-4"
              >
                Complete Profile
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleContinue}
              disabled={!isProfileComplete}
              size="lg"
              className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Finalizing Profile...
                </>
              ) : (
                'Enter the Explorer Dashboard 🚀'
              )}
            </Button>
          )}
          
          <p className="text-sm text-muted-foreground">
            {showError ? (
              'Please complete all required fields to continue.'
            ) : showLoading ? (
              'Please wait while we complete your profile setup...'
            ) : (
              `Welcome to where innovation meets insight, ${profileData.full_name}!`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
