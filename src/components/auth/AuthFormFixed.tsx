
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleAuthFixed } from './GoogleAuthFixed';
import { OTPVerificationFixed } from './OTPVerificationFixed';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Info, Shield } from 'lucide-react';

interface AuthFormFixedProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export const AuthFormFixed: React.FC<AuthFormFixedProps> = ({ mode, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showOTP, setShowOTP] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>();
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  // Enhanced context detection for account type
  const detectAccountTypeContext = () => {
    const currentUrl = window.location.href;
    const currentHost = window.location.host;
    const referrerUrl = document.referrer || currentUrl;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Determine account type with enhanced detection logic
    let accountType = 'client'; // Default fallback
    let signupSource = 'fixed_auth_form';
    
    // Check URL parameters first (highest priority)
    if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
      accountType = 'user';
      signupSource = 'fixed_user_signup';
    } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
      accountType = 'client';
      signupSource = 'fixed_client_signup';
    }
    // Check domain/host (second priority)
    else if (currentHost.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'fixed_user_signup';
    } else if (currentHost.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'fixed_client_signup';
    }
    // Check URL paths (third priority)
    else if (currentUrl.includes('/user') || referrerUrl.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'fixed_user_signup';
    } else if (currentUrl.includes('/client') || referrerUrl.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'fixed_client_signup';
    }
    
    console.log('Fixed Auth Form - Context detection:', {
      currentUrl,
      currentHost,
      referrerUrl,
      urlParams: Object.fromEntries(urlParams),
      detectedAccountType: accountType,
      signupSource,
      mode
    });
    
    return { account_type: accountType, signup_source: signupSource };
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const evaluatePasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 12) {
      score += 1;
    } else {
      feedback.push('Use at least 12 characters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    return { score, feedback };
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'signup') {
      const strength = evaluatePasswordStrength(password);
      if (strength.score < 3) {
        newErrors.password = 'Password is too weak. ' + strength.feedback.join(', ');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        
        if (result.error) {
          setErrors({ general: result.error });
          toast({
            title: "Sign In Failed",
            description: result.error,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        }
      } else {
        // Get account type context for signup
        const context = detectAccountTypeContext();
        
        const result = await signUp(email, password, {
          signup_source: context.signup_source,
          account_type: context.account_type
        });
        
        if (result.error) {
          if (result.error.includes('already registered') || result.error.includes('already exists')) {
            setErrors({ general: 'This email is already registered. Please sign in instead.' });
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive"
            });
          } else {
            setErrors({ general: result.error });
            toast({
              title: "Sign Up Failed",
              description: result.error,
              variant: "destructive"
            });
          }
        } else {
          setShowOTP(true);
          setAttemptsLeft(result.attemptsLeft);
          toast({
            title: "Verification Required",
            description: "Please check your email and enter the verification code.",
          });
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        toast({
          title: "Reset Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset Link Sent",
          description: "Please check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    setShowOTP(false);
    toast({
      title: "Account Verified!",
      description: "Your account has been successfully verified.",
    });
  };

  if (showOTP) {
    return (
      <OTPVerificationFixed
        email={email}
        password={password}
        onBack={() => setShowOTP(false)}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  // Show account type detection info for debugging
  const context = detectAccountTypeContext();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </CardTitle>
        <p className="text-muted-foreground">
          {mode === 'signin' 
            ? 'Sign in to your account to continue' 
            : 'Join Usergy and start your journey'
          }
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Account Type Detection Info (for debugging) */}
        {mode === 'signup' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Account type detected: <strong>{context.account_type}</strong>
              {context.account_type === 'user' && ' (Usergy Team Member)'}
              {context.account_type === 'client' && ' (Client Account)'}
            </AlertDescription>
          </Alert>
        )}

        {/* Google Auth */}
        <GoogleAuthFixed 
          mode={mode}
          onSuccess={() => {
            toast({
              title: mode === 'signin' ? "Welcome back!" : "Account created!",
              description: mode === 'signin' ? "You have successfully signed in." : "Please complete your profile.",
            });
          }}
          onError={(error) => {
            toast({
              title: "Authentication Error",
              description: error,
              variant: "destructive"
            });
          }}
          disabled={isLoading}
        />
        
        <div className="relative">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-2 text-xs text-muted-foreground bg-background">
              Or continue with email
            </span>
          </div>
        </div>

        {/* General Error Alert */}
        {errors.general && (
          <Alert variant="destructive">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isLoading}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Create a strong password (12+ characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {mode === 'signup' && password && (
              <div className="space-y-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength.score 
                          ? passwordStrength.score < 3 
                            ? 'bg-red-500' 
                            : passwordStrength.score < 4 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength.feedback.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </div>
            )}
          </Button>
        </form>

        {/* Additional Actions */}
        {mode === 'signin' && (
          <div className="text-center">
            <Button
              variant="link"
              onClick={handlePasswordReset}
              disabled={isLoading}
              className="text-sm"
            >
              Forgot your password?
            </Button>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <Button
            variant="link"
            onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            disabled={isLoading}
            className="p-0 h-auto text-sm"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
