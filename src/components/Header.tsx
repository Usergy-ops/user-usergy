
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, FolderKanban, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const { signOut, user } = useAuth();
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
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
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
          <div className="flex items-center space-x-4">
            {/* Projects Button */}
            <Button
              variant="ghost"
              onClick={handleDashboardClick}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden md:inline">Projects</span>
            </Button>

            {/* Profile Button */}
            <Button
              variant="ghost"
              onClick={handleProfileClick}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
                >
                  <Settings className="w-4 h-4 transition-transform duration-300 hover:rotate-90" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-48 bg-card/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 animate-in slide-in-from-top-2" 
                align="end"
              >
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
        )}
      </div>
    </header>
  );
};
