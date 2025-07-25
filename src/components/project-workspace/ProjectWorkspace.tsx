
import React, { useState } from 'react';
import { NetworkNodes } from '@/components/NetworkNodes';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceContent } from './WorkspaceContent';
import { ErrorBoundary } from './shared/ErrorHandling';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectWorkspaceProps {
  projectId: string;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId }) => {
  const [activeSection, setActiveSection] = useState('instructions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { project, loading, error } = useProject(projectId);
  
  console.log('ProjectWorkspace component rendered with projectId:', projectId);
  
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <NetworkNodes />
          <div className="relative z-10 flex">
            <div className="hidden md:block w-[280px] h-[calc(100vh-4rem)] fixed left-0 top-16 bg-card/80 backdrop-blur-md border-r border-border/50">
              <div className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full mb-8" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>
            <main className="flex-1 md:ml-[280px] pt-16 pb-20 md:pb-8">
              <div className="max-w-4xl mx-auto p-4 md:p-8">
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-4 w-96 mb-8" />
                <Skeleton className="h-64 w-full" />
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Project</h2>
            <p className="text-muted-foreground mb-4">
              {error.message || 'An unexpected error occurred while loading the project.'}
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!project) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
            <p className="text-muted-foreground">The requested project could not be found.</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Animated background nodes */}
        <NetworkNodes />
        
        {/* Main workspace container */}
        <div className="relative z-10 flex">
          <WorkspaceSidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            project={project}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          
          <WorkspaceContent 
            activeSection={activeSection}
            project={project}
            sidebarOpen={isSidebarOpen}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};
