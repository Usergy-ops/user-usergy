import React from 'react';
import { CheckCircle, Clock, CreditCard } from 'lucide-react';

interface CompletedProject {
  id: string;
  name: string;
  description: string;
  completedDate: string;
  status: string;
  paymentStatus: string;
  reward: number;
}

interface CompletedProjectCardProps {
  project: CompletedProject;
}

const CompletedProjectCard: React.FC<CompletedProjectCardProps> = ({ project }) => {
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 
                   transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1">
      {/* Success indicator */}
      <div className="absolute -top-2 -right-2">
        <div className="bg-green-500 rounded-full p-1">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Completed
          </span>
        </div>
        
        {/* Project details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Completed on {project.completedDate}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>Payment: {project.paymentStatus}</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
              ${project.reward}
            </span>
          </div>
        </div>
        
        {/* View details button */}
        <button className="w-full py-2 border border-border/50 rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 transition-colors duration-300">
          View Details
        </button>
      </div>
    </div>
  );
};

export default CompletedProjectCard;