
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

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

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
              Usergy
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {user && (
              <Button
                variant="ghost"
                onClick={handleDashboardClick}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Dashboard
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
