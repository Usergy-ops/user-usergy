
import React from 'react';
import { Home, User, FolderKanban, CreditCard, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Profile', url: '/profile-completion', icon: User },
  { title: 'Payments', url: '/payments', icon: CreditCard },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-lg border-t border-border/50">
      <div className="grid grid-cols-5 gap-1 p-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
