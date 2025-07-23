
import React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

export const InvitationsTab: React.FC = () => {
  // Mock data - would come from API
  const pendingInvitations: any[] = [];
  const loading = false;

  if (loading) {
    return <div>Loading invitations...</div>;
  }

  if (pendingInvitations.length === 0) {
    return <EmptyStateWithIllustration type="invitations" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Invitations</h2>
          <p className="text-gray-600">
            You have {pendingInvitations.length} exclusive project invitations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">Accept All</Button>
          <Button variant="outline" size="sm">Mark All as Read</Button>
        </div>
      </div>
      
      {/* Invitations will be rendered here */}
    </div>
  );
};
