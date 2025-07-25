
import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectWorkspace as ProjectWorkspaceComponent } from '@/components/project-workspace/ProjectWorkspace';
import DashboardLayout from '@/layouts/DashboardLayout';

const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  console.log('ProjectWorkspace route accessed with ID:', id);
  
  if (!id) {
    console.error('No project ID provided in route');
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
            <p className="text-muted-foreground">The requested project could not be found.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ProjectWorkspaceComponent projectId={id} />
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
