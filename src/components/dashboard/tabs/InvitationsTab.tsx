
import React, { useState } from 'react';
import { Mail, Clock, DollarSign, Users, CheckCircle, X, Eye, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

interface Invitation {
  id: number;
  title: string;
  description: string;
  client: string;
  reward: number;
  estimatedTime: string;
  deadline: Date;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
  priority: 'high' | 'medium' | 'low';
  category: string;
  teamSize: number;
  requirements: string[];
  tags: string[];
  collaboration: boolean;
  clientRating: number;
}

export const InvitationsTab: React.FC = () => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      id: 1,
      title: 'Advanced AI Model Testing for Healthcare',
      description: 'Join our exclusive team to test and validate a cutting-edge AI model designed for medical diagnosis assistance. Your expertise in both AI and healthcare will be invaluable.',
      client: 'MedTech Innovations',
      reward: 450,
      estimatedTime: '5-7 hours',
      deadline: new Date('2024-02-18'),
      invitedAt: new Date('2024-01-20'),
      status: 'pending',
      priority: 'high',
      category: 'ai',
      teamSize: 3,
      requirements: ['AI/ML Experience', 'Healthcare Knowledge', 'Data Analysis'],
      tags: ['AI', 'Healthcare', 'Machine Learning', 'Medical'],
      collaboration: true,
      clientRating: 4.9
    },
    {
      id: 2,
      title: 'Exclusive Beta Testing: Next-Gen Mobile Banking',
      description: 'We\'ve handpicked you for testing our revolutionary mobile banking platform. Your previous banking app experience makes you perfect for this project.',
      client: 'FinanceFirst Bank',
      reward: 320,
      estimatedTime: '3-4 hours',
      deadline: new Date('2024-02-22'),
      invitedAt: new Date('2024-01-18'),
      status: 'pending',
      priority: 'medium',
      category: 'fintech',
      teamSize: 5,
      requirements: ['Mobile Testing', 'Banking Knowledge', 'Security Awareness'],
      tags: ['Mobile', 'Banking', 'Security', 'Fintech'],
      collaboration: true,
      clientRating: 4.8
    },
    {
      id: 3,
      title: 'VR Gaming Experience Validation',
      description: 'Help us perfect the most immersive VR gaming experience ever created. Your gaming expertise and VR knowledge make you ideal for this project.',
      client: 'GameVR Studios',
      reward: 275,
      estimatedTime: '4-5 hours',
      deadline: new Date('2024-02-25'),
      invitedAt: new Date('2024-01-15'),
      status: 'accepted',
      priority: 'medium',
      category: 'gaming',
      teamSize: 8,
      requirements: ['VR Experience', 'Gaming Knowledge', 'User Testing'],
      tags: ['VR', 'Gaming', 'Entertainment', 'Technology'],
      collaboration: true,
      clientRating: 4.7
    }
  ]);

  const handleInvitationAction = (id: number, action: 'accept' | 'decline') => {
    setInvitations(prev => 
      prev.map(inv => 
        inv.id === id ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' } : inv
      )
    );
    
    toast({
      title: action === 'accept' ? 'Invitation Accepted!' : 'Invitation Declined',
      description: action === 'accept' 
        ? 'You\'ve successfully joined the project. Check your active projects tab.' 
        : 'The invitation has been declined.'
    });
  };

  const filteredInvitations = invitations.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const sortedInvitations = [...filteredInvitations].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.invitedAt.getTime() - a.invitedAt.getTime();
      case 'deadline':
        return a.deadline.getTime() - b.deadline.getTime();
      case 'reward':
        return b.reward - a.reward;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (sortedInvitations.length === 0) {
    return <EmptyStateWithIllustration type="invitations" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Invitations</h2>
          <p className="text-gray-600">
            {sortedInvitations.filter(inv => inv.status === 'pending').length} pending invitations • 
            ${sortedInvitations.reduce((sum, inv) => sum + inv.reward, 0)} total value
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="reward">Reward</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {sortedInvitations.map((invitation) => (
          <Card key={invitation.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invitation.status)}>
                      {invitation.status}
                    </Badge>
                    <Badge className={getPriorityColor(invitation.priority)}>
                      {invitation.priority} priority
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Invited {formatDistanceToNow(invitation.invitedAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{invitation.title}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">${invitation.reward}</div>
                  <div className="text-sm text-gray-500">{invitation.estimatedTime}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Client Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${invitation.client}&background=random`} />
                  <AvatarFallback>{invitation.client.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{invitation.client}</div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(invitation.clientRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                    <span>{invitation.clientRating}</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600">{invitation.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {invitation.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Requirements */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Requirements:</div>
                <div className="flex flex-wrap gap-2">
                  {invitation.requirements.map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Project Details */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {formatDistanceToNow(invitation.deadline, { addSuffix: true })}</span>
                </div>
                {invitation.collaboration && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{invitation.teamSize} team members</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4">
                {invitation.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => handleInvitationAction(invitation.id, 'accept')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Invitation
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleInvitationAction(invitation.id, 'decline')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
