
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireCompleteProfile = false 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { isProfileComplete, loading: profileLoading, profileData } = useProfile();
  const location = useLocation();

  // Show loading while authentication or profile data is being loaded
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // For routes that require complete profile, check completion status
  if (requireCompleteProfile) {
    const completionPercentage = profileData?.completion_percentage || 0;
    const profileCompleted = profileData?.profile_completed === true;
    
    // Enhanced completion check - profile is complete if ANY of these are true:
    // 1. isProfileComplete from context (uses standardized calculation)
    // 2. completion_percentage >= 100
    // 3. profile_completed flag is true
    const profileIsComplete = isProfileComplete || 
                             completionPercentage >= 100 || 
                             profileCompleted;
    
    console.log('ProtectedRoute profile check:', {
      completionPercentage,
      profileCompleted,
      isProfileComplete,
      profileIsComplete,
      pathname: location.pathname
    });
    
    if (!profileIsComplete) {
      console.log('Profile incomplete, redirecting to profile completion');
      return <Navigate to="/profile-completion" replace />;
    }
  }

  return <>{children}</>;
};
