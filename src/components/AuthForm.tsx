
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  mode: 'signup' | 'signin';
  onSubmit: (email: string, password?: string) => void;
  isLoading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { resetPassword } = useAuth();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = mode === 'signin' || validatePassword(password);
    
    if (isEmailValid && isPasswordValid) {
      onSubmit(email, mode === 'signin' ? password : password);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateEmail(email)) {
      await resetPassword(email);
      setShowForgotPassword(false);
    }
  };

  const isFormValid = emailValid && (mode === 'signin' ? password : password.length >= 8);

  if (showForgotPassword) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={!emailValid || isLoading}
            className={cn(
              "w-full usergy-btn-primary text-lg font-semibold py-4",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowForgotPassword(false)}
            className="w-full usergy-btn-secondary text-lg font-semibold py-4"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    );
  }

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

      {/* Password Field (for Sign In or Sign Up) */}
      {(mode === 'signin' || mode === 'signup') && (
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

      {/* Forgot Password Link (Sign In only) */}
      {mode === 'signin' && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:text-primary-end transition-colors duration-300"
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className={cn(
          "w-full usergy-btn-primary text-lg font-semibold py-4 mt-8",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>Getting things ready...</span>
          </div>
        ) : (
          mode === 'signup' ? 'Start Your Journey' : 'Welcome Back'
        )}
      </button>
    </form>
  );
};
