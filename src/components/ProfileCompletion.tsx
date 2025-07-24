import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileSection1 } from './profile-sections/ProfileSection1';
import { ProfileSection2 } from './profile-sections/ProfileSection2';
import { ProfileSection3 } from './profile-sections/ProfileSection3';
import { ProfileSection4 } from './profile-sections/ProfileSection4';
import { ProfileSection5 } from './profile-sections/ProfileSection5';
import { ProfileSection6 } from './profile-sections/ProfileSection6';
import { PremiumHeader } from './profile-completion/PremiumHeader';
import { StepSidebar } from './profile-completion/StepSidebar';
import { PremiumCard } from './profile-completion/PremiumCard';
import { Loader2, Sparkles, Trophy, PartyPopper, User, Smartphone, GraduationCap, Brain, Share2, Star } from 'lucide-react';

const ProfileCompletion = () => {
  const { profileCompletion, profileData, loading, updating } = useProfileCompletion();
  const [activeSection, setActiveSection] = useState(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
          </div>
          <p className="text-lg font-medium text-foreground">Loading your profile...</p>
          <p className="text-sm text-muted-foreground">Preparing your personalized experience</p>
        </motion.div>
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Personal details and contact info',
      icon: User,
      completed: profileCompletion?.section_1_completed || false,
      fieldsComplete: profileData?.full_name ? 6 : 0,
      totalFields: 8
    },
    {
      id: 2,
      title: 'Devices & Products',
      description: 'Technology preferences and usage',
      icon: Smartphone,
      completed: profileCompletion?.section_2_completed || false,
      fieldsComplete: profileData?.operating_systems?.length || 0,
      totalFields: 5
    },
    {
      id: 3,
      title: 'Education & Work',
      description: 'Professional background and expertise',
      icon: GraduationCap,
      completed: profileCompletion?.section_3_completed || false,
      fieldsComplete: profileData?.education_level ? 4 : 0,
      totalFields: 8
    },
    {
      id: 4,
      title: 'AI & Tech Fluency',
      description: 'Technical skills and AI experience',
      icon: Brain,
      completed: profileCompletion?.section_4_completed || false,
      fieldsComplete: profileData?.technical_experience_level ? 3 : 0,
      totalFields: 5
    },
    {
      id: 5,
      title: 'Social Presence',
      description: 'Professional networks and profiles',
      icon: Share2,
      completed: profileCompletion?.section_5_completed || false,
      fieldsComplete: profileData?.linkedin_url ? 2 : 0,
      totalFields: 4
    },
    {
      id: 6,
      title: 'Skills & Interests',
      description: 'Personal interests and bio',
      icon: Star,
      completed: profileCompletion?.section_6_completed || false,
      fieldsComplete: profileData?.interests?.length || 0,
      totalFields: 2
    }
  ];

  const completionPercentage = profileCompletion?.overall_completion_percentage || 0;
  const isFullyComplete = completionPercentage === 100;

  // Calculate estimated time remaining
  const remainingSteps = steps.filter(step => !step.completed).length;
  const estimatedTimeRemaining = remainingSteps * 3; // 3 minutes per section

  const renderSection = () => {
    const sectionProps = { data: profileData };
    
    switch (activeSection) {
      case 1:
        return <ProfileSection1 {...sectionProps} />;
      case 2:
        return <ProfileSection2 {...sectionProps} />;
      case 3:
        return <ProfileSection3 {...sectionProps} />;
      case 4:
        return <ProfileSection4 {...sectionProps} />;
      case 5:
        return <ProfileSection5 {...sectionProps} />;
      case 6:
        return <ProfileSection6 {...sectionProps} />;
      default:
        return null;
    }
  };

  // Full completion celebration
  if (isFullyComplete) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Confetti Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-white rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  scale: 0
                }}
                animate={{
                  y: window.innerHeight + 20,
                  scale: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          <PremiumCard className="p-12 bg-white/95 backdrop-blur-sm border-white/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Trophy className="w-24 h-24 text-yellow-500" />
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Profile Complete!
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Congratulations! Your Explorer profile is now complete and optimized for the best experience.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">6/6</div>
                  <div className="text-sm text-gray-600">Sections Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-sm text-gray-600">Profile Strength</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Premium</div>
                  <div className="text-sm text-gray-600">Status Unlocked</div>
                </div>
              </div>

              <motion.button
                className="bg-gradient-to-r from-primary-start to-primary-end text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/dashboard'}
              >
                Continue to Dashboard
              </motion.button>
            </motion.div>
          </PremiumCard>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Header */}
      <PremiumHeader
        completionPercentage={completionPercentage}
        currentSection={activeSection}
        totalSections={6}
        estimatedTimeRemaining={estimatedTimeRemaining}
      />

      {/* Main Layout */}
      <div className="flex min-h-[calc(100vh-120px)]">
        {/* Step Sidebar */}
        <StepSidebar
          steps={steps}
          activeStep={activeSection}
          onStepClick={setActiveSection}
        />

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <PremiumCard className="p-8 relative overflow-hidden" hover gradient>
              {/* Loading Overlay */}
              <AnimatePresence>
                {updating && (
                  <motion.div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-lg font-medium">Saving your progress...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderSection()}
                </motion.div>
              </AnimatePresence>
            </PremiumCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
