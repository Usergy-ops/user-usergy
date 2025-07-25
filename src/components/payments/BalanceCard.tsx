import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BalanceCardProps {
  balance: number;
  onPayoutClick: () => void;
  isLoading?: boolean;
}

const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;
      
      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  onPayoutClick,
  isLoading = false
}) => {
  const animatedBalance = useCountUp(balance, 1500);
  const circumference = 2 * Math.PI * 36;
  const progressPercentage = Math.min((balance / 10) * 100, 100);
  const offset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-border/50 shadow-lg mb-8">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary to-primary/60 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-primary/60 to-primary rounded-full filter blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Balance display */}
        <div className="mb-6 md:mb-0">
          <p className="text-muted-foreground mb-2 text-lg">Available Balance</p>
          <div className="flex items-baseline mb-4">
            <span className="text-2xl text-muted-foreground mr-1">$</span>
            <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {animatedBalance}
            </span>
          </div>
          
          {/* Payout button */}
          <Button
            onClick={onPayoutClick}
            disabled={balance < 10 || isLoading}
            className={`group relative px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              balance >= 10 && !isLoading
                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {/* Gradient shift on hover */}
            {balance >= 10 && !isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            )}
            
            <div className="relative flex items-center space-x-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              <span>
                {isLoading 
                  ? 'Processing...' 
                  : balance < 10 
                    ? 'Request Payout (Min. $10)' 
                    : 'Request Payout'
                }
              </span>
            </div>
          </Button>
        </div>

        {/* Progress ring */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                </linearGradient>
              </defs>
              <circle
                cx="48" cy="48" r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48" cy="48" r="36"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-foreground">
                ${balance}/$10
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Progress to minimum payout
          </p>
        </div>
      </div>
    </div>
  );
};