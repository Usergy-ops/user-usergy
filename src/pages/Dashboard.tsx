import React from 'react';
import { useProfile } from '@/contexts/ProfileContext';

const Dashboard = () => {
  const { profileData } = useProfile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to your Explorer Dashboard, {profileData.full_name}!
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your profile is {profileData.completion_percentage}% complete. Ready to explore amazing projects!
          </p>
          
          <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 border border-border/50 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              🚀 Dashboard Coming Soon
            </h2>
            <p className="text-muted-foreground">
              Your complete Explorer dashboard with project matching, applications, and community features is being built. 
              Stay tuned for an amazing experience!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;