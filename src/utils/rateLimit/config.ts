
/**
 * Centralized rate limiting configurations
 */

import { RateLimitConfig } from './types';

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication related with progressive blocking
  signup: { 
    maxAttempts: 5, 
    windowMinutes: 60, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 10, blockDurationMinutes: 60 },
      { attempts: 15, blockDurationMinutes: 240 }
    ]
  },
  signin: { 
    maxAttempts: 10, 
    windowMinutes: 60, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 20, blockDurationMinutes: 60 },
      { attempts: 30, blockDurationMinutes: 180 }
    ]
  },
  otp_verify: { 
    maxAttempts: 5, 
    windowMinutes: 10, 
    blockDurationMinutes: 15,
    escalationRules: [
      { attempts: 10, blockDurationMinutes: 60 }
    ]
  },
  otp_resend: { 
    maxAttempts: 3, 
    windowMinutes: 10, 
    blockDurationMinutes: 15 
  },
  password_reset: { 
    maxAttempts: 3, 
    windowMinutes: 60, 
    blockDurationMinutes: 30 
  },

  // Profile related
  profile_update: { maxAttempts: 20, windowMinutes: 60, blockDurationMinutes: 5 },
  profile_load: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 1 },
  file_upload: { maxAttempts: 10, windowMinutes: 60, blockDurationMinutes: 10 },

  // API calls
  api_call: { maxAttempts: 100, windowMinutes: 60, blockDurationMinutes: 5 },
  database_query: { maxAttempts: 200, windowMinutes: 60, blockDurationMinutes: 2 },
  edge_function: { maxAttempts: 50, windowMinutes: 60, blockDurationMinutes: 5 },

  // Default fallback
  default: { maxAttempts: 30, windowMinutes: 60, blockDurationMinutes: 5 }
};

export const getConfig = (action: string): RateLimitConfig => {
  return RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default;
};
