
import React, { useState } from 'react';
import { Calendar, DollarSign, Play, MoreVertical, Clock, Users, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedProject {
  id: number;
  title: string;
  description: string;
  progress: number;
  deadline: Date;
  reward: number;
  completedTasks: number;
  totalTasks: number;
  pointsEarned: number;
  category: string;
  client: string;
  status: string;
  difficulty: string;
  estimatedTime: string;
  tags: string[];
  urgency: 'high' | 'medium' | 'low';
  collaboration: boolean;
  teamSize: number;
  feedback: number;
}

interface EnhancedProjectCardProps {
  project: EnhancedProject;
  viewMode: 'grid' | 'list';
}

export const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({ project, viewMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <Badge className={getUrgencyColor(project.urgency)}>
                  {project.urgency} priority
                </Badge>
                <Badge className={getDifficultyColor(project.difficulty)}>
                  {project.difficulty}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {project.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {formatDate(project.deadline)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${project.reward}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{project.estimatedTime}</span>
                </div>
                {project.collaboration && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{project.teamSize} team</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{project.progress}%</div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Play className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      
      {/* Project Header */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge className={getUrgencyColor(project.urgency)}>
                {project.urgency}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.title}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Download Report</DropdownMenuItem>
              <DropdownMenuItem>Contact Team</DropdownMenuItem>
              <DropdownMenuItem>Mark as Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Client Info */}
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${project.client}&background=random`} />
            <AvatarFallback>{project.client.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600">{project.client}</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-500">{project.feedback}</span>
          </div>
        </div>
        
        {/* Project Description */}
        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{project.tags.length - 3} more
            </Badge>
          )}
        </div>
        
        {/* Project Meta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due {formatDate(project.deadline)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>${project.reward}</span>
              </div>
            </div>
            <Badge className={getDifficultyColor(project.difficulty)}>
              {project.difficulty}
            </Badge>
          </div>
          
          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{project.estimatedTime}</span>
            </div>
            {project.collaboration && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{project.teamSize} collaborators</span>
              </div>
            )}
          </div>
          
          {/* Progress Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          {/* Task Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {project.completedTasks}/{project.totalTasks} tasks completed
            </span>
            <span className="text-green-600 font-medium">
              +{project.pointsEarned} points
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="px-6 pb-6">
        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
          <Play className="w-4 h-4 mr-2" />
          Continue Project
        </Button>
      </div>
      
      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
