
/**
 * Enhanced security utilities with database-level validation
 */

import { supabase } from '@/integrations/supabase/client';
import { logError } from './errorHandling';
import { monitoring } from './monitoring';

// Enhanced email validation with security checks
export const validateEmail = (email: string): boolean => {
  try {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional security checks
    const suspiciousPatterns = [
      /[<>'"]/,  // Script injection characters
      /javascript:/i,  // JavaScript protocol
      /data:/i,  // Data URLs
      /vbscript:/i  // VBScript
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(email));
  } catch (error) {
    logError(error as Error, 'email_validation');
    return false;
  }
};

// Enhanced password validation using database function
export const validatePassword = async (password: string): Promise<{
  isValid: boolean;
  score: number;
  maxScore: number;
  issues: string[];
  strength: 'weak' | 'medium' | 'strong';
}> => {
  try {
    const { data, error } = await supabase.rpc('validate_password_security', {
      password_text: password
    });

    if (error) {
      throw new Error(`Password validation failed: ${error.message}`);
    }

    return {
      isValid: data.is_valid,
      score: data.score,
      maxScore: data.max_score,
      issues: data.issues || [],
      strength: data.strength || 'weak'
    };
  } catch (error) {
    logError(error as Error, 'password_validation');
    return {
      isValid: false,
      score: 0,
      maxScore: 6,
      issues: ['Password validation failed'],
      strength: 'weak'
    };
  }
};

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/&lt;script/gi, '') // Remove encoded script tags
    .slice(0, 1000); // Limit length
};

// URL validation with security checks
export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Allow only safe protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Block potentially dangerous URLs
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
};

// URL normalization with security
export const normalizeURL = (url: string): string => {
  try {
    if (!url || !validateURL(url)) return '';
    
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'ref', 'source'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    logError(error as Error, 'url_normalization');
    return '';
  }
};

// Security event logging
export const logSecurityEvent = async (
  eventType: string,
  eventData: Record<string, any> = {},
  userId?: string
): Promise<void> => {
  try {
    // Get client info
    const userAgent = navigator.userAgent;
    const timestamp = new Date().toISOString();

    // Log to database via RPC function
    const { error } = await supabase.rpc('log_security_event', {
      p_user_id: userId || null,
      p_event_type: eventType,
      p_event_data: {
        ...eventData,
        timestamp,
        user_agent: userAgent
      },
      p_ip_address: null, // IP will be detected server-side if needed
      p_user_agent: userAgent
    });

    if (error) {
      throw new Error(`Failed to log security event: ${error.message}`);
    }

    // Also log to monitoring system
    monitoring.recordMetric('security_event', 1, {
      event_type: eventType,
      user_id: userId || 'anonymous'
    });

  } catch (error) {
    logError(error as Error, 'security_event_logging', {
      event_type: eventType,
      user_id: userId
    });
  }
};

// Rate limiting security check
export const checkSecurityLevel = (attempts: number, timeWindow: number): 'normal' | 'elevated' | 'high' => {
  if (attempts > 20 && timeWindow < 60000) { // 20 attempts in 1 minute
    return 'high';
  } else if (attempts > 10 && timeWindow < 300000) { // 10 attempts in 5 minutes
    return 'elevated';
  }
  return 'normal';
};

// Content Security Policy helpers
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// XSS protection
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// SQL injection protection for user inputs
export const validateSQLInput = (input: string): boolean => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'UNION', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT'
  ];
  
  const upperInput = input.toUpperCase();
  return !sqlKeywords.some(keyword => upperInput.includes(keyword));
};

// File upload security
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check for suspicious file names
  if (/\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|zip)$/i.test(file.name)) {
    errors.push('Suspicious file type detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Session security
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;
    
    // Check if token is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    
    if (expiresAt < fiveMinutesFromNow) {
      // Try to refresh the session
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        await logSecurityEvent('session_refresh_failed', { error: error.message });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logError(error as Error, 'session_validation');
    return false;
  }
};

// Browser security checks
export const performBrowserSecurityChecks = (): {
  isSecure: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];
  
  // Check if running over HTTPS (except localhost)
  if (location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
    warnings.push('Connection is not secure (not HTTPS)');
  }
  
  // Check if running in a secure context
  if (!window.isSecureContext) {
    warnings.push('Browser context is not secure');
  }
  
  // Check for mixed content
  if (location.protocol === 'https:' && document.querySelectorAll('script[src^="http:"], img[src^="http:"]').length > 0) {
    warnings.push('Mixed content detected (HTTP resources on HTTPS page)');
  }
  
  return {
    isSecure: warnings.length === 0,
    warnings
  };
};

