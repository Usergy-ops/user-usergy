
import React, { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Header } from '@/components/Header';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

const UserDashboard = () => {
  const { profileData, loading } = useProfile();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <DashboardHero user={profileData} />
          <DashboardTabs />
        </div>
      </div>
      
      <FloatingActionButton />
    </div>
  );
};

export default UserDashboard;
