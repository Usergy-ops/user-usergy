import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    if (newOtp.every(digit => digit !== '') && !isLoading) {
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
    
    const { error } = await verifyOTP(email, otpCode, password);
    
    if (error) {
      toast({
        title: "Verification failed",
        description: error,
        variant: "destructive"
      });
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      toast({
        title: "Welcome to Usergy!",
        description: "Your account has been created successfully."
      });
      onSuccess();
    }
    
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    const { error } = await resendOTP(email);
    
    if (error) {
      toast({
        title: "Failed to resend code",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "New code sent!",
        description: "Check your inbox for the verification code."
      });
      setResendCooldown(60);
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    
    setIsLoading(false);
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
        
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Check your inbox
        </h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
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
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
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

      {/* Resend Section */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        
        <button
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || isLoading}
          className={cn(
            "inline-flex items-center space-x-2 text-sm font-medium transition-colors duration-300",
            resendCooldown > 0 || isLoading 
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
      </div>
    </div>
  );
};