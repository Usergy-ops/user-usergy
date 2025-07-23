
import React from 'react';
import { UserProfile } from '@/components/UserProfile';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-end/5 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Usergy
          </h1>
          <p className="text-muted-foreground text-lg">
            Hey {user?.email}! You're successfully authenticated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-start-2 lg:col-start-2">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
