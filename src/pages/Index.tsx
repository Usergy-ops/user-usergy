
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { Header } from '@/components/Header';
import { NetworkNodes } from '@/components/NetworkNodes';
import { EnhancedAuthForm } from '@/components/EnhancedAuthForm';
import { UsergyCTA } from '@/components/UsergyCTA';
import { handleAuthSuccessRedirect, debugRedirectContext } from '@/utils/redirectionUtils';
import { monitoring } from '@/utils/monitoring';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading: accountTypeLoading, isUser, isClient } = useAccountType();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  useEffect(() => {
    // Debug context on page load
    debugRedirectContext();
    
    // Handle authenticated user redirection
    if (!authLoading && !accountTypeLoading && user && accountType) {
      console.log('Index page - authenticated user detected:', {
        userId: user.id,
        email: user.email,
        accountType,
        isUser,
        isClient,
        currentUrl: window.location.href
      });

      // Enhanced redirection for authenticated users
      const handleRedirect = async () => {
        try {
          await handleAuthSuccessRedirect(user, accountType, false);
        } catch (error) {
          console.error('Index page redirection error:', error);
          monitoring.logError(error as Error, 'index_page_redirect_error', {
            userId: user.id,
            accountType,
            currentUrl: window.location.href
          });
          
          // Fallback redirection
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      };

      // Small delay to allow page to render before redirect
      setTimeout(handleRedirect, 1000);
    }
  }, [user, accountType, authLoading, accountTypeLoading, isUser, isClient]);

  // Show loading state while checking authentication
  if (authLoading || accountTypeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show auth form for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <NetworkNodes />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Join the Usergy
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-end bg-clip-text text-transparent">
                Community
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect with experts, work on exciting projects, and shape the future of technology together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <EnhancedAuthForm 
                mode={authMode} 
                onModeChange={setAuthMode} 
              />
            </div>
            
            <div className="order-1 lg:order-2">
              <UsergyCTA />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
