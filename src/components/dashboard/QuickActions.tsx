
import React from 'react';
import { Plus, Search, Filter, Upload, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const actions = [
  {
    icon: <Plus className="h-5 w-5" />,
    label: 'Apply to Project',
    description: 'Browse and apply to new projects',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: 'Find Collaborators',
    description: 'Connect with other explorers',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    icon: <Upload className="h-5 w-5" />,
    label: 'Upload Portfolio',
    description: 'Showcase your work',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Join Discussion',
    description: 'Engage with community',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

export const QuickActions = () => {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
            >
              <div className={`p-2 rounded-lg text-white ${action.color}`}>
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-medium text-foreground">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
