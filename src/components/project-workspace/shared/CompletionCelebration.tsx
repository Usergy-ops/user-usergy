import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'milestone' | 'project';
  title: string;
  description?: string;
  reward?: number;
}

const ParticleEffect: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      setParticles(Array.from({ length: 12 }, (_, i) => i));
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full animate-particle"
          style={{
            left: '50%',
            top: '50%',
            animationDelay: `${i * 0.1}s`,
            '--angle': `${i * 30}deg`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  isOpen,
  onClose,
  type,
  title,
  description,
  reward
}) => {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowParticles(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case 'task':
        return CheckCircle;
      case 'milestone':
        return Star;
      case 'project':
        return Trophy;
      default:
        return CheckCircle;
    }
  };

  const Icon = getIcon();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center relative overflow-hidden">
        <ParticleEffect trigger={showParticles} />
        
        <div className="relative z-10 space-y-6 py-6">
          {/* Animated Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-full flex items-center justify-center animate-bounce-in">
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Reward Display */}
          {reward && (
            <div className="bg-gradient-to-r from-[#00C6FB]/10 to-[#005BEA]/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">+${reward} Earned!</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white hover:scale-105 transition-transform duration-200"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};