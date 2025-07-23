import React from 'react';
import { cn } from '@/lib/utils';

interface AuthToggleProps {
  mode: 'signup' | 'signin';
  onToggle: (mode: 'signup' | 'signin') => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({ mode, onToggle }) => {
  return (
    <div className="relative bg-muted rounded-2xl p-1 grid grid-cols-2 gap-1 max-w-sm mx-auto">
      {/* Background slider */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-1/2 bg-background rounded-xl usergy-shadow-medium transition-transform duration-300 ease-out",
          mode === 'signin' && "translate-x-full"
        )}
      />
      
      {/* Sign Up Tab */}
      <button
        onClick={() => onToggle('signup')}
        className={cn(
          "relative z-10 px-6 py-3 text-sm font-semibold rounded-xl transition-colors duration-300",
          mode === 'signup' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Join Us
      </button>
      
      {/* Sign In Tab */}
      <button
        onClick={() => onToggle('signin')}
        className={cn(
          "relative z-10 px-6 py-3 text-sm font-semibold rounded-xl transition-colors duration-300",
          mode === 'signin' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Welcome Back
      </button>
    </div>
  );
};