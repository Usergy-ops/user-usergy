
import React from 'react';
import { cn } from '@/lib/utils';
import { InstructionsView } from './sections/InstructionsView';
import { TasksView } from './sections/TasksView';
import { SocialView } from './sections/SocialView';
import { IssuesView } from './sections/IssuesView';
import { MessagesView } from './sections/MessagesView';

interface WorkspaceContentProps {
  activeSection: string;
  project: any;
  sidebarOpen: boolean;
}

export const WorkspaceContent: React.FC<WorkspaceContentProps> = ({ 
  activeSection, 
  project, 
  sidebarOpen 
}) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'instructions':
        return <InstructionsView project={project} />;
      case 'tasks':
        return <TasksView project={project} />;
      case 'social':
        return <SocialView project={project} />;
      case 'issues':
        return <IssuesView project={project} />;
      case 'messages':
        return <MessagesView project={project} />;
      default:
        return <InstructionsView project={project} />;
    }
  };

  return (
    <main className={cn(
      "flex-1 transition-all duration-300 pb-20 md:pb-8",
      sidebarOpen ? "md:ml-[280px]" : "md:ml-[60px]"
    )}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <section 
          key={activeSection}
          className="animate-slide-up"
        >
          {renderSection()}
        </section>
      </div>
    </main>
  );
};
