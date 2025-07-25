
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NetworkNodes } from '@/components/NetworkNodes';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Animated Network Background */}
      <div className="fixed inset-0 z-0">
        <NetworkNodes />
      </div>

      {/* Premium Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          {/* Logo with correct Usergy branding */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <svg className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00C6FB" />
                    <stop offset="100%" stopColor="#005BEA" />
                  </linearGradient>
                </defs>
                <circle cx="6" cy="12" r="3" fill="url(#logoGradient)" />
                <circle cx="18" cy="6" r="3" fill="url(#logoGradient)" />
                <circle cx="18" cy="18" r="3" fill="url(#logoGradient)" />
                <path d="M8.5 14l7-4" stroke="url(#logoGradient)" strokeWidth="2" />
                <path d="M8.5 10l7 4" stroke="url(#logoGradient)" strokeWidth="2" />
              </svg>
              {/* Rotating glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
              Usergy
            </span>
          </Link>

          {/* Right side navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300">
              Projects & Invites
            </Link>
            
            {/* Avatar with dropdown */}
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
                
                {/* Dropdown menu with slide animation */}
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
                  <DropdownMenuItem className="text-sm text-foreground hover:bg-primary/10 transition-colors cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-sm text-foreground hover:bg-primary/10 transition-colors cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payments
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-sm text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
