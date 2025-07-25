import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Animated SVG illustration */}
      <div className="relative mb-8">
        <svg 
          width="200" 
          height="160" 
          viewBox="0 0 200 160" 
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700"
        >
          <defs>
            <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C6FB" />
              <stop offset="100%" stopColor="#005BEA" />
            </linearGradient>
            <linearGradient id="emptyGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#005BEA" />
              <stop offset="100%" stopColor="#00C6FB" />
            </linearGradient>
          </defs>
          
          {/* Floating shapes with staggered animations */}
          <circle 
            cx="50" 
            cy="50" 
            r="12" 
            fill="url(#emptyGradient)" 
            className="animate-in fade-in-0 slide-in-from-left-4 duration-700 delay-100"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          />
          <rect 
            x="140" 
            y="30" 
            width="24" 
            height="24" 
            rx="6" 
            fill="url(#emptyGradient2)"
            className="animate-in fade-in-0 slide-in-from-right-4 duration-700 delay-200"
            style={{ animation: 'float 6s ease-in-out infinite 2s' }}
          />
          <polygon 
            points="100,20 120,60 80,60" 
            fill="url(#emptyGradient)"
            className="animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-300"
            style={{ animation: 'float 6s ease-in-out infinite 4s' }}
          />
          
          {/* Central icon area */}
          <circle 
            cx="100" 
            cy="100" 
            r="30" 
            fill="url(#emptyGradient)" 
            opacity="0.1"
            className="animate-in fade-in-0 scale-in-0 duration-700 delay-400"
          />
          
          {/* Custom icon or default */}
          {icon ? (
            <foreignObject x="85" y="85" width="30" height="30" className="animate-in fade-in-0 scale-in-0 duration-700 delay-500">
              <div className="flex items-center justify-center w-full h-full text-primary">
                {icon}
              </div>
            </foreignObject>
          ) : (
            <circle 
              cx="100" 
              cy="100" 
              r="8" 
              fill="url(#emptyGradient)"
              className="animate-in fade-in-0 scale-in-0 duration-700 delay-500"
            />
          )}
          
          {/* Connecting lines */}
          <path 
            d="M62,62 Q81,81 85,92" 
            stroke="url(#emptyGradient)" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.3"
            className="animate-in fade-in-0 duration-700 delay-600"
          />
          <path 
            d="M138,54 Q119,73 115,92" 
            stroke="url(#emptyGradient2)" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.3"
            className="animate-in fade-in-0 duration-700 delay-700"
          />
        </svg>
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-foreground mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-800">
        {title}
      </h3>
      
      {/* Message */}
      <p className="text-lg text-muted-foreground leading-relaxed max-w-md animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-900">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;