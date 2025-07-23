import React, { useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileProgressBar } from '@/components/profile/ProfileProgressBar';
import { BasicProfileSection } from '@/components/profile/BasicProfileSection';
import { DevicesSection } from '@/components/profile/DevicesSection';
import { EducationWorkSection } from '@/components/profile/EducationWorkSection';
import { TechFluencySection } from '@/components/profile/TechFluencySection';
import { SocialPresenceSection } from '@/components/profile/SocialPresenceSection';
import { SkillsInterestsSection } from '@/components/profile/SkillsInterestsSection';
import { CompletionCelebration } from '@/components/profile/CompletionCelebration';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ProfileCompletion = () => {
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    isProfileComplete, 
    profileData, 
    loading,
    calculateCompletion 
  } = useProfile();

  useEffect(() => {
    if (user) {
      calculateCompletion();
    }
  }, [user, calculateCompletion]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isProfileComplete) {
    return <CompletionCelebration />;
  }

  const sections = [
    { id: 1, title: "Basic Profile", component: <BasicProfileSection /> },
    { id: 2, title: "Devices & Tech", component: <DevicesSection /> },
    { id: 3, title: "Education & Work", component: <EducationWorkSection /> },
    { id: 4, title: "AI & Tech Fluency", component: <TechFluencySection /> },
    { id: 5, title: "Social Presence", component: <SocialPresenceSection /> },
    { id: 6, title: "Skills & Interests", component: <SkillsInterestsSection /> }
  ];

  const currentSection = sections.find(s => s.id === currentStep);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === sections.length;

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Progress Bar */}
      <ProfileProgressBar 
        currentStep={currentStep}
        totalSteps={sections.length}
        completionPercentage={profileData.completion_percentage || 0}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-start to-primary-end rounded-xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <path d="M8.5 14l7-4" stroke="white" strokeWidth="2" />
                  <path d="M8.5 10l7 4" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                Usergy
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Complete Your Explorer Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us understand your unique expertise so we can match you with the perfect projects. 
              This process takes about 5-10 minutes and ensures high-quality matches.
            </p>
          </div>

          {/* Section Content */}
          <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 lg:p-12 border border-border/50 animate-slide-up">
            
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {currentSection?.title}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of {sections.length}
                </div>
              </div>
              
              {/* Mini Progress for Current Section */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-start to-primary-end h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / sections.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Section Component */}
            <div className="mb-8">
              {currentSection?.component}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {profileData.completion_percentage || 0}% complete
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLastStep ? "Almost done!" : `${sections.length - currentStep} more steps`}
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={isLastStep}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Save Notice */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Your progress is automatically saved every 10 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;