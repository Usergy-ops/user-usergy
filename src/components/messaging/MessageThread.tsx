import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Reply, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type MessageType = 'text' | 'file' | 'image' | 'system';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  reply_to?: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url?: string;
  };
}

interface MessageThreadProps {
  conversationId: string;
  title: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ conversationId, title }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for the messages
      const userIds = [...new Set(messagesData?.map(m => m.sender_id).filter(Boolean) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine messages with user profiles and ensure proper typing
      const messagesWithUsers: Message[] = (messagesData || [])
        .filter(message => 
          message.id && 
          message.sender_id && 
          message.content && 
          message.message_type && 
          message.created_at
        )
        .map(message => ({
          ...message,
          message_type: message.message_type as MessageType,
          sender: profiles?.find(p => p.user_id === message.sender_id) || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        }));

      setMessages(messagesWithUsers);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMessage = payload.new;
        
        // Validate that all required fields are present
        if (!newMessage.id || !newMessage.sender_id || !newMessage.content || !newMessage.message_type || !newMessage.created_at) {
          console.warn('Incomplete message data received:', newMessage);
          return;
        }

        // Fetch the user profile for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', newMessage.sender_id)
          .single();

        // Create complete Message object
        const typedMessage: Message = {
          id: newMessage.id,
          content: newMessage.content,
          sender_id: newMessage.sender_id,
          message_type: newMessage.message_type as MessageType,
          file_url: newMessage.file_url,
          file_name: newMessage.file_name,
          reply_to: newMessage.reply_to,
          created_at: newMessage.created_at,
          sender: profile || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        };

        setMessages(prev => [...prev, typedMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text' as MessageType
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      <div className="border-b p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[70%] ${message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender.avatar_url} />
                  <AvatarFallback>
                    {message.sender.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <div className="text-sm font-medium mb-1">
                    {message.sender.full_name}
                  </div>
                  <div className="text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender_id === user?.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
