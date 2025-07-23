
import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  type: string;
  created_at: string;
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
  unread_count: number;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string, title: string) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const conversationIds = participantData?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let lastMessageWithSender = null;
          if (lastMessage) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', lastMessage.sender_id)
              .single();

            lastMessageWithSender = {
              ...lastMessage,
              sender: senderProfile || { full_name: 'Unknown User' }
            };
          }

          return {
            ...conv,
            last_message: lastMessageWithSender,
            unread_count: 0 // TODO: Implement unread count logic
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel(`conversations:${user?.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations'
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                  selectedConversationId === conversation.id ? 'bg-primary/10' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id, conversation.title)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm">{conversation.title}</h3>
                  <div className="flex items-center space-x-2">
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="px-2 py-1 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                {conversation.last_message && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">
                      {conversation.last_message.sender.full_name}:
                    </span>{' '}
                    {conversation.last_message.content.substring(0, 50)}
                    {conversation.last_message.content.length > 50 ? '...' : ''}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
