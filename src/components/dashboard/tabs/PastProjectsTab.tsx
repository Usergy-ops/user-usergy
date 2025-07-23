
import React from 'react';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

export const PastProjectsTab: React.FC = () => {
  // Mock data - would come from API
  const completedProjects: any[] = [];
  const loading = false;

  if (loading) {
    return <div>Loading past projects...</div>;
  }

  if (completedProjects.length === 0) {
    return <EmptyStateWithIllustration type="history" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Explorer Journey</h2>
          <p className="text-gray-600">A showcase of your contributions to innovation</p>
        </div>
      </div>
      
      {/* Past projects will be rendered here */}
    </div>
  );
};
