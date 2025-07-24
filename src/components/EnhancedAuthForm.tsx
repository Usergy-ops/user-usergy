
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateEmail, validatePassword } from '@/utils/security';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface AuthFormProps {
  mode: 'signup' | 'signin';
  onSubmit: (email: string, password?: string) => void;
  isLoading?: boolean;
}

export const EnhancedAuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // Track form interactions
  useEffect(() => {
    trackUserAction('auth_form_viewed', { mode });
  }, [mode]);

  const handleEmailValidation = (email: string) => {
    const isValid = validateEmail(email);
    
    if (!email && formTouched) {
      setEmailError('Email is required');
      setEmailValid(false);
    } else if (email && !isValid) {
      setEmailError('Please enter a valid email address');
      setEmailValid(false);
    } else {
      setEmailError('');
      setEmailValid(isValid);
    }
    
    return isValid;
  };

  const handlePasswordValidation = (password: string) => {
    if (mode === 'signup') {
      const validation = validatePassword(password);
      
      if (!password && formTouched) {
        setPasswordError('Password is required');
        setPasswordValid(false);
      } else if (password && !validation.isValid) {
        setPasswordError(validation.errors[0]);
        setPasswordValid(false);
      } else {
        setPasswordError('');
        setPasswordValid(validation.isValid);
      }
      
      return validation.isValid;
    } else {
      const isValid = password.length > 0;
      if (!password && formTouched) {
        setPasswordError('Password is required');
      } else {
        setPasswordError('');
      }
      setPasswordValid(isValid);
      return isValid;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setFormTouched(true);
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      handleEmailValidation(value);
      
      trackUserAction('email_input_changed', {
        mode,
        is_valid: validateEmail(value),
        email_length: value.length
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setFormTouched(true);
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      handlePasswordValidation(value);
      
      trackUserAction('password_input_changed', {
        mode,
        password_length: value.length,
        has_uppercase: /[A-Z]/.test(value),
        has_lowercase: /[a-z]/.test(value),
        has_number: /\d/.test(value),
        has_special: /[@$!%*?&]/.test(value)
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);
    
    monitoring.startTiming(`auth_${mode}_submit`);
    
    const isEmailValid = handleEmailValidation(email);
    const isPasswordValid = handlePasswordValidation(password);
    
    if (isEmailValid && isPasswordValid) {
      trackUserAction('auth_form_submitted', {
        mode,
        email_valid: isEmailValid,
        password_valid: isPasswordValid
      });
      
      onSubmit(email, password);
    } else {
      trackUserAction('auth_form_validation_failed', {
        mode,
        email_valid: isEmailValid,
        password_valid: isPasswordValid,
        email_error: emailError,
        password_error: passwordError
      });
    }
    
    monitoring.endTiming(`auth_${mode}_submit`);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    trackUserAction('password_visibility_toggled', {
      mode,
      now_visible: !showPassword
    });
  };

  const isFormValid = emailValid && passwordValid;

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
              "usergy-input pl-12 pr-12 w-full transition-all duration-300",
              emailError && "usergy-input-error border-destructive",
              emailValid && "usergy-input-success border-success"
            )}
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
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
          <p id="email-error" className="text-sm text-destructive ml-1 animate-slide-up">
            {emailError}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className={cn(
              "h-5 w-5 transition-colors duration-300",
              passwordValid ? "text-success" : passwordError ? "text-destructive" : "text-muted-foreground"
            )} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            placeholder={mode === 'signup' ? "Create a secure password" : "Enter your password"}
            className={cn(
              "usergy-input pl-12 pr-12 w-full transition-all duration-300",
              passwordError && "usergy-input-error border-destructive",
              passwordValid && "usergy-input-success border-success"
            )}
            required
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <label className="block text-sm font-medium text-muted-foreground ml-1">
          {mode === 'signup' ? 'Create your secure password' : 'Your password'}
        </label>
        {passwordError && (
          <p id="password-error" className="text-sm text-destructive ml-1 animate-slide-up">
            {passwordError}
          </p>
        )}
        {mode === 'signup' && password && !passwordError && (
          <div className="ml-1 space-y-1">
            <div className="flex items-center text-xs space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                password.length >= 8 ? "bg-success" : "bg-muted"
              )} />
              <span className={cn(
                "text-xs",
                password.length >= 8 ? "text-success" : "text-muted-foreground"
              )}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center text-xs space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                /[A-Z]/.test(password) ? "bg-success" : "bg-muted"
              )} />
              <span className={cn(
                "text-xs",
                /[A-Z]/.test(password) ? "text-success" : "text-muted-foreground"
              )}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center text-xs space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                /[@$!%*?&]/.test(password) ? "bg-success" : "bg-muted"
              )} />
              <span className={cn(
                "text-xs",
                /[@$!%*?&]/.test(password) ? "text-success" : "text-muted-foreground"
              )}>
                One special character
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Link (Sign In only) */}
      {mode === 'signin' && (
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-primary hover:text-primary-end transition-colors duration-300"
            onClick={() => trackUserAction('forgot_password_clicked', { mode })}
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
          "w-full usergy-btn-primary text-lg font-semibold py-4 mt-8 transition-all duration-300",
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
