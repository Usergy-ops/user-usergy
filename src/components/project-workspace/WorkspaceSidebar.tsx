import React from 'react';
import { FileText, Brain, Share2, Bug, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const sidebarSections = [
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'tasks', label: 'Tasks & Surveys', icon: Brain },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'issues', label: 'Report Issues', icon: Bug },
  { id: 'messages', label: 'Messages', icon: MessageSquare }
];

interface WorkspaceSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  project: any;
}

interface SidebarNavItemProps {
  section: typeof sidebarSections[0];
  isActive: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ section, isActive, onClick }) => {
  const Icon = section.icon;
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        isActive={isActive}
        className="w-full justify-start"
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{section.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const formatDeadline = (deadline: string) => {
  const date = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

export const WorkspaceSidebarContent: React.FC<WorkspaceSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  project
}) => {
  return (
    <>
      {/* Project Info */}
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="p-3 space-y-3">
            <h3 className="font-semibold text-sm line-clamp-2">{project.title}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] transition-all duration-1000"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-primary">${project.reward}</div>
                <div className="text-muted-foreground">Reward</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{formatDeadline(project.deadline)}</div>
                <div className="text-muted-foreground">Days left</div>
              </div>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Navigation Sections */}
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {sidebarSections.map((section) => (
              <SidebarNavItem 
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onClick={() => onSectionChange(section.id)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

// Keep the old component for backward compatibility but mark as deprecated
/**
 * @deprecated Use WorkspaceSidebarContent with UnifiedLayout instead
 */
export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps & { 
  isOpen: boolean; 
  onToggle: () => void; 
}> = (props) => {
  // Return the new content component for now
  return <WorkspaceSidebarContent {...props} />;
};
