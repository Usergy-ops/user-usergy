
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Home, User, Settings, FolderKanban, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Profile', url: '/profile-completion', icon: User },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Settings', url: '/settings', icon: Settings },
];

interface UnifiedSidebarProps {
  children?: React.ReactNode;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ children }) => {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isCollapsed = state === 'collapsed';
  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold text-lg">Usergy</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Default Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Custom Content */}
        {children}
      </SidebarContent>
    </Sidebar>
  );
};
