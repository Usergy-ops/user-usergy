
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { validateEmail, validatePassword, getPasswordStrength } from '@/utils/security';
import { GoogleAuth } from '../GoogleAuth';
import { EnhancedOTPVerification } from './EnhancedOTPVerification';
import { enhancedAuthService } from '@/services/enhancedAuthService';

interface EnhancedAuthFormWithOTPProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  onSuccess?: () => void;
}

export const EnhancedAuthFormWithOTP: React.FC<EnhancedAuthFormWithOTPProps> = ({
  mode,
  onToggleMode,
  onSuccess
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: '' });
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Real-time password strength checking
    if (field === 'password') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'signup') {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }
    
    // Confirm password validation (signup only)
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked && retryAfter > 0) {
      toast({
        title: "Account Temporarily Secured",
        description: `Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'signup') {
        const result = await enhancedAuthService.signUpWithOTP(formData.email, formData.password, 'client');
        
        if (result.error) {
          if (result.blocked) {
            setIsBlocked(true);
            setRetryAfter(result.retryAfter || 0);
            toast({
              title: "Account Temporarily Secured",
              description: result.error,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: result.error,
              variant: "destructive"
            });
          }
          return;
        }
        
        if (result.requiresOTP) {
          setShowOTPVerification(true);
          toast({
            title: "Check your email",
            description: result.emailSent 
              ? "We've sent you a verification code to complete your signup."
              : "Verification code generated. Please check if the email arrives shortly.",
            variant: result.emailSent ? "default" : "destructive"
          });
        }
        
      } else {
        const result = await enhancedAuthService.signIn(formData.email, formData.password);
        
        if (result.error) {
          if (result.blocked) {
            setIsBlocked(true);
            toast({
              title: "Too Many Attempts",
              description: result.error,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign In Failed",
              description: result.error,
              variant: "destructive"
            });
          }
          return;
        }
        
        if (result.success) {
          toast({
            title: "Welcome back!",
            description: "You've been signed in successfully.",
          });
          
          if (onSuccess) {
            onSuccess();
          }
        }
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    if (score <= 6) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleOTPSuccess = () => {
    toast({
      title: "Welcome to Usergy!",
      description: "Your account has been created and verified successfully."
    });
    setShowOTPVerification(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleOTPBack = () => {
    setShowOTPVerification(false);
  };

  if (showOTPVerification) {
    return (
      <EnhancedOTPVerification
        email={formData.email}
        password={formData.password}
        onBack={handleOTPBack}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-muted-foreground">
          {mode === 'signin' 
            ? 'Enter your credentials to access your account' 
            : 'Get started with secure email verification'
          }
        </p>
      </div>

      <GoogleAuth 
        mode={mode} 
        onSuccess={onSuccess}
        onError={(error) => {
          toast({
            title: "Google Authentication Failed",
            description: error,
            variant: "destructive"
          });
        }}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {isBlocked && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Account temporarily secured due to multiple failed attempts. Please wait before trying again.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              disabled={isSubmitting || isBlocked}
            />
            {formData.email && !errors.email && validateEmail(formData.email) && (
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>
          {errors.email && (
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password {mode === 'signup' && '(12+ characters)'}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'signup' ? "Create a strong password" : "Enter your password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
              disabled={isSubmitting || isBlocked}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password}
            </p>
          )}
          
          {/* Password Strength Indicator (signup only) */}
          {mode === 'signup' && formData.password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Password strength</span>
                <span className="text-xs text-muted-foreground">
                  {passwordStrength.score}/8
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                  style={{ width: `${(passwordStrength.score / 8) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {passwordStrength.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password Field (signup only) */}
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                disabled={isSubmitting || isBlocked}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || isBlocked}
          className="w-full bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </Button>
      </form>

      {/* Toggle Mode */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={onToggleMode}
            className="ml-1 text-primary hover:underline font-medium"
            disabled={isSubmitting || isBlocked}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          🔒 Your security is our priority. All data is encrypted and protected.
        </p>
      </div>
    </div>
  );
};
