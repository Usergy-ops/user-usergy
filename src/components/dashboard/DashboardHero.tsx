import React from 'react';

interface DashboardHeroProps {
  userName: string;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ userName }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background/80 to-primary/5 rounded-2xl p-8 mb-8 shadow-lg shadow-primary/5 border-b border-gradient-to-r from-transparent via-primary/10 to-transparent">
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
        
        {/* The Feedback Bridge Illustration */}
        <div className="hidden md:block">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
              {/* Usergy gradient */}
              <linearGradient id="usergyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C6FB" />
                <stop offset="100%" stopColor="#005BEA" />
              </linearGradient>
              
              {/* Glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Pulse animation gradient */}
              <radialGradient id="pulseGradient">
                <stop offset="0%" stopColor="#00C6FB" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00C6FB" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Company Side (Left) */}
            <g id="company-side" opacity="0.8">
              {/* Product representation */}
              <rect x="20" y="70" width="50" height="60" rx="8" 
                    fill="none" stroke="#6B7280" strokeWidth="2" />
              
              {/* Screen inside product */}
              <rect x="25" y="75" width="40" height="35" rx="4" fill="#E5E7EB" />
              
              {/* Question marks seeking feedback */}
              <g className="animate-float">
                <text x="35" y="95" fontSize="14" fill="#6B7280" opacity="0.7">?</text>
                <text x="50" y="100" fontSize="12" fill="#6B7280" opacity="0.5">?</text>
                <text x="30" y="105" fontSize="10" fill="#6B7280" opacity="0.4">?</text>
              </g>
              
              {/* Signal waves */}
              <g className="animate-pulse">
                <circle cx="45" cy="100" r="15" fill="none" stroke="#6B7280" 
                        strokeWidth="1" opacity="0.3" />
                <circle cx="45" cy="100" r="25" fill="none" stroke="#6B7280" 
                        strokeWidth="1" opacity="0.2" />
                <circle cx="45" cy="100" r="35" fill="none" stroke="#6B7280" 
                        strokeWidth="1" opacity="0.1" />
              </g>
            </g>
            
            {/* The Bridge (Center) */}
            <g id="feedback-bridge">
              {/* Main connection path */}
              <path d="M70,100 Q100,80 130,100" 
                    stroke="url(#usergyGradient)" 
                    strokeWidth="3" 
                    fill="none"
                    opacity="0.8" />
              
              {/* Animated data particles */}
              <g className="animate-flow">
                {/* Particle 1 */}
                <circle r="3" fill="#00C6FB" filter="url(#glow)">
                  <animateMotion dur="3s" repeatCount="indefinite">
                    <mpath href="#particle-path-1" />
                  </animateMotion>
                </circle>
                
                {/* Particle 2 */}
                <circle r="2.5" fill="#005BEA" filter="url(#glow)">
                  <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
                    <mpath href="#particle-path-1" />
                  </animateMotion>
                </circle>
                
                {/* Particle 3 */}
                <circle r="2" fill="#00C6FB" filter="url(#glow)">
                  <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
                    <mpath href="#particle-path-1" />
                  </animateMotion>
                </circle>
              </g>
              
              {/* Hidden path for particle animation */}
              <path id="particle-path-1" d="M70,100 Q100,80 130,100" fill="none" />
              
              {/* Center node - Usergy logo mark */}
              <g transform="translate(100, 90)">
                <circle cx="0" cy="0" r="12" fill="white" stroke="url(#usergyGradient)" 
                        strokeWidth="2" />
                <circle cx="-4" cy="0" r="2" fill="#00C6FB" />
                <circle cx="4" cy="-4" r="2" fill="#005BEA" />
                <circle cx="4" cy="4" r="2" fill="#00C6FB" />
                <path d="M-4,0 L4,-4 L4,4" stroke="url(#usergyGradient)" 
                      strokeWidth="1" fill="none" opacity="0.5" />
              </g>
            </g>
            
            {/* Explorer Side (Right) */}
            <g id="explorer-side">
              {/* Explorer avatar */}
              <g transform="translate(145, 100)">
                {/* Head */}
                <circle cx="0" cy="-10" r="12" fill="#4B5563" />
                
                {/* Headphones */}
                <path d="M-12,-10 Q0,-25 12,-10" 
                      stroke="#00C6FB" strokeWidth="3" fill="none" />
                <rect x="-14" y="-12" width="4" height="8" rx="2" fill="#00C6FB" />
                <rect x="10" y="-12" width="4" height="8" rx="2" fill="#00C6FB" />
                
                {/* Body with laptop */}
                <ellipse cx="0" cy="10" rx="15" ry="20" fill="#6B7280" />
                <rect x="-10" y="5" width="20" height="12" rx="2" fill="#1F2937" />
                <rect x="-8" y="7" width="16" height="8" rx="1" fill="#00C6FB" opacity="0.8" />
              </g>
              
              {/* Insight indicators */}
              <g className="animate-twinkle">
                {/* Lightbulb */}
                <g transform="translate(170, 70)">
                  <path d="M0,-8 Q-3,-3 -3,0 Q-3,3 0,3 Q3,3 3,0 Q3,-3 0,-8" 
                        fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
                  <rect x="-2" y="3" width="4" height="3" fill="#F59E0B" />
                  <line x1="-1" y1="6" x2="-1" y2="8" stroke="#F59E0B" strokeWidth="0.5" />
                  <line x1="1" y1="6" x2="1" y2="8" stroke="#F59E0B" strokeWidth="0.5" />
                </g>
                
                {/* Star insights */}
                <g transform="translate(125, 70)">
                  <path d="M0,-5 L1.5,-1.5 L5,-1 L2.5,1.5 L3,5 L0,3 L-3,5 L-2.5,1.5 L-5,-1 L-1.5,-1.5 Z" 
                        fill="#00C6FB" opacity="0.8" />
                </g>
                
                <g transform="translate(165, 85)" style={{animationDelay: '0.5s'}}>
                  <path d="M0,-3 L1,-1 L3,-0.5 L1.5,1 L2,3 L0,2 L-2,3 L-1.5,1 L-3,-0.5 L-1,-1 Z" 
                        fill="#005BEA" opacity="0.6" />
                </g>
              </g>
              
              {/* Completed/Active indicator */}
              <g className="animate-pulse-slow">
                <circle cx="145" cy="100" r="30" fill="url(#pulseGradient)" />
              </g>
            </g>
            
            {/* Floating UI elements showing value exchange */}
            <g id="value-indicators" opacity="0.8">
              {/* Gift card icon (rewards) */}
              <g transform="translate(30, 140)" className="animate-float" style={{animationDelay: '1s'}}>
                <rect x="0" y="0" width="25" height="15" rx="2" fill="#10B981" />
                <text x="12.5" y="10" fontSize="8" fill="white" textAnchor="middle">$</text>
              </g>
              
              {/* Check mark (quality) */}
              <g transform="translate(145, 140)" className="animate-float" style={{animationDelay: '2s'}}>
                <circle cx="10" cy="10" r="10" fill="#10B981" />
                <path d="M5,10 L9,14 L15,6" stroke="white" strokeWidth="2" 
                      fill="none" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;