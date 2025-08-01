
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface OTPVerificationProps {
  email: string;
  password: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  password,
  onBack,
  onSuccess
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyOTP, resendOTP } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Handle resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && !isLoading && !isBlocked) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    
    try {
      const { error, isNewUser, accountType } = await verifyOTP(email, otpCode, password);
      
      if (error) {
        console.error('OTP verification failed:', error);
        
        // Update attempts left
        if (attemptsLeft !== null) {
          setAttemptsLeft(attemptsLeft - 1);
          if (attemptsLeft <= 1) {
            setIsBlocked(true);
          }
        }
        
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        console.log('OTP verification successful:', { isNewUser, accountType });
        onSuccess();
      }
    } catch (error) {
      console.error('Unexpected OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isBlocked) return;

    setIsLoading(true);
    
    try {
      const { error, attemptsLeft: newAttemptsLeft } = await resendOTP(email);
      
      if (error) {
        if (error.includes('Too many')) {
          setIsBlocked(true);
        }
      } else {
        setResendCooldown(60);
        setAttemptsLeft(newAttemptsLeft || null);
        setIsBlocked(false);
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Unexpected resend error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign up
        </button>
        
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Check your inbox
        </h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Security Notice */}
      {isBlocked && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Account temporarily secured due to multiple failed attempts. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* OTP Input */}
      <div className="flex justify-center space-x-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={cn(
              "w-12 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              digit ? "border-primary bg-primary/5" : "border-border",
              (isLoading || isBlocked) && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading || isBlocked}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying your code...</span>
        </div>
      )}

      {/* Attempts Counter */}
      {attemptsLeft !== null && attemptsLeft > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      {/* Resend Section */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        
        <button
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || isLoading || isBlocked}
          className={cn(
            "inline-flex items-center space-x-2 text-sm font-medium transition-colors duration-300",
            (resendCooldown > 0 || isLoading || isBlocked)
              ? "text-muted-foreground cursor-not-allowed" 
              : "text-primary hover:text-primary-end"
          )}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            isLoading && "animate-spin"
          )} />
          <span>
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : "Send new code"}
          </span>
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Enter the 6-digit code to verify your email and complete your account setup
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          🔒 Your security is our priority. Multiple failed attempts will temporarily secure your account.
        </p>
      </div>
    </div>
  );
};
