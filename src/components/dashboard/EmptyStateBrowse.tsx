import React from 'react';

const EmptyStateBrowse: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Animated telescope illustration */}
      <div className="relative mb-8">
        <svg width="200" height="200" viewBox="0 0 200 200" className="animate-float">
          <defs>
            <linearGradient id="telescopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C6FB" />
              <stop offset="100%" stopColor="#005BEA" />
            </linearGradient>
          </defs>
          
          {/* Telescope body */}
          <g transform="rotate(-25 100 100)">
            <rect x="60" y="90" width="80" height="20" rx="10" fill="url(#telescopeGradient)" />
            <circle cx="140" cy="100" r="15" fill="none" stroke="url(#telescopeGradient)" strokeWidth="3" />
            <rect x="50" y="95" width="15" height="10" rx="5" fill="#6B7280" />
          </g>
          
          {/* Tripod */}
          <line x1="100" y1="120" x2="80" y2="160" stroke="#6B7280" strokeWidth="3" />
          <line x1="100" y1="120" x2="100" y2="160" stroke="#6B7280" strokeWidth="3" />
          <line x1="100" y1="120" x2="120" y2="160" stroke="#6B7280" strokeWidth="3" />
          
          {/* Scanning beam animation */}
          <g className="animate-scan">
            <path d="M125 85 L180 30 L190 40 L135 95 Z" fill="url(#telescopeGradient)" opacity="0.2" />
            <line x1="130" y1="90" x2="185" y2="35" stroke="url(#telescopeGradient)" strokeWidth="2" strokeDasharray="5,5" className="animate-dash" />
          </g>
          
          {/* Floating stars being discovered */}
          <g className="animate-twinkle">
            <circle cx="170" cy="40" r="2" fill="#00C6FB" />
            <circle cx="180" cy="50" r="1.5" fill="#005BEA" />
            <circle cx="160" cy="55" r="2" fill="#00C6FB" />
          </g>
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">No Public Projects Available</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        We're curating new exciting projects for you. Check back soon or explore your invitations!
      </p>
      
      <button className="px-6 py-2 border border-border/50 rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 transition-colors duration-300">
        Refresh Projects
      </button>
    </div>
  );
};

export default EmptyStateBrowse;