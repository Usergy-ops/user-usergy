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
            Welcome to your Explorer Dashboard, <span className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">{userName}</span>!
          </h1>
          <p className="text-muted-foreground">
            Discover new missions, track your progress, and earn rewards.
          </p>
        </div>
        
        {/* The Constellation Network Illustration */}
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
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Pulse gradient for company nodes */}
              <radialGradient id="companyPulse">
                <stop offset="0%" stopColor="#00C6FB" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00C6FB" stopOpacity="0" />
              </radialGradient>
              
              {/* Explorer pulse gradient */}
              <radialGradient id="explorerPulse">
                <stop offset="0%" stopColor="#005BEA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#005BEA" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Background constellation glow */}
            <g opacity="0.1">
              <circle cx="100" cy="100" r="80" fill="url(#usergyGradient)" />
            </g>
            
            {/* Company Nodes (Larger) */}
            <g id="company-nodes">
              {/* Company 1 - Top Left */}
              <g transform="translate(40, 60)" className="cursor-pointer transition-transform duration-300 hover:scale-125">
                <circle cx="0" cy="0" r="20" fill="url(#companyPulse)" className="animate-pulse transition-all duration-300 hover:r-25" />
                <circle cx="0" cy="0" r="12" fill="url(#usergyGradient)" filter="url(#glow)" className="transition-all duration-300 hover:r-15" />
                <circle cx="0" cy="0" r="8" fill="white" opacity="0.9" className="transition-all duration-300 hover:r-10" />
                {/* Company icon */}
                <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#00C6FB" className="transition-all duration-300 hover:fill-white" />
              </g>
              
              {/* Company 2 - Top Right */}
              <g transform="translate(160, 50)" className="cursor-pointer transition-transform duration-300 hover:scale-125">
                <circle cx="0" cy="0" r="18" fill="url(#companyPulse)" className="animate-pulse transition-all duration-300 hover:r-23" style={{animationDelay: '1s'}} />
                <circle cx="0" cy="0" r="10" fill="url(#usergyGradient)" filter="url(#glow)" className="transition-all duration-300 hover:r-13" />
                <circle cx="0" cy="0" r="6" fill="white" opacity="0.9" className="transition-all duration-300 hover:r-8" />
                {/* Company icon */}
                <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill="#005BEA" className="transition-all duration-300 hover:fill-white" />
              </g>
              
              {/* Company 3 - Bottom */}
              <g transform="translate(80, 150)" className="cursor-pointer transition-transform duration-300 hover:scale-125">
                <circle cx="0" cy="0" r="22" fill="url(#companyPulse)" className="animate-pulse transition-all duration-300 hover:r-27" style={{animationDelay: '2s'}} />
                <circle cx="0" cy="0" r="14" fill="url(#usergyGradient)" filter="url(#glow)" className="transition-all duration-300 hover:r-17" />
                <circle cx="0" cy="0" r="10" fill="white" opacity="0.9" className="transition-all duration-300 hover:r-12" />
                {/* Company icon */}
                <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#00C6FB" className="transition-all duration-300 hover:fill-white" />
              </g>
            </g>
            
            {/* Explorer Nodes (Smaller) */}
            <g id="explorer-nodes">
              {/* Explorer 1 */}
              <g transform="translate(70, 40)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150">
                <circle cx="0" cy="0" r="8" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-10" />
                <circle cx="0" cy="0" r="4" fill="#005BEA" filter="url(#glow)" className="transition-all duration-300 hover:r-6" />
                <circle cx="0" cy="0" r="2" fill="white" className="transition-all duration-300 hover:r-3" />
              </g>
              
              {/* Explorer 2 */}
              <g transform="translate(130, 80)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150" style={{animationDelay: '0.5s'}}>
                <circle cx="0" cy="0" r="6" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-8" />
                <circle cx="0" cy="0" r="3" fill="#00C6FB" filter="url(#glow)" className="transition-all duration-300 hover:r-5" />
                <circle cx="0" cy="0" r="1.5" fill="white" className="transition-all duration-300 hover:r-2.5" />
              </g>
              
              {/* Explorer 3 */}
              <g transform="translate(50, 120)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150" style={{animationDelay: '1s'}}>
                <circle cx="0" cy="0" r="7" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-9" />
                <circle cx="0" cy="0" r="3.5" fill="#005BEA" filter="url(#glow)" className="transition-all duration-300 hover:r-5.5" />
                <circle cx="0" cy="0" r="2" fill="white" className="transition-all duration-300 hover:r-3" />
              </g>
              
              {/* Explorer 4 */}
              <g transform="translate(140, 130)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150" style={{animationDelay: '1.5s'}}>
                <circle cx="0" cy="0" r="5" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-7" />
                <circle cx="0" cy="0" r="2.5" fill="#00C6FB" filter="url(#glow)" className="transition-all duration-300 hover:r-4" />
                <circle cx="0" cy="0" r="1.5" fill="white" className="transition-all duration-300 hover:r-2.5" />
              </g>
              
              {/* Explorer 5 */}
              <g transform="translate(110, 45)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150" style={{animationDelay: '2s'}}>
                <circle cx="0" cy="0" r="6" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-8" />
                <circle cx="0" cy="0" r="3" fill="#005BEA" filter="url(#glow)" className="transition-all duration-300 hover:r-5" />
                <circle cx="0" cy="0" r="1.5" fill="white" className="transition-all duration-300 hover:r-2.5" />
              </g>
              
              {/* Explorer 6 */}
              <g transform="translate(170, 100)" className="animate-float cursor-pointer transition-transform duration-300 hover:scale-150" style={{animationDelay: '2.5s'}}>
                <circle cx="0" cy="0" r="7" fill="url(#explorerPulse)" className="animate-pulse transition-all duration-300 hover:r-9" />
                <circle cx="0" cy="0" r="3.5" fill="#00C6FB" filter="url(#glow)" className="transition-all duration-300 hover:r-5.5" />
                <circle cx="0" cy="0" r="2" fill="white" className="transition-all duration-300 hover:r-3" />
              </g>
            </g>
            
            {/* Constellation Connections */}
            <g id="connections" stroke="url(#usergyGradient)" strokeWidth="1" fill="none" opacity="0.6">
              {/* Main constellation lines */}
              <path d="M40,60 L70,40 L130,80 L160,50" strokeDasharray="2,3" className="animate-dash" />
              <path d="M40,60 L50,120 L80,150" strokeDasharray="2,3" className="animate-dash" style={{animationDelay: '1s'}} />
              <path d="M160,50 L170,100 L140,130 L80,150" strokeDasharray="2,3" className="animate-dash" style={{animationDelay: '2s'}} />
              <path d="M130,80 L110,45 L160,50" strokeDasharray="2,3" className="animate-dash" style={{animationDelay: '0.5s'}} />
              <path d="M50,120 L140,130 L170,100" strokeDasharray="2,3" className="animate-dash" style={{animationDelay: '1.5s'}} />
            </g>
            
            {/* Interactive hover connections */}
            <g id="hover-connections">
              <line x1="70" y1="40" x2="50" y2="120" 
                    stroke="#00C6FB" strokeWidth="1" opacity="0.3" filter="url(#glow)"
                    className="transition-all duration-300 hover:opacity-80 hover:stroke-[2]" />
              
              <line x1="110" y1="45" x2="140" y2="130" 
                    stroke="#005BEA" strokeWidth="1" opacity="0.3" filter="url(#glow)"
                    className="transition-all duration-300 hover:opacity-80 hover:stroke-[2]" />
              
              <path d="M130,80 Q100,100 80,150" 
                    stroke="#00C6FB" strokeWidth="1" opacity="0.3" filter="url(#glow)"
                    className="transition-all duration-300 hover:opacity-80 hover:stroke-[2]" />
            </g>
            
            {/* Central Energy Hub */}
            <g transform="translate(100, 100)">
              <circle cx="0" cy="0" r="25" fill="url(#usergyGradient)" opacity="0.1" className="animate-pulse" />
              <circle cx="0" cy="0" r="6" fill="url(#usergyGradient)" filter="url(#glow)" />
              <circle cx="0" cy="0" r="3" fill="white" opacity="0.8" />
              {/* Usergy logo symbol */}
              <g opacity="0.8">
                <circle cx="-2" cy="-1" r="1" fill="#00C6FB" />
                <circle cx="2" cy="-1" r="1" fill="#005BEA" />
                <circle cx="0" cy="2" r="1" fill="#00C6FB" />
              </g>
            </g>
            
            {/* Floating constellation stars */}
            <g id="constellation-stars" className="animate-twinkle">
              <g transform="translate(25, 30)">
                <path d="M0,-2 L0.5,-0.5 L2,0 L0.5,0.5 L0,2 L-0.5,0.5 L-2,0 L-0.5,-0.5 Z" 
                      fill="#00C6FB" opacity="0.6" />
              </g>
              
              <g transform="translate(175, 75)" style={{animationDelay: '1s'}}>
                <path d="M0,-1.5 L0.4,-0.4 L1.5,0 L0.4,0.4 L0,1.5 L-0.4,0.4 L-1.5,0 L-0.4,-0.4 Z" 
                      fill="#005BEA" opacity="0.5" />
              </g>
              
              <g transform="translate(30, 170)" style={{animationDelay: '2s'}}>
                <path d="M0,-1 L0.3,-0.3 L1,0 L0.3,0.3 L0,1 L-0.3,0.3 L-1,0 L-0.3,-0.3 Z" 
                      fill="#00C6FB" opacity="0.4" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
