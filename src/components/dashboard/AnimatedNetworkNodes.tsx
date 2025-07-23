
import React from 'react';

export const AnimatedNetworkNodes: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {/* Animated connection lines */}
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C6FB" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#005BEA" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Network nodes and connections */}
        <g className="animate-pulse">
          <circle cx="20%" cy="30%" r="4" fill="#00C6FB" className="animate-bounce" style={{animationDelay: '0s'}} />
          <circle cx="80%" cy="20%" r="3" fill="#005BEA" className="animate-pulse" style={{animationDelay: '0.5s'}} />
          <circle cx="60%" cy="80%" r="5" fill="#00C6FB" className="animate-bounce" style={{animationDelay: '1s'}} />
          <circle cx="30%" cy="70%" r="2" fill="#005BEA" className="animate-pulse" style={{animationDelay: '1.5s'}} />
          
          <line 
            x1="20%" y1="30%" 
            x2="80%" y2="20%" 
            stroke="url(#connectionGradient)" 
            strokeWidth="1"
            className="animate-pulse"
            filter="url(#glow)"
          />
          <line 
            x1="80%" y1="20%" 
            x2="60%" y2="80%" 
            stroke="url(#connectionGradient)" 
            strokeWidth="1"
            className="animate-pulse"
            style={{animationDelay: '0.5s'}}
            filter="url(#glow)"
          />
          <line 
            x1="60%" y1="80%" 
            x2="30%" y2="70%" 
            stroke="url(#connectionGradient)" 
            strokeWidth="1"
            className="animate-pulse"
            style={{animationDelay: '1s'}}
            filter="url(#glow)"
          />
        </g>
      </svg>
    </div>
  );
};
