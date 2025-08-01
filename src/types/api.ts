
/**
 * Comprehensive API response types for all backend interactions
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Unified Auth Edge Function Types
export interface UnifiedAuthRequest {
  action: 'generate' | 'verify' | 'resend';
  email: string;
  password?: string;
  otp?: string;
  account_type?: string;
  signup_source?: string;
  source_url?: string;
  referrer_url?: string;
}

export interface UnifiedAuthResponse {
  success: boolean;
  error?: string;
  attemptsLeft?: number;
  user?: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
  accountType?: string;
  isNewUser?: boolean;
}

// OTP Verification Types
export interface OTPVerificationData {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  verified_at?: string;
  attempts: number;
  email_sent: boolean;
  email_error?: string;
  blocked_until?: string;
  account_type: string;
  source_url: string;
}

export interface OTPResendResponse {
  success: boolean;
  error?: string;
  attemptsLeft?: number;
  blockedUntil?: string;
}

// Account Type Management Types
export interface AccountTypeInfo {
  account_type: string;
  created_at: string;
  updated_at?: string;
}

export interface AccountTypeAssignmentRequest {
  user_id: string;
  account_type: 'user' | 'client';
}

export interface AccountTypeAssignmentResponse {
  success: boolean;
  account_type?: string;
  error?: string;
  message?: string;
}

// System Monitoring Types
export interface SystemHealthStats {
  total_users: number;
  users_with_account_types: number;
  users_without_account_types: number;
  coverage_percentage: number;
  is_healthy: boolean;
  timestamp: string;
}

export interface AccountTypeFixResult {
  success: boolean;
  users_analyzed: number;
  users_fixed: number;
  corrections?: Array<{
    user_id: string;
    email: string;
    old_account_type?: string;
    new_account_type: string;
    reason: string;
  }>;
  message?: string;
  error?: string;
}

export interface ClientWorkflowSyncResult {
  success: boolean;
  synced_records: number;
  message: string;
  error?: string;
}

// Rate Limiting Types
export interface RateLimitResponse {
  allowed: boolean;
  attemptsRemaining: number;
  resetTime: Date;
  blocked: boolean;
  blockedUntil?: Date;
  escalationLevel?: number;
}

export interface RateLimitViolation {
  identifier: string;
  action: string;
  attempts: number;
  blockedUntil?: Date;
  metadata?: Record<string, any>;
}

// Profile Management Types
export interface ProfileData {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  timezone?: string;
  completion_percentage: number;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  country?: string;
  city?: string;
  timezone?: string;
  gender?: string;
  age?: number;
  education_level?: string;
  technical_experience_level?: string;
  ai_familiarity_level?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  profile?: ProfileData;
  completion_percentage?: number;
  error?: string;
}

// Client Workflow Types
export interface ClientRecord {
  auth_user_id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_name: string;
  company_website?: string;
  industry?: string;
  company_size?: string;
  contact_role?: string;
  contact_phone?: string;
  company_country?: string;
  company_city?: string;
  company_timezone?: string;
  company_logo_url?: string;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ClientProfileSaveRequest {
  company_name: string;
  full_name: string;
  company_website?: string;
  industry?: string;
  company_size?: string;
  contact_role?: string;
  contact_phone?: string;
  company_country?: string;
  company_city?: string;
  company_timezone?: string;
  company_logo_url?: string;
}

export interface ClientProfileSaveResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Error Handling Types
export interface ErrorLogEntry {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  context?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

export interface ApiError {
  code?: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}

// Email System Types
export interface EmailSendRequest {
  to: string;
  subject: string;
  html: string;
  type: 'otp' | 'welcome' | 'reset_password' | 'notification';
  metadata?: Record<string, any>;
}

export interface EmailSendResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  resend_response?: any;
}

export interface EmailLogEntry {
  id: string;
  email: string;
  email_type: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  resend_response?: any;
  metadata?: Record<string, any>;
  created_at: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: Record<string, any>;
}

// Database Function Response Types
export interface DatabaseFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserDebugInfoResponse {
  user_id: string;
  auth_info: {
    email: string;
    email_confirmed_at?: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata?: Record<string, any>;
  };
  account_type_info?: {
    account_type: string;
    created_at: string;
  };
  otp_info?: {
    email: string;
    created_at: string;
    expires_at: string;
    verified_at?: string;
    attempts: number;
    email_sent: boolean;
    email_error?: string;
    blocked_until?: string;
  };
  profile_info?: {
    profile_completed: boolean;
    completion_percentage: number;
    created_at: string;
  };
}
