
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className,
  hover = false,
  gradient = false
}) => {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border backdrop-blur-sm transition-all duration-300",
        gradient
          ? "bg-gradient-to-br from-card/80 to-card/60 border-border/50"
          : "bg-card/80 border-border/50",
        hover && "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
        className
      )}
      whileHover={hover ? { y: -2 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
