import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Invitation {
  id: string;
  projectName: string;
  reward: number;
  isNew?: boolean;
}

interface InvitationCardProps {
  invitation: Invitation;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation }) => {
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-2xl hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary/20">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C6FB] to-[#005BEA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
      
      {/* New badge with rotating gradient border */}
      {invitation.isNew && (
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full animate-spin"></div>
            <Badge className="relative bg-background text-primary border-2 border-transparent">
              New
            </Badge>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Project name */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {invitation.projectName}
        </h3>
        
        {/* Reward amount */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
            ${invitation.reward}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Potential Reward</p>
        </div>
        
        {/* CTA Button with ripple effect */}
        <Button 
          className="w-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white hover:from-[#005BEA] hover:to-[#00C6FB] transition-all duration-300 group/btn relative overflow-hidden"
          onClick={(e) => {
            // Ripple effect
            const button = e.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('absolute', 'bg-white/30', 'rounded-full', 'animate-ping');
            
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
          }}
        >
          <span>Start Screener</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default InvitationCard;