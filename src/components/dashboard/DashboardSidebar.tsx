
import React from 'react';
import { 
  Home, 
  Briefcase, 
  Users, 
  Trophy, 
  MessageSquare, 
  Settings,
  BarChart3,
  Calendar,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const sidebarItems: SidebarItem[] = [
  {
    icon: <Home className="h-4 w-4" />,
    label: 'Dashboard',
    active: true,
  },
  {
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Projects',
    badge: '4',
    badgeVariant: 'secondary',
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: 'Community',
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    label: 'Achievements',
    badge: 'New',
    badgeVariant: 'destructive',
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Messages',
    badge: '12',
    badgeVariant: 'default',
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    label: 'Analytics',
  },
  {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Calendar',
  },
];

const quickActions: SidebarItem[] = [
  {
    icon: <Star className="h-4 w-4" />,
    label: 'Favorites',
  },
  {
    icon: <Zap className="h-4 w-4" />,
    label: 'Quick Apply',
  },
  {
    icon: <Settings className="h-4 w-4" />,
    label: 'Settings',
  },
];

export const DashboardSidebar = () => {
  return (
    <div className="pb-12 min-h-screen w-64 bg-card/50 backdrop-blur-sm border-r border-border/40">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground">
            Explorer Hub
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  item.active && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground">
            Quick Actions
          </h2>
          <div className="space-y-1">
            {quickActions.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
