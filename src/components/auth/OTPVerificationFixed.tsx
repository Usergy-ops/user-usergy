
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface OTPVerificationFixedProps {
  email: string;
  password: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const OTPVerificationFixed: React.FC<OTPVerificationFixedProps> = ({
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
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyOTP, resendOTP } = useAuth();
  const { toast } = useToast();

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

  useEffect(() => {
    // Handle OTP expiration timer
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

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
    if (newOtp.every(digit => digit !== '') && !isLoading && !isBlocked && timeRemaining > 0) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Focus previous input on backspace
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (timeRemaining <= 0) {
      toast({
        title: "Code Expired",
        description: "Please request a new verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await verifyOTP(email, otpCode, password);
      
      if (error) {
        // Enhanced error handling
        if (error.includes('Too many') || error.includes('blocked')) {
          setIsBlocked(true);
          toast({
            title: "Security Notice",
            description: error,
            variant: "destructive"
          });
        } else if (error.includes('expired')) {
          setTimeRemaining(0);
          toast({
            title: "Code Expired",
            description: "Please request a new verification code.",
            variant: "destructive"
          });
        } else if (error.includes('invalid') || error.includes('Invalid')) {
          toast({
            title: "Invalid Code",
            description: "Please check your code and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Verification failed",
            description: error,
            variant: "destructive"
          });
        }
        
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsVerified(true);
        toast({
          title: "Welcome to Usergy!",
          description: "Your account has been created successfully."
        });
        
        // Delay success callback to show success state
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Unexpected verification error:', error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
          toast({
            title: "Security Notice",
            description: error,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Failed to resend code",
            description: error,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "New code sent!",
          description: "Check your inbox for the verification code."
        });
        setResendCooldown(60);
        setAttemptsLeft(newAttemptsLeft || null);
        setIsBlocked(false);
        setTimeRemaining(600); // Reset timer
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Unexpected resend error:', error);
      toast({
        title: "Resend Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canResend = resendCooldown === 0 && !isBlocked && !isLoading;
  const isExpired = timeRemaining <= 0;

  if (isVerified) {
    return (
      <div className="space-y-8 max-w-md mx-auto text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Account Verified!
        </h2>
        <p className="text-muted-foreground">
          Welcome to Usergy! Redirecting you to complete your profile...
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Setting up your account...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-md mx-auto">
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

      {/* Timer and Status */}
      <div className="space-y-4">
        {!isExpired && (
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Code expires in {formatTime(timeRemaining)}</span>
          </div>
        )}

        {/* Security Notice */}
        {(isBlocked || isExpired) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">
                {isBlocked 
                  ? "Account temporarily secured due to multiple failed attempts. Please try again later."
                  : "Verification code has expired. Please request a new one."
                }
              </p>
            </div>
          </div>
        )}
      </div>

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
              (isLoading || isBlocked || isExpired) && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading || isBlocked || isExpired}
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
        
        <Button
          variant="ghost"
          onClick={handleResendOTP}
          disabled={!canResend}
          className={cn(
            "inline-flex items-center space-x-2 text-sm font-medium",
            !canResend && "opacity-50 cursor-not-allowed"
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
        </Button>
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
