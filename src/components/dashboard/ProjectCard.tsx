
import React from 'react';
import { Calendar, DollarSign, Play, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Project {
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
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      
      {/* Project Header */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600">Active</span>
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
              <DropdownMenuItem>Contact Support</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Project Description */}
        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
        
        {/* Project Meta */}
        <div className="space-y-3">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Due {formatDate(project.deadline)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>${project.reward}</span>
            </div>
          </div>
          
          {/* Progress Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
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
