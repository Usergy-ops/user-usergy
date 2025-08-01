
export interface UserDebugInfo {
  auth_info?: {
    email: string;
    email_confirmed_at?: string;
    created_at: string;
    last_sign_in_at?: string;
  };
  account_type_info?: {
    account_type?: string;
    created_at?: string;
  };
  otp_info?: {
    email: string;
    created_at: string;
    expires_at: string;
    verified_at?: string;
    attempts: number;
    email_sent: boolean;
    email_error?: string;
  };
  profile_info?: {
    profile_completed: boolean;
    completion_percentage: number;
    created_at: string;
  };
}

export interface AccountTypeAssignmentResponse {
  success: boolean;
  error?: string;
}

export interface EmailConfigTestResponse {
  message: string;
}
