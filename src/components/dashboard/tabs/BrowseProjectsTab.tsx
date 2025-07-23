
import React from 'react';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

export const BrowseProjectsTab: React.FC = () => {
  // Mock data - would come from API
  const publicProjects: any[] = [];
  const loading = false;

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Projects</h2>
          <p className="text-gray-600">Find exciting projects that match your expertise</p>
        </div>
      </div>
      
      {/* Search and filters will be added here */}
      <div className="text-center py-8 text-gray-500">
        Browse projects functionality coming soon...
      </div>
    </div>
  );
};
