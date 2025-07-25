import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface ActiveProject {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface ActiveProjectCardProps {
  project: ActiveProject;
}

const ActiveProjectCard: React.FC<ActiveProjectCardProps> = ({ project }) => {
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-2xl hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary/20">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
      
      <div className="space-y-4">
        {/* Project name */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {project.name}
        </h3>
        
        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-foreground">{project.progress}%</span>
          </div>
          <div className="relative">
            <Progress value={project.progress} className="h-2 bg-secondary/50" />
            {/* Shimmer animation overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] rounded-full"></div>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="default" 
            className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white animate-pulse"
          >
            {project.status}
          </Badge>
          
          {/* CTA Button */}
          <Button 
            className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white hover:from-[#005BEA] hover:to-[#00C6FB] transition-all duration-300 group/btn"
          >
            <span>View Project</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveProjectCard;