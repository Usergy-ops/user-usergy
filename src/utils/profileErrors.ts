
export class ProfileError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ProfileError';
  }
}

export const handleProfileError = (error: any): ProfileError => {
  console.error('[ProfileError] Original error:', error);
  
  // Handle Supabase specific errors
  if (error.code === 'PGRST116') {
    return new ProfileError('Profile not found', 'PROFILE_NOT_FOUND', error);
  }
  
  if (error.code === '23505') {
    return new ProfileError('Data already exists', 'DUPLICATE_DATA', error);
  }
  
  if (error.message?.includes('violates row-level security')) {
    return new ProfileError('You do not have permission to perform this action', 'AUTH_REQUIRED', error);
  }
  
  if (error.message?.includes('violates not-null constraint')) {
    return new ProfileError('Required field is missing', 'REQUIRED_FIELD', error);
  }
  
  if (error.message?.includes('violates foreign key constraint')) {
    return new ProfileError('Invalid data reference', 'INVALID_REFERENCE', error);
  }
  
  if (error.message?.includes('connection')) {
    return new ProfileError('Connection error. Please check your internet connection and try again.', 'CONNECTION_ERROR', error);
  }
  
  // Handle network errors
  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return new ProfileError('Network error. Please try again.', 'NETWORK_ERROR', error);
  }
  
  // Handle timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return new ProfileError('Request timed out. Please try again.', 'TIMEOUT_ERROR', error);
  }
  
  // Default error
  return new ProfileError(
    error.message || 'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR',
    error
  );
};
