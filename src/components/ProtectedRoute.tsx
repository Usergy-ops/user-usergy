
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
    const profileCompleted = profileData?.profile_completed || false;
    const hasProfileData = profileData && Object.keys(profileData).length > 0;
    
    // If we're already on the celebration page, don't check completion
    const isOnCelebrationPage = location.pathname === '/profile-completion' && 
                                profileCompleted === true;
    
    // Only redirect if we have profile data and the profile is definitively incomplete
    if (hasProfileData && !isOnCelebrationPage) {
      const isComplete = profileCompleted === true || completionPercentage >= 100;
      
      console.log('ProtectedRoute profile check:', {
        completionPercentage,
        profileCompleted,
        isComplete,
        hasProfileData,
        isProfileComplete,
        pathname: location.pathname
      });
      
      if (!isComplete) {
        return <Navigate to="/profile-completion" replace />;
      }
    }
  }

  return <>{children}</>;
};
