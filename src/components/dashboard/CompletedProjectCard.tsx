import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface CompletedProject {
  id: string;
  name: string;
  completionDate: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
}

interface CompletedProjectCardProps {
  project: CompletedProject;
}

const CompletedProjectCard: React.FC<CompletedProjectCardProps> = ({ project }) => {
  const getStatusIcon = () => {
    switch (project.status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'Approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getPaymentStatusColor = () => {
    switch (project.paymentStatus) {
      case 'Paid':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-2xl hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary/20">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
      
      <div className="space-y-4">
        {/* Project name */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {project.name}
        </h3>
        
        {/* Completion date */}
        <p className="text-sm text-muted-foreground">
          Completed on {project.completionDate}
        </p>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-3">
          <Badge 
            variant="outline" 
            className={`flex items-center gap-2 ${getStatusColor()}`}
          >
            {getStatusIcon()}
            {project.status}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`${getPaymentStatusColor()}`}
          >
            Payment: {project.paymentStatus}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CompletedProjectCard;