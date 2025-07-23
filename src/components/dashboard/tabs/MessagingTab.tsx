
import React from 'react';
import { MessagingInterface } from '@/components/messaging/MessagingInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const MessagingTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Communication</h2>
        <p className="text-gray-600">
          Collaborate with your team and stay connected on all your projects
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MessagingInterface />
        </CardContent>
      </Card>
    </div>
  );
};
