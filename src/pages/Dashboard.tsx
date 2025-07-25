import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profileData, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-80 mx-auto" />
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-foreground mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          Welcome to your Explorer Dashboard, {profileData.full_name}!
        </h1>
        <p className="text-xl text-muted-foreground mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
          Your profile is {profileData.completion_percentage}% complete. Ready to explore amazing projects!
        </p>
        
        <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 border border-border/50 max-w-2xl mx-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            🚀 Dashboard Coming Soon
          </h2>
          <p className="text-muted-foreground">
            Your complete Explorer dashboard with project matching, applications, and community features is being built. 
            Stay tuned for an amazing experience!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;