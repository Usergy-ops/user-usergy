
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Clock } from 'lucide-react';

interface PremiumHeaderProps {
  completionPercentage: number;
  currentSection: number;
  totalSections: number;
  estimatedTimeRemaining: number;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  completionPercentage,
  currentSection,
  totalSections,
  estimatedTimeRemaining
}) => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary-start to-primary-end p-6 backdrop-blur-sm">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-6">
            <div className="text-white">
              <h1 className="text-2xl font-bold">Usergy</h1>
              <p className="text-sm text-white/80">Explorer Onboarding</p>
            </div>
            
            {/* Progress Ring */}
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - completionPercentage / 100) }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-white font-bold text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {completionPercentage}%
                </motion.span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-8 text-white/90">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span className="text-sm">
                Section {currentSection} of {totalSections}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">
                ~{estimatedTimeRemaining} min remaining
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
};
