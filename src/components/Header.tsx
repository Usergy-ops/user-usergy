
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, FolderKanban, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo (Left Side) */}
          <button
            onClick={handleDashboardClick}
            className="flex items-center space-x-3 group transition-transform duration-300 hover:scale-105 hover:brightness-110"
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
          </button>

          {/* Navigation Controls (Right Side) - Only show when authenticated */}
          {user && (
            <div className="flex items-center space-x-2">
              {/* Projects & Invitations Button */}
              <Button
                variant="ghost"
                className="flex items-center space-x-2 transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projects</span>
              </Button>

              {/* Profile Button */}
              <Button
                variant="ghost"
                onClick={handleProfileClick}
                className="flex items-center space-x-2 transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:rotate-45"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="end"
                  className="w-48 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50"
                >
                  <DropdownMenuItem 
                    onClick={handlePaymentsClick}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Payments</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
