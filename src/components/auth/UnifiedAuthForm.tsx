import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { GoogleAuth } from '@/components/GoogleAuth';
import { UnifiedOTPVerification } from './UnifiedOTPVerification';
import { detectAccountTypeFromContext } from '@/utils/authRedirection';

interface UnifiedAuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({ mode, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showOTP, setShowOTP] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'signup' && password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        // Enhanced context detection for signup
        const accountType = detectAccountTypeFromContext();
        const sourceUrl = window.location.href;
        const referrerUrl = document.referrer || sourceUrl;
        
        const context = {
          account_type: accountType,
          signup_source: `unified_${accountType}_signup`,
          source_url: sourceUrl,
          referrer_url: referrerUrl
        };
        
        console.log('Signup Context:', context);
        
        const result = await signUp(email, password, context);
        
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
      <UnifiedOTPVerification
        email={email}
        password={password}
        onBack={() => setShowOTP(false)}
        onSuccess={() => setShowOTP(false)}
      />
    );
  }

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
        {/* Google Auth */}
        <GoogleAuth mode={mode} />
        
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
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
