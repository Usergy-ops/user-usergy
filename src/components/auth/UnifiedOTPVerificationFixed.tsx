
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedOTPVerificationProps {
  email: string;
  onVerificationSuccess: (accountType: 'user' | 'client') => void;
  onBackToEmail: () => void;
  isLoading?: boolean;
  error?: string;
}

export const UnifiedOTPVerificationFixed: React.FC<UnifiedOTPVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBackToEmail,
  isLoading: externalLoading = false,
  error: externalError = ''
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(externalError);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          setError('Invalid or expired verification code');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        // Default to 'user' account type for new accounts
        const accountType: 'user' | 'client' = 'user';
        
        toast({
          title: "Email verified successfully!",
          description: "Welcome to Usergy!",
        });
        
        onVerificationSuccess(accountType);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).substring(7) // Temporary password
      });

      if (error && !error.message.includes('already registered')) {
        setError('Failed to resend verification code');
        return;
      }

      toast({
        title: "Verification code resent",
        description: "Please check your email for the new code.",
      });
      
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const isLoading = externalLoading || isVerifying || isResending;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="w-5 h-5" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          We've sent a verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Label htmlFor="otp">6-Digit Verification Code</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                if (error) setError('');
              }}
              placeholder="000000"
              disabled={isLoading}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.length !== 6}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>
        </form>

        <div className="flex flex-col space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendCode}
            disabled={isLoading || resendCooldown > 0}
            className="w-full"
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : 'Resend verification code'
            }
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBackToEmail}
            disabled={isLoading}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to email
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Didn't receive the email? Check your spam folder or try resending the code.</p>
        </div>
      </CardContent>
    </Card>
  );
};
