import React, { useState } from 'react';

interface Invitation {
  id: string;
  name: string;
  description: string;
  reward: number;
  expiresIn: string;
  isNew: boolean;
}

interface InvitationCardProps {
  invitation: Invitation;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation }) => {
  const [timeLeft, setTimeLeft] = useState(invitation.expiresIn);
  
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 
                   transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1">
      {/* New badge with rotating border */}
      {invitation.isNew && (
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full animate-spin-slow" />
            <div className="relative bg-background m-0.5 px-3 py-1 rounded-full">
              <span className="text-xs font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">NEW</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-foreground mb-2">{invitation.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{invitation.description}</p>
        
        {/* Reward with pulse animation */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent animate-pulse-slow">
              ${invitation.reward}
            </span>
            <span className="text-muted-foreground text-sm ml-2">reward</span>
          </div>
          
          {/* Timer */}
          <div className="text-sm text-muted-foreground">
            <span className="text-orange-500">⏱️ {timeLeft}</span> left
          </div>
        </div>
        
        {/* Start button with ripple effect */}
        <button className="relative w-full py-3 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white font-medium rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg group/btn">
          <span className="relative z-10">Start Screener</span>
          
          {/* Ripple animation on hover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0 h-0 bg-white/20 rounded-full group-hover/btn:w-full group-hover/btn:h-full transition-all duration-500" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default InvitationCard;