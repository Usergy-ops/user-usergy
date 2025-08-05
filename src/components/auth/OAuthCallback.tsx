
import React, { useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';

export const OAuthCallback: React.FC = () => {
  const { state, processCallback, retry } = useOAuthFlow();

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  const renderContent = () => {
    if (state.isProcessing) {
      return (
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
          <p className="text-muted-foreground">Please wait while we sign you in...</p>
        </div>
      );
    }
    
    if (state.isComplete) {
      return (
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
          <p className="text-muted-foreground mb-4">Redirecting you to your dashboard...</p>
        </div>
      );
    }
    
    if (state.error) {
      return (
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-6">{state.error}</p>
          <Button onClick={retry} className="w-full max-w-sm">
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold mb-2">Processing...</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    );
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
};
