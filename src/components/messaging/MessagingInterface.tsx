
import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { Card } from '@/components/ui/card';

export const MessagingInterface: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleConversationSelect = (id: string, title: string) => {
    setSelectedConversation({ id, title });
  };

  return (
    <div className="h-[600px] flex">
      <Card className="w-1/3 border-r">
        <ConversationList
          selectedConversationId={selectedConversation?.id}
          onConversationSelect={handleConversationSelect}
        />
      </Card>
      
      <Card className="flex-1">
        {selectedConversation ? (
          <MessageThread
            conversationId={selectedConversation.id}
            title={selectedConversation.title}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
