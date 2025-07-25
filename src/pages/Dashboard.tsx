import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

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
      <DashboardTabs />
    </DashboardLayout>
  );
};

export default Dashboard;