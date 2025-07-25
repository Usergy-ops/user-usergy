
import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

export const DashboardHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profileData } = useProfile();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="lg:hidden" />
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search projects, people, or resources..."
              className="pl-10 w-80 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              {profileData.completion_percentage}% Complete
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-red rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b border-border/50">
                <p className="font-medium">Notifications</p>
              </div>
              <DropdownMenuItem className="flex items-center space-x-3 py-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">New project match!</p>
                  <p className="text-xs text-muted-foreground">AI Research Assistant - 95% match</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-3 py-3">
                <div className="w-2 h-2 bg-accent-red rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Application deadline</p>
                  <p className="text-xs text-muted-foreground">Mobile App Designer - 2 days left</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 hover:bg-accent/50">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src={profileData.profile_picture_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {profileData.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">
                  {profileData.full_name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-border/50">
                <p className="font-medium">{profileData.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
