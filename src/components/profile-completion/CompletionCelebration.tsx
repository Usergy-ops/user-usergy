
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Star, CheckCircle, ArrowRight, PartyPopper } from 'lucide-react';
import { PremiumCard } from './PremiumCard';
import { cn } from '@/lib/utils';

interface CompletionCelebrationProps {
  onContinue: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({ onContinue }) => {
  // Animated background particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 3,
  }));

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-white/30 rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 20 - 10, 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-2 h-2 bg-white/60 rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <PremiumCard className="p-12 bg-white/95 backdrop-blur-sm border-white/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
          >
            {/* Trophy Icon with Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Trophy className="w-16 h-16 text-white" />
                </motion.div>
                
                {/* Sparkles around trophy */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${50 + 60 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      top: `${50 + 60 * Math.sin((i * Math.PI * 2) / 8)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Main Title */}
            <motion.h1
              className="text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              🎉 Profile Complete!
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Congratulations! Your Explorer profile is now complete and optimized for the best experience. 
              You've unlocked premium features and personalized recommendations.
            </motion.p>

            {/* Achievement Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">6/6</div>
                <div className="text-sm text-gray-600">Sections Complete</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-gray-600">Profile Strength</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PartyPopper className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">Premium</div>
                <div className="text-sm text-gray-600">Status Unlocked</div>
              </div>
            </motion.div>

            {/* Benefits Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {[
                'Personalized AI recommendations',
                'Priority access to new features',
                'Enhanced profile visibility',
                'Exclusive community access',
                'Advanced analytics dashboard',
                'Premium support priority'
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Continue Button */}
            <motion.button
              onClick={onContinue}
              className={cn(
                "px-10 py-4 rounded-xl font-semibold text-xl shadow-lg transition-all duration-300",
                "bg-gradient-to-r from-primary-start to-primary-end text-white",
                "hover:shadow-xl hover:scale-105 group"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center space-x-3">
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </motion.div>
        </PremiumCard>
      </div>
    </motion.div>
  );
};
