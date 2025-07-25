
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Briefcase, 
  MessageSquare, 
  User, 
  Settings,
  TrendingUp,
  FileText,
  Bell
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Explore Projects', url: '/dashboard/explore', icon: Search },
  { title: 'My Applications', url: '/dashboard/applications', icon: Briefcase },
  { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare },
  { title: 'Analytics', url: '/dashboard/analytics', icon: TrendingUp },
  { title: 'Documents', url: '/dashboard/documents', icon: FileText },
];

const bottomItems = [
  { title: 'Profile', url: '/dashboard/profile', icon: User },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export const DashboardSidebar: React.FC = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const { profileData } = useProfile();

  const isActive = (path: string) => location.pathname === path;

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50";
  };

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border/50 bg-card/80 backdrop-blur-sm`}>
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
              <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
              Usergy
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(item.url)}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-11">
                <NavLink 
                  to={item.url} 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(item.url)}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {!collapsed && (
          <div className="p-3 mt-4 bg-gradient-to-r from-primary-start/10 to-primary-end/10 rounded-lg border border-primary/20">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profileData.profile_picture_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {profileData.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profileData.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
