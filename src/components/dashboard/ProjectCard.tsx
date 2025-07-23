
import React from 'react';
import { Clock, Users, DollarSign, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  reward: number;
  deadline: string;
  skills: string[];
  clientName: string;
  clientAvatar?: string;
  maxParticipants: number;
  currentParticipants: number;
  featured?: boolean;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-blue-100 text-blue-800 border-blue-200',
  advanced: 'bg-orange-100 text-orange-800 border-orange-200',
  expert: 'bg-red-100 text-red-800 border-red-200',
};

const categoryColors = {
  ai_ml: 'bg-purple-100 text-purple-800 border-purple-200',
  mobile_apps: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  web_platforms: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  blockchain: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  data_science: 'bg-pink-100 text-pink-800 border-pink-200',
  ui_ux: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  category,
  difficulty,
  reward,
  deadline,
  skills,
  clientName,
  clientAvatar,
  maxParticipants,
  currentParticipants,
  featured = false,
}) => {
  const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 7;
  
  return (
    <Card className={`h-full transition-all duration-300 hover:shadow-lg border-border/60 ${featured ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={clientAvatar} alt={clientName} />
              <AvatarFallback className="bg-gradient-to-br from-primary-start to-primary-end text-white">
                {clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{clientName}</p>
              <p className="text-sm text-muted-foreground">Client</p>
            </div>
          </div>
          {featured && (
            <Badge className="bg-gradient-to-r from-primary-start to-primary-end text-white">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {description}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={categoryColors[category as keyof typeof categoryColors]}>
              {category.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline" className={difficultyColors[difficulty]}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 py-3 border-t border-border/40">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-foreground">${reward.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Reward</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`} />
            <div>
              <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-foreground'}`}>
                {daysLeft} days
              </p>
              <p className="text-xs text-muted-foreground">Left</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {currentParticipants}/{maxParticipants}
              </p>
              <p className="text-xs text-muted-foreground">Spots</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button className="flex-1 bg-gradient-to-r from-primary-start to-primary-end text-white hover:opacity-90">
              Apply Now
            </Button>
            <Button variant="outline" size="icon">
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
