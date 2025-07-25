import React from 'react';

interface DashboardHeroProps {
  userName: string;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ userName }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background/80 to-primary/5 rounded-2xl p-8 mb-8">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 400">
          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C6FB" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#005BEA" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Animated network nodes */}
          <g className="animate-float">
            <circle cx="100" cy="100" r="3" fill="url(#networkGradient)" />
            <circle cx="300" cy="150" r="4" fill="url(#networkGradient)" />
            <circle cx="500" cy="80" r="3" fill="url(#networkGradient)" />
            <circle cx="700" cy="120" r="5" fill="url(#networkGradient)" />
            <circle cx="900" cy="160" r="3" fill="url(#networkGradient)" />
            
            {/* Connecting lines with animation */}
            <path d="M100,100 Q200,50 300,150 T500,80 Q600,100 700,120 T900,160" 
                  stroke="url(#networkGradient)" 
                  strokeWidth="1" 
                  fill="none"
                  strokeDasharray="5,5"
                  className="animate-dash" />
          </g>
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to your Explorer Dashboard, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Discover new missions, track your progress, and earn rewards.
          </p>
        </div>
        
        {/* Animated Explorer Illustration */}
        <div className="hidden md:block">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="explorerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C6FB" />
                <stop offset="100%" stopColor="#005BEA" />
              </linearGradient>
            </defs>
            
            {/* Explorer character with animation */}
            <g className="animate-bounce-slow">
              {/* Body */}
              <ellipse cx="100" cy="140" rx="30" ry="40" fill="#4B5563" />
              
              {/* Head/Helmet */}
              <circle cx="100" cy="80" r="25" fill="#6B7280" />
              
              {/* Visor with gradient */}
              <ellipse cx="100" cy="78" rx="20" ry="18" fill="url(#explorerGradient)" opacity="0.6" />
              <ellipse cx="100" cy="78" rx="18" ry="15" fill="none" stroke="#00C6FB" strokeWidth="2" />
              
              {/* Antenna with pulsing signal */}
              <line x1="100" y1="55" x2="100" y2="40" stroke="#005BEA" strokeWidth="2" />
              <circle cx="100" cy="38" r="3" fill="#00C6FB" className="animate-ping" />
              
              {/* Floating data points around explorer */}
              <g className="animate-orbit">
                <circle cx="130" cy="60" r="2" fill="#00C6FB" opacity="0.8" />
                <circle cx="70" cy="90" r="2" fill="#005BEA" opacity="0.8" />
                <circle cx="130" cy="110" r="2" fill="#00C6FB" opacity="0.8" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;