import React, { useState } from 'react';
import { NetworkNodes } from '@/components/NetworkNodes';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceContent } from './WorkspaceContent';

interface ProjectWorkspaceProps {
  projectId: string;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId }) => {
  const [activeSection, setActiveSection] = useState('instructions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Mock project data - In a real app, this would come from an API
  const project = {
    id: projectId,
    title: 'AI Product Testing Mission',
    description: 'Test and provide feedback on cutting-edge AI tools to help shape the future of artificial intelligence',
    deadline: '2025-08-15',
    reward: 15,
    status: 'active' as const,
    progress: 75,
    instructions: `# Welcome to the AI Product Testing Mission

## Overview
You have been selected to participate in an exclusive AI product testing program. Your feedback will directly influence the development of next-generation AI tools.

## Objectives
1. **Evaluate Core Features**: Test all primary functionalities
2. **User Experience Assessment**: Document your interaction experience
3. **Performance Analysis**: Monitor speed and responsiveness
4. **Bug Identification**: Report any issues encountered

## Testing Guidelines
- Test each feature thoroughly
- Document both positive and negative feedback
- Include screenshots when reporting issues
- Complete all assigned surveys

## Timeline
- **Week 1**: Initial setup and basic testing
- **Week 2**: Advanced feature evaluation
- **Week 3**: Final assessment and reporting

Remember: Your insights are valuable and will shape the future of AI technology!`,
    attachments: [
      {
        id: '1',
        name: 'Testing Checklist.pdf',
        size: '2.4 MB',
        type: 'pdf',
        url: '#'
      },
      {
        id: '2',
        name: 'Setup Guide.docx',
        size: '1.8 MB',
        type: 'docx',
        url: '#'
      }
    ]
  };

  return (
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
  );
};