
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
import { CompletionCelebration } from './profile-completion/CompletionCelebration';
import { Loader2, User, Smartphone, GraduationCap, Brain, Share2, Star } from 'lucide-react';

const ProfileCompletion = () => {
  const { profileCompletion, profileData, loading, updating } = useProfileCompletion();
  const [activeSection, setActiveSection] = useState(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-start to-primary-end rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground mb-2">Loading your profile...</p>
            <p className="text-lg text-muted-foreground">Preparing your personalized experience</p>
          </div>
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
      fieldsComplete: calculateSectionProgress(1, profileData),
      totalFields: 8
    },
    {
      id: 2,
      title: 'Devices & Products',
      description: 'Technology preferences and usage',
      icon: Smartphone,
      completed: profileCompletion?.section_2_completed || false,
      fieldsComplete: calculateSectionProgress(2, profileData),
      totalFields: 5
    },
    {
      id: 3,
      title: 'Education & Work',
      description: 'Professional background and expertise',
      icon: GraduationCap,
      completed: profileCompletion?.section_3_completed || false,
      fieldsComplete: calculateSectionProgress(3, profileData),
      totalFields: 8
    },
    {
      id: 4,
      title: 'AI & Tech Fluency',
      description: 'Technical skills and AI experience',
      icon: Brain,
      completed: profileCompletion?.section_4_completed || false,
      fieldsComplete: calculateSectionProgress(4, profileData),
      totalFields: 5
    },
    {
      id: 5,
      title: 'Social Presence',
      description: 'Professional networks and profiles',
      icon: Share2,
      completed: profileCompletion?.section_5_completed || false,
      fieldsComplete: calculateSectionProgress(5, profileData),
      totalFields: 4
    },
    {
      id: 6,
      title: 'Skills & Interests',
      description: 'Personal interests and bio',
      icon: Star,
      completed: profileCompletion?.section_6_completed || false,
      fieldsComplete: calculateSectionProgress(6, profileData),
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
      <CompletionCelebration
        onContinue={() => window.location.href = '/dashboard'}
      />
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
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-start to-primary-end rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                      <span className="text-xl font-semibold">Saving your progress...</span>
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

// Helper function to calculate section progress
const calculateSectionProgress = (section: number, data: any) => {
  if (!data) return 0;
  
  switch (section) {
    case 1:
      return [
        data.full_name,
        data.country,
        data.city,
        data.phone_number,
        data.date_of_birth,
        data.gender,
        data.timezone,
        data.avatar_url
      ].filter(Boolean).length;
    case 2:
      return [
        data.operating_systems?.length,
        data.devices_owned?.length,
        data.mobile_manufacturers?.length,
        data.email_clients?.length,
        data.streaming_subscriptions?.length
      ].filter(Boolean).length;
    case 3:
      return [
        data.education_level,
        data.field_of_study,
        data.job_title,
        data.employer,
        data.industry,
        data.work_role,
        data.company_size,
        data.household_income_range
      ].filter(Boolean).length;
    case 4:
      return [
        data.technical_experience_level,
        data.ai_familiarity_level,
        data.ai_interests?.length,
        data.ai_models_used?.length,
        data.coding_experience_years
      ].filter(Boolean).length;
    case 5:
      return [
        data.linkedin_url,
        data.twitter_url,
        data.github_url,
        data.portfolio_url
      ].filter(Boolean).length;
    case 6:
      return [
        data.interests?.length,
        data.bio
      ].filter(Boolean).length;
    default:
      return 0;
  }
};

export default ProfileCompletion;
