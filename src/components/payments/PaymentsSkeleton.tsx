import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';

export const PaymentsSkeleton: React.FC = () => (
  <DashboardLayout>
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header skeleton */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>
      
      {/* Balance card skeleton */}
      <div className="animate-pulse">
        <Skeleton className="h-48 bg-muted rounded-3xl mb-8" />
      </div>
      
      {/* Trust indicators skeleton */}
      <div className="flex items-center justify-center space-x-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
      
      {/* Payment history skeleton */}
      <div className="animate-pulse">
        <Skeleton className="h-96 bg-muted rounded-2xl" />
      </div>
    </div>
  </DashboardLayout>
);