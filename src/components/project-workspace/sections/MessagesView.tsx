import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Search, Phone, Video, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MessagesViewProps {
  project: any;
}

const MessageBubble: React.FC<{ message: any; isOwn: boolean }> = ({ message, isOwn }) => {
  return (
    <div className={cn(
      "flex items-end space-x-2 mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        isOwn 
          ? "bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white ml-12"
          : "bg-muted text-foreground mr-12"
      )}>
        {!isOwn && (
          <div className="text-xs font-semibold mb-1 opacity-70">
            {message.sender.name}
          </div>
        )}
        <p className="text-sm">{message.content}</p>
        <div className={cn(
          "text-xs mt-1",
          isOwn ? "text-white/70" : "text-muted-foreground"
        )}>
          {message.timestamp}
        </div>
      </div>
      
      {isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

const ContactItem: React.FC<{ contact: any; isActive: boolean; onClick: () => void }> = ({ 
  contact, 
  isActive, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-muted/50",
        isActive && "bg-primary/10 border border-primary/20"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {contact.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm truncate">{contact.name}</span>
            {contact.unread > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {contact.unread}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
            <span className="text-xs text-muted-foreground">{contact.lastSeen}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export const MessagesView: React.FC<MessagesViewProps> = ({ project }) => {
  const [activeContact, setActiveContact] = useState('support');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = [
    {
      id: 'support',
      name: 'Project Support',
      avatar: '/placeholder.svg',
      role: 'Support Team',
      online: true,
      lastMessage: 'Happy to help with any questions!',
      lastSeen: '2m ago',
      unread: 0
    },
    {
      id: 'coordinator',
      name: 'Lisa Thompson',
      avatar: '/placeholder.svg',
      role: 'Project Coordinator',
      online: true,
      lastMessage: 'Great progress on the testing so far',
      lastSeen: '1h ago',
      unread: 2
    },
    {
      id: 'lead',
      name: 'David Chen',
      avatar: '/placeholder.svg',
      role: 'Technical Lead',
      online: false,
      lastMessage: 'Thanks for the detailed bug report',
      lastSeen: '3h ago',
      unread: 0
    }
  ];

  const messages = {
    support: [
      {
        id: '1',
        sender: { name: 'Project Support', avatar: '/placeholder.svg' },
        content: 'Welcome to the AI Product Testing Mission! I\'m here to help you with any questions or concerns you might have.',
        timestamp: '10:30 AM',
        isOwn: false
      },
      {
        id: '2',
        sender: { name: 'You', avatar: '/placeholder.svg' },
        content: 'Hi! I just started the project. Where can I find the initial setup instructions?',
        timestamp: '10:32 AM',
        isOwn: true
      },
      {
        id: '3',
        sender: { name: 'Project Support', avatar: '/placeholder.svg' },
        content: 'Great question! You can find all the setup instructions in the Instructions tab. Make sure to download the attachments as well for the complete guide.',
        timestamp: '10:33 AM',
        isOwn: false
      },
      {
        id: '4',
        sender: { name: 'You', avatar: '/placeholder.svg' },
        content: 'Perfect, thank you! I\'ll check that out now.',
        timestamp: '10:35 AM',
        isOwn: true
      },
      {
        id: '5',
        sender: { name: 'Project Support', avatar: '/placeholder.svg' },
        content: 'Happy to help with any questions!',
        timestamp: '10:36 AM',
        isOwn: false
      }
    ],
    coordinator: [
      {
        id: '1',
        sender: { name: 'Lisa Thompson', avatar: '/placeholder.svg' },
        content: 'Hi there! I\'ve been reviewing your progress and I\'m really impressed with the thoroughness of your testing.',
        timestamp: '9:15 AM',
        isOwn: false
      },
      {
        id: '2',
        sender: { name: 'Lisa Thompson', avatar: '/placeholder.svg' },
        content: 'Great progress on the testing so far',
        timestamp: '9:16 AM',
        isOwn: false
      }
    ],
    lead: [
      {
        id: '1',
        sender: { name: 'David Chen', avatar: '/placeholder.svg' },
        content: 'Thanks for the detailed bug report about the memory leak. Our dev team is looking into it now.',
        timestamp: '7:45 AM',
        isOwn: false
      }
    ]
  };

  const activeContactData = contacts.find(c => c.id === activeContact);
  const currentMessages = messages[activeContact as keyof typeof messages] || [];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would normally send the message to your backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Messages
        </h1>
        <p className="text-muted-foreground">
          Communicate with the project team and get support when you need it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Contacts Sidebar */}
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contacts</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-3 pb-3">
              {filteredContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  isActive={activeContact === contact.id}
                  onClick={() => setActiveContact(contact.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeContactData?.avatar} />
                  <AvatarFallback>{activeContactData?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{activeContactData?.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeContactData?.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Video className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {currentMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.isOwn}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-end space-x-2">
              <Button size="sm" variant="outline">
                <Paperclip className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[40px]"
                />
              </div>
              <Button size="sm" variant="outline">
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};