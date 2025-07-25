
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { useProfile } from '@/contexts/ProfileContext';

const Dashboard = () => {
  const { profileData, loading: profileLoading } = useProfile();

  if (profileLoading) {
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

  return (
    <ProtectedRoute requireCompleteProfile={true}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <DashboardHero userName={profileData?.full_name || 'Explorer'} />
          
          {/* Dashboard Tabs */}
          <DashboardTabs />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;
