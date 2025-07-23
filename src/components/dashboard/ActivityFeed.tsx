
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, Trophy, Briefcase } from 'lucide-react';

const activities = [
  {
    type: 'project_invitation',
    icon: <Briefcase className="h-4 w-4" />,
    message: 'You received a project invitation',
    details: 'AI-Powered Customer Service Bot',
    time: '2 hours ago',
    color: 'bg-blue-500',
  },
  {
    type: 'message',
    icon: <MessageSquare className="h-4 w-4" />,
    message: 'New message from Sarah Chen',
    details: 'About the Mobile Trading App project',
    time: '4 hours ago',
    color: 'bg-green-500',
  },
  {
    type: 'achievement',
    icon: <Trophy className="h-4 w-4" />,
    message: 'Achievement unlocked!',
    details: 'Completed 5 AI/ML projects',
    time: '1 day ago',
    color: 'bg-yellow-500',
  },
  {
    type: 'project_update',
    icon: <Briefcase className="h-4 w-4" />,
    message: 'Project status updated',
    details: 'E-commerce Platform Redesign - 75% complete',
    time: '2 days ago',
    color: 'bg-purple-500',
  },
];

export const ActivityFeed = () => {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-lg text-white ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mb-1">{activity.details}</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
};
