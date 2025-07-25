import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface PublicProject {
  id: string;
  name: string;
  reward: number;
  description: string;
}

interface PublicProjectCardProps {
  project: PublicProject;
}

const PublicProjectCard: React.FC<PublicProjectCardProps> = ({ project }) => {
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-2xl hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary/20">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
      
      <div className="space-y-4">
        {/* Project name and reward */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 flex-1">
            {project.name}
          </h3>
          <div className="text-2xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent ml-4">
            ${project.reward}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {project.description}
        </p>
        
        {/* CTA Button */}
        <Button 
          className="w-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white hover:from-[#005BEA] hover:to-[#00C6FB] transition-all duration-300 group/btn"
        >
          <span>Apply Now</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default PublicProjectCard;