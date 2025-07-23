
export class ProfileError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ProfileError';
  }
}

export const handleProfileError = (error: any): ProfileError => {
  console.error('Profile error:', error);
  
  if (error.code === 'PGRST116') {
    return new ProfileError('Profile not found', 'PROFILE_NOT_FOUND', error);
  }
  
  if (error.code === '23505') {
    return new ProfileError('Data already exists', 'DUPLICATE_DATA', error);
  }
  
  if (error.message?.includes('violates row-level security')) {
    return new ProfileError('Authentication required', 'AUTH_REQUIRED', error);
  }
  
  if (error.message?.includes('violates not-null constraint')) {
    return new ProfileError('Required field missing', 'REQUIRED_FIELD', error);
  }
  
  return new ProfileError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error
  );
};
