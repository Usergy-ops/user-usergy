
import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  error: string | null;
  attemptsLeft?: number;
}

export interface OTPResult {
  error: string | null;
  isNewUser?: boolean;
  accountType?: string;
}

export const authService = {
  async signUp(email: string, password: string, metadata?: { signup_source?: string; account_type?: string }): Promise<AuthResult> {
    try {
      const sourceDomain = window.location.origin;
      
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
          source_domain: sourceDomain,
          account_type: metadata?.account_type || 'client',
          signup_source: metadata?.signup_source || 'enhanced_auth_form'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }
      return { error: null, attemptsLeft: data.attemptsLeft };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  },

  async verifyOTP(email: string, otp: string, password: string): Promise<OTPResult> {
    try {
      const sourceDomain = window.location.origin;
      
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'verify',
          email,
          password,
          otp,
          source_domain: sourceDomain
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Verification failed' };
      }
      
      // Auto sign in after verification
      await supabase.auth.signInWithPassword({ email, password });
      return { 
        error: null, 
        isNewUser: data.isNewUser, 
        accountType: data.accountType 
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  },

  async resendOTP(email: string): Promise<AuthResult> {
    try {
      const response = await fetch(`https://lnsyrmpucmllakuuiixe.supabase.co/functions/v1/unified-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3lybXB1Y21sbGFrdXVpaXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTI5MjQsImV4cCI6MjA2ODkyODkyNH0.kgdtlLTMLEHMBidAAB7fqP9_RhPXsqwI2Tv-TmmyF3Y`
        },
        body: JSON.stringify({
          action: 'resend',
          email
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Resend failed' };
      }
      
      return { error: null, attemptsLeft: data.attemptsLeft };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }
};
