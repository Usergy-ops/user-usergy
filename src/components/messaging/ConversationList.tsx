
import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Plus, Search } from 'lucide-react';
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
  type: 'general' | 'private' | 'announcement';
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
}

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string, title: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onConversationSelect
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner (
            user_id,
            last_read_at
          ),
          messages (
            content,
            created_at,
            sender:profiles!messages_sender_id_fkey (
              full_name
            )
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedConversations: Conversation[] = data?.map(conv => {
        const lastMessage = conv.messages?.[conv.messages.length - 1];
        const lastReadAt = conv.conversation_participants[0]?.last_read_at;
        
        // Calculate unread count (simplified)
        const unreadCount = conv.messages?.filter(
          msg => new Date(msg.created_at) > new Date(lastReadAt || 0)
        ).length || 0;

        return {
          id: conv.id,
          title: conv.title,
          type: conv.type,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          unread_count: unreadCount,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sender_name: lastMessage.sender.full_name,
            created_at: lastMessage.created_at
          } : undefined
        };
      }) || [];

      setConversations(processedConversations);
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

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <Users className="w-4 h-4" />;
      case 'announcement':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'private':
        return 'bg-purple-100 text-purple-800';
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id, conversation.title)}
              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                selectedConversationId === conversation.id ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(conversation.type)}
                  <span className="font-medium text-sm">{conversation.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getTypeColor(conversation.type)}>
                    {conversation.type}
                  </Badge>
                  {conversation.unread_count > 0 && (
                    <Badge className="bg-red-500">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
              
              {conversation.last_message && (
                <div className="text-sm text-muted-foreground">
                  <div className="truncate">
                    <span className="font-medium">{conversation.last_message.sender_name}:</span>
                    <span className="ml-1">{conversation.last_message.content}</span>
                  </div>
                  <div className="text-xs mt-1">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
