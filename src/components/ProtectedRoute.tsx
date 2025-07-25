
import React from 'react';
import { Navigate } from 'react-router-dom';
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
    // Only redirect if we're certain the profile is incomplete
    // This prevents race conditions where completion_percentage hasn't been calculated yet
    const completionPercentage = profileData?.completion_percentage || 0;
    const hasCompletionData = typeof profileData?.completion_percentage === 'number';
    
    if (hasCompletionData && completionPercentage < 100) {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  return <>{children}</>;
};
