import React from 'react';
import { Button } from '@/components/ui/button';

interface SuccessStateProps {
  onContinue: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ onContinue }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="text-center animate-in fade-in-0 zoom-in-95 duration-500">
      <div className="mb-6">
        <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200">
          {/* Trophy with particles */}
          <defs>
            <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
          </defs>
          <g className="animate-bounce" style={{ animationDuration: '2s' }}>
            {/* Trophy cup */}
            <path d="M70 120 L130 120 L125 180 L75 180 Z" fill="url(#trophyGradient)" />
            <ellipse cx="100" cy="120" rx="30" ry="15" fill="url(#trophyGradient)" />
            <path d="M60 110 Q50 100 60 90 L70 100" fill="url(#trophyGradient)" />
            <path d="M140 110 Q150 100 140 90 L130 100" fill="url(#trophyGradient)" />
            <rect x="90" y="180" width="20" height="15" fill="url(#trophyGradient)" />
            
            {/* Particle effects */}
            {[...Array(6)].map((_, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r="3"
                fill={i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)'}
                className="animate-ping"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  transformOrigin: '100px 100px',
                  transform: `rotate(${i * 60}deg) translateY(-40px)`
                }}
              />
            ))}
          </g>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Payout Requested!
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your gift card will be sent to your registered email within 48-72 hours
      </p>
      <Button 
        onClick={onContinue}
        className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg transition-all duration-300"
      >
        Continue
      </Button>
    </div>
  </div>
);