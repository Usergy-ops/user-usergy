
import React from 'react';
import { FileText, Brain, Share2, Bug, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isOpen: boolean;
  onToggle: () => void;
}

interface SidebarNavItemProps {
  section: typeof sidebarSections[0];
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ section, isActive, onClick, collapsed }) => {
  const Icon = section.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden hover-lift",
        isActive 
          ? "bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white shadow-lg transform scale-[1.02]" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-transform duration-300 flex-shrink-0",
        isActive ? "rotate-[15deg] scale-110" : "group-hover:rotate-[15deg] group-hover:scale-110"
      )} />
      {!collapsed && (
        <span className="font-medium text-sm">{section.label}</span>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
    </button>
  );
};

const formatDeadline = (deadline: string) => {
  const date = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  project, 
  isOpen,
  onToggle 
}) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block h-[calc(100vh-8rem)] fixed left-0 top-24 bg-card/80 backdrop-blur-md border-r border-border/50 overflow-hidden transition-all duration-300 z-30",
        isOpen ? "w-[280px]" : "w-[60px]"
      )}
      style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.05)' }}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute top-4 -right-3 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10"
        >
          {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {/* Project header */}
          {isOpen && (
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                {project.title}
              </h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] transition-all duration-1000"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Collapsed header */}
          {!isOpen && (
            <div className="p-3 border-b border-border/50">
              <div className="w-8 h-8 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {project.progress}%
                </span>
              </div>
            </div>
          )}
          
          {/* Navigation sections */}
          <nav className="p-4 space-y-2">
            {sidebarSections.map((section) => (
              <SidebarNavItem 
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onClick={() => onSectionChange(section.id)}
                collapsed={!isOpen}
              />
            ))}
          </nav>
          
          {/* Project stats */}
          {isOpen && (
            <div className="mt-auto p-6 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">${project.reward}</div>
                  <div className="text-xs text-muted-foreground">Reward</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {formatDeadline(project.deadline)}
                  </div>
                  <div className="text-xs text-muted-foreground">Days left</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/90 backdrop-blur-lg border-t border-border/50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {sidebarSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{section.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
