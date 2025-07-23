
import React, { useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BasicProfileSection } from '@/components/profile/BasicProfileSection';
import { DevicesSection } from '@/components/profile/DevicesSection';
import { EducationWorkSection } from '@/components/profile/EducationWorkSection';
import { TechFluencySection } from '@/components/profile/TechFluencySection';
import { SocialPresenceSection } from '@/components/profile/SocialPresenceSection';
import { SkillsInterestsSection } from '@/components/profile/SkillsInterestsSection';
import { ChevronLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ProfileCompletion = () => {
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    loading
  } = useProfile();

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

  const sections = [
    { id: 1, title: "Basic Profile" },
    { id: 2, title: "Devices & Tech" },
    { id: 3, title: "Education & Work" },
    { id: 4, title: "AI & Tech Fluency" },
    { id: 5, title: "Social Presence" },
    { id: 6, title: "Skills & Interests" }
  ];

  const currentSection = sections.find(s => s.id === currentStep);
  const isFirstStep = currentStep === 1;

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
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

            {/* Section Component - Direct rendering with unique keys */}
            <div className="mb-8">
              {currentStep === 1 && <BasicProfileSection key="basic-profile" />}
              {currentStep === 2 && <DevicesSection key="devices-section" />}
              {currentStep === 3 && <EducationWorkSection key="education-section" />}
              {currentStep === 4 && <TechFluencySection key="tech-section" />}
              {currentStep === 5 && <SocialPresenceSection key="social-section" />}
              {currentStep === 6 && <SkillsInterestsSection key="skills-section" />}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Your progress is automatically saved
                </p>
              </div>

              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
