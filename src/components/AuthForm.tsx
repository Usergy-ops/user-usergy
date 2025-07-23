
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  mode: 'signup' | 'signin';
  onSubmit: (email: string, password?: string) => void;
  isLoading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const { sendOTP, verifyOTP } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!email) {
      setEmailError('');
      setEmailValid(false);
    } else if (!isValid) {
      setEmailError('This email looks incomplete');
      setEmailValid(false);
    } else {
      setEmailError('');
      setEmailValid(true);
    }
    
    return isValid;
  };

  const validatePassword = (password: string) => {
    if (mode === 'signup' && password && password.length < 8) {
      setPasswordError('Password should be at least 8 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) return;
    
    setOtpLoading(true);
    try {
      const { error } = await sendOTP(email);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive"
        });
      } else {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await verifyOTP(email, otp);
      if (error) {
        toast({
          title: "Error",
          description: "Invalid OTP. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "OTP verified successfully!",
        });
        // Auth context will handle the redirect
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showOtpLogin) {
      if (otpSent) {
        handleVerifyOTP();
      } else {
        handleSendOTP();
      }
      return;
    }
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = mode === 'signin' || validatePassword(password);
    
    if (isEmailValid && isPasswordValid) {
      onSubmit(email, mode === 'signin' ? password : password);
    }
  };

  const isFormValid = showOtpLogin 
    ? emailValid && (!otpSent || otp.length === 6)
    : emailValid && (mode === 'signin' ? password : password.length >= 8);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className={cn(
              "h-5 w-5 transition-colors duration-300",
              emailValid ? "text-success" : emailError ? "text-destructive" : "text-muted-foreground"
            )} />
          </div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="explorer@company.com"
            className={cn(
              "usergy-input pl-12 pr-12 w-full",
              emailError && "usergy-input-error",
              emailValid && "usergy-input-success"
            )}
            required
            disabled={showOtpLogin && otpSent}
          />
          {emailValid && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Check className="h-5 w-5 text-success animate-scale-in" />
            </div>
          )}
          {emailError && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          )}
        </div>
        <label className="block text-sm font-medium text-muted-foreground ml-1">
          Your email address
        </label>
        {emailError && (
          <p className="text-sm text-destructive ml-1 animate-slide-up">{emailError}</p>
        )}
      </div>

      {/* OTP Field (when OTP login is selected and OTP is sent) */}
      {showOtpLogin && otpSent && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="usergy-input w-full text-center text-2xl font-bold tracking-widest"
              maxLength={6}
              required
            />
          </div>
          <label className="block text-sm font-medium text-muted-foreground ml-1">
            Enter the verification code sent to your email
          </label>
        </div>
      )}

      {/* Password Field (for traditional login/signup) */}
      {!showOtpLogin && (mode === 'signin' || mode === 'signup') && (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className={cn(
                "h-5 w-5 transition-colors duration-300",
                passwordError ? "text-destructive" : "text-muted-foreground"
              )} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder={mode === 'signup' ? "Create a secure password" : "Enter your password"}
              className={cn(
                "usergy-input pl-12 pr-12 w-full",
                passwordError && "usergy-input-error"
              )}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <label className="block text-sm font-medium text-muted-foreground ml-1">
            {mode === 'signup' ? 'Create your secure password' : 'Your password'}
          </label>
          {passwordError && (
            <p className="text-sm text-destructive ml-1 animate-slide-up">{passwordError}</p>
          )}
        </div>
      )}

      {/* Toggle between password and OTP login */}
      {mode === 'signin' && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowOtpLogin(!showOtpLogin);
              setOtpSent(false);
              setOtp('');
            }}
            className="text-sm text-primary hover:text-primary-end transition-colors duration-300"
          >
            {showOtpLogin ? 'Use password instead' : 'Sign in with OTP'}
          </button>
        </div>
      )}

      {/* Forgot Password Link (Sign In with password only) */}
      {mode === 'signin' && !showOtpLogin && (
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-primary hover:text-primary-end transition-colors duration-300"
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading || otpLoading}
        className={cn(
          "w-full usergy-btn-primary text-lg font-semibold py-4 mt-8",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
      >
        {(isLoading || otpLoading) ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>
              {otpLoading ? 'Processing...' : 'Getting things ready...'}
            </span>
          </div>
        ) : (
          showOtpLogin ? (
            otpSent ? 'Verify Code' : 'Send Verification Code'
          ) : (
            mode === 'signup' ? 'Start Your Journey' : 'Welcome Back'
          )
        )}
      </button>
    </form>
  );
};
