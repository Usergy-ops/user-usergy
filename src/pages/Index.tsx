
import React, { useState, useEffect } from 'react';
import { AuthToggle } from '@/components/AuthToggle';
import { AuthForm } from '@/components/AuthForm';
import { GoogleAuthButton } from '@/components/UsergyCTA';
import { NetworkNodes } from '@/components/NetworkNodes';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import heroIllustration from '@/assets/usergy-hero-illustration.png';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/profile-completion');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  const handleAuthSubmit = async (email: string, password?: string) => {
    setIsLoading(true);
    
    try {
      let result;
      if (authMode === 'signup') {
        result = await signUp(email, password || '');
      } else {
        result = await signIn(email, password || '');
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else if (authMode === 'signup') {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <NetworkNodes />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero Content */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Logo */}
              <div className="mb-8">
                <div className="inline-flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="18" cy="18" r="3" />
                      <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                      <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                    Usergy
                  </span>
                </div>
              </div>

              {/* Hero Headlines */}
              <div className="mb-8 space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  Where Innovation
                  <span className="block bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                    Meets Insight
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Join a community of digital pioneers shaping tomorrow's products. 
                  Your expertise matters—help build the future, one product at a time.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="hidden lg:block">
                <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>2,500+ Active Explorers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-start rounded-full animate-pulse"></div>
                    <span>150+ Partner Companies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-end rounded-full animate-pulse"></div>
                    <span>Enterprise Grade Security</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="animate-slide-up">
              <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 lg:p-10 border border-border/50">
                
                {/* Form Header */}
                <div className="text-center mb-8">
                  <AuthToggle mode={authMode} onToggle={setAuthMode} />
                  
                  <div className="mt-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {authMode === 'signup' 
                        ? 'Welcome to where innovation finds its voice' 
                        : 'Welcome back to the community'
                      }
                    </h2>
                    <p className="text-muted-foreground">
                      {authMode === 'signup'
                        ? 'Join thousands of digital explorers already making an impact'
                        : "We're excited to see you again, explorer"
                      }
                    </p>
                  </div>
                </div>

                {/* Google Auth */}
                <div className="mb-6">
                  <GoogleAuthButton 
                    mode={authMode} 
                    onClick={handleGoogleAuth}
                    isLoading={isLoading}
                  />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">or continue with email</span>
                  </div>
                </div>

                {/* Email Form */}
                <AuthForm 
                  mode={authMode} 
                  onSubmit={handleAuthSubmit}
                  isLoading={isLoading}
                />

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {authMode === 'signup' ? (
                      <span>
                        Already part of our community?{' '}
                        <button 
                          onClick={() => setAuthMode('signin')}
                          className="text-primary hover:text-primary-end font-medium transition-colors duration-300"
                        >
                          Welcome back
                        </button>
                      </span>
                    ) : (
                      <span>
                        New here? We'd love to have you{' '}
                        <button 
                          onClick={() => setAuthMode('signup')}
                          className="text-primary hover:text-primary-end font-medium transition-colors duration-300"
                        >
                          join us
                        </button>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-6 text-xs text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors duration-300">Privacy Policy</a>
                    <a href="#" className="hover:text-foreground transition-colors duration-300">Terms of Service</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
