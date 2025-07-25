
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, FolderKanban, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header: React.FC = () => {
  const { signOut, user } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handlePaymentsClick = () => {
    navigate('/payments');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C6FB] to-[#005BEA] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#00C6FB]/25">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            {/* Rotating glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
            Usergy
          </span>
        </Link>

        {/* Right Navigation - Only show when authenticated */}
        {user && (
          <div className="flex items-center space-x-6">
            {/* Projects Navigation Link */}
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Projects & Invites
            </Link>
            
            {/* Avatar with enhanced dropdown */}
            <div className="relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-10 h-10 rounded-full overflow-hidden transition-transform duration-300 hover:scale-105">
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow" />
                    <div className="absolute inset-[2px] rounded-full bg-background" />
                    <Avatar className="relative w-full h-full">
                      <AvatarImage src={profileData?.avatar_url} alt={profileData?.full_name || ''} />
                      <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                        {profileData?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-48 bg-card/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 animate-in slide-in-from-top-2" 
                  align="end"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {profileData?.full_name || 'Explorer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2 text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handlePaymentsClick}
                    className="flex items-center space-x-2 text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payments</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
