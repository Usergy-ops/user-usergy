
import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';

const Payments: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payments & Billing - Coming Soon!
          </h1>
          <p className="text-lg text-muted-foreground">
            This feature is currently under development.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
