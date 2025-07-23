
import React from 'react';
import { Sparkles, Search, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'projects' | 'invitations' | 'history' | 'browse';
}

export const EmptyStateWithIllustration: React.FC<EmptyStateProps> = ({ type }) => {
  const configs = {
    projects: {
      title: "No Active Projects Yet",
      description: "Ready to start your exploration journey? Browse exciting projects and begin contributing to innovation.",
      action: "Browse Projects",
      icon: Search,
      illustration: <ProjectsEmptyIllustration />
    },
    invitations: {
      title: "No Invitations Yet", 
      description: "Keep building your profile! Great Explorers attract exclusive project invitations.",
      action: "Enhance Profile",
      icon: Users,
      illustration: <InvitationsEmptyIllustration />
    },
    history: {
      title: "Your Journey Starts Here",
      description: "Complete your first project to start building your Explorer legacy.",
      action: "Find First Project",
      icon: Search,
      illustration: <HistoryEmptyIllustration />
    },
    browse: {
      title: "No Projects Found",
      description: "Try adjusting your filters or search terms to find more projects.",
      action: "Clear Filters",
      icon: FileText,
      illustration: <BrowseEmptyIllustration />
    }
  };
  
  const config = configs[type];
  const ActionIcon = config.icon;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      
      {/* Illustration */}
      <div className="w-64 h-64">
        {config.illustration}
      </div>
      
      {/* Content */}
      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900">
          {config.title}
        </h3>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>
      
      {/* Action */}
      <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
        <ActionIcon className="w-4 h-4 mr-2" />
        {config.action}
      </Button>
    </div>
  );
};

const ProjectsEmptyIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      {/* Animated rocket ship */}
      <g className="animate-bounce">
        <rect x="180" y="100" width="40" height="60" rx="20" fill="#3B82F6" />
        <polygon points="200,80 180,100 220,100" fill="#EF4444" />
        <circle cx="190" cy="120" r="4" fill="#FFFFFF" />
        <circle cx="210" cy="120" r="4" fill="#FFFFFF" />
        <path d="M190 160 L185 180 L195 180 Z" fill="#F59E0B" />
        <path d="M210 160 L205 180 L215 180 Z" fill="#F59E0B" />
      </g>
      
      {/* Floating project cards */}
      <g className="animate-pulse">
        <rect x="50" y="150" width="80" height="60" rx="8" fill="#F3F4F6" opacity="0.7" />
        <rect x="270" y="140" width="80" height="60" rx="8" fill="#F3F4F6" opacity="0.7" />
        <rect x="60" y="160" width="60" height="4" rx="2" fill="#E5E7EB" />
        <rect x="60" y="170" width="40" height="4" rx="2" fill="#E5E7EB" />
        <rect x="280" y="150" width="60" height="4" rx="2" fill="#E5E7EB" />
        <rect x="280" y="160" width="40" height="4" rx="2" fill="#E5E7EB" />
      </g>
      
      {/* Stars */}
      <g className="animate-pulse">
        <circle cx="100" cy="50" r="2" fill="#FCD34D" />
        <circle cx="300" cy="70" r="2" fill="#FCD34D" />
        <circle cx="350" cy="180" r="2" fill="#FCD34D" />
        <circle cx="80" cy="100" r="1.5" fill="#FCD34D" />
      </g>
    </svg>
  );
};

const InvitationsEmptyIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      {/* Envelope */}
      <g className="animate-pulse">
        <rect x="150" y="120" width="100" height="80" rx="8" fill="#3B82F6" />
        <polygon points="150,120 200,160 250,120" fill="#1E40AF" />
        <circle cx="200" cy="140" r="8" fill="#FFFFFF" />
      </g>
      
      {/* Floating invitation cards */}
      <g className="animate-bounce" style={{animationDelay: '0.5s'}}>
        <rect x="80" y="80" width="60" height="40" rx="4" fill="#F3F4F6" opacity="0.8" />
        <rect x="260" y="90" width="60" height="40" rx="4" fill="#F3F4F6" opacity="0.8" />
      </g>
      
      {/* Stars around */}
      <g className="animate-pulse">
        <circle cx="120" cy="60" r="2" fill="#FCD34D" />
        <circle cx="280" cy="70" r="2" fill="#FCD34D" />
        <circle cx="320" cy="180" r="2" fill="#FCD34D" />
      </g>
    </svg>
  );
};

const HistoryEmptyIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      {/* Trophy */}
      <g className="animate-bounce">
        <rect x="180" y="140" width="40" height="50" rx="8" fill="#F59E0B" />
        <ellipse cx="200" cy="130" rx="30" ry="20" fill="#FCD34D" />
        <rect x="190" y="190" width="20" height="30" rx="4" fill="#78716C" />
        <rect x="170" y="210" width="60" height="10" rx="5" fill="#78716C" />
      </g>
      
      {/* Achievement badges */}
      <g className="animate-pulse">
        <circle cx="140" cy="100" r="15" fill="#10B981" opacity="0.7" />
        <circle cx="260" cy="110" r="15" fill="#8B5CF6" opacity="0.7" />
        <circle cx="120" cy="180" r="12" fill="#EF4444" opacity="0.7" />
      </g>
      
      {/* Timeline dots */}
      <g className="animate-pulse">
        <circle cx="100" cy="240" r="3" fill="#6B7280" />
        <circle cx="150" cy="240" r="3" fill="#6B7280" />
        <circle cx="200" cy="240" r="3" fill="#6B7280" />
        <circle cx="250" cy="240" r="3" fill="#6B7280" />
        <circle cx="300" cy="240" r="3" fill="#6B7280" />
      </g>
    </svg>
  );
};

const BrowseEmptyIllustration: React.FC = () => {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      {/* Magnifying glass */}
      <g className="animate-pulse">
        <circle cx="180" cy="140" r="40" fill="none" stroke="#6B7280" strokeWidth="6" />
        <line x1="210" y1="170" x2="240" y2="200" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
      </g>
      
      {/* Search results (empty) */}
      <g className="animate-pulse">
        <rect x="80" y="80" width="60" height="8" rx="4" fill="#E5E7EB" opacity="0.5" />
        <rect x="260" y="90" width="60" height="8" rx="4" fill="#E5E7EB" opacity="0.5" />
        <rect x="120" y="200" width="60" height="8" rx="4" fill="#E5E7EB" opacity="0.5" />
        <rect x="240" y="210" width="60" height="8" rx="4" fill="#E5E7EB" opacity="0.5" />
      </g>
    </svg>
  );
};
