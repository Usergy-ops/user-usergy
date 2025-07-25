
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ActiveProject {
  id: string;
  name: string;
  description: string;
  reward: number;
  progress: number;
  status: string;
}

interface ActiveProjectCardProps {
  project: ActiveProject;
}

const ActiveProjectCard: React.FC<ActiveProjectCardProps> = ({ project }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleViewProject = () => {
    navigate(`/dashboard/project/${project.id}`);
  };
  
  return (
    <div 
      className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 
                 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <span className="px-3 py-1 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white text-xs font-medium rounded-full">
            Active
          </span>
        </div>
        
        {/* Reward with gradient text */}
        <div className="mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
            ${project.reward}
          </span>
          <span className="text-muted-foreground text-sm ml-2">reward</span>
        </div>
        
        {/* Animated progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full transition-all duration-1000"
              style={{ width: `${project.progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <button 
          onClick={handleViewProject}
          className="group/btn relative w-full py-3 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white font-medium rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
        >
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <span>View Project</span>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          
          {/* Ripple effect on click */}
          <div className="absolute inset-0 bg-white opacity-0 group-active/btn:opacity-20 transition-opacity" />
        </button>
      </div>
    </div>
  );
};

export default ActiveProjectCard;
