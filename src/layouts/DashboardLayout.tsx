import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Abstract Vector Network Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <svg className="w-full h-full animate-[float_20s_ease-in-out_infinite]" viewBox="0 0 1200 800">
          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C6FB" />
              <stop offset="100%" stopColor="#005BEA" />
            </linearGradient>
          </defs>
          {/* Network Nodes */}
          <circle cx="200" cy="150" r="4" fill="url(#networkGradient)" />
          <circle cx="400" cy="200" r="3" fill="url(#networkGradient)" />
          <circle cx="600" cy="120" r="5" fill="url(#networkGradient)" />
          <circle cx="800" cy="250" r="3" fill="url(#networkGradient)" />
          <circle cx="1000" cy="180" r="4" fill="url(#networkGradient)" />
          <circle cx="300" cy="400" r="3" fill="url(#networkGradient)" />
          <circle cx="700" cy="450" r="4" fill="url(#networkGradient)" />
          <circle cx="500" cy="600" r="3" fill="url(#networkGradient)" />
          <circle cx="900" cy="550" r="5" fill="url(#networkGradient)" />
          
          {/* Network Connections */}
          <path d="M200,150 Q300,175 400,200" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M400,200 Q500,160 600,120" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M600,120 Q700,185 800,250" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M800,250 Q900,215 1000,180" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M300,400 Q500,500 700,450" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M700,450 Q800,500 900,550" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M400,200 Q350,300 300,400" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
          <path d="M600,120 Q650,285 700,450" stroke="url(#networkGradient)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 ml-6 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#00C6FB] to-[#005BEA] rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                  <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
                Usergy
              </span>
            </button>

            {/* Right Navigation */}
            <div className="flex items-center space-x-6">
              {/* Projects & Invites Link */}
              <Button
                variant="ghost"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Projects & Invites
              </Button>

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-[spin_2s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite]"></div>
                    <Avatar className="relative w-10 h-10 transition-transform duration-200 hover:scale-105">
                      <AvatarImage src={profileData?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-[#00C6FB] to-[#005BEA] text-white font-semibold">
                        {profileData?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 mt-2 animate-in slide-in-from-top-2 duration-200 shadow-lg"
                >
                  <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 transition-colors duration-200">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 transition-colors duration-200">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;