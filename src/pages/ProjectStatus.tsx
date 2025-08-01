
import React from 'react';
import { ProjectStatusDashboard } from '@/components/debugging/ProjectStatusDashboard';

const ProjectStatus: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Implementation Status</h1>
        <p className="text-muted-foreground">
          Complete overview of all implemented phases and components
        </p>
      </div>
      
      <ProjectStatusDashboard />
    </div>
  );
};

export default ProjectStatus;
