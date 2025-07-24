
import React, { useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BasicProfileSection } from '@/components/profile/BasicProfileSection';
import { DevicesSection } from '@/components/profile/DevicesSection';
import { EducationWorkSection } from '@/components/profile/EducationWorkSection';
import { EnhancedTechFluencySection } from '@/components/profile/EnhancedTechFluencySection';
import { EnhancedSocialPresenceSection } from '@/components/profile/EnhancedSocialPresenceSection';
import { SkillsInterestsSection } from '@/components/profile/SkillsInterestsSection';
import { CompletionCelebration } from '@/components/profile/CompletionCelebration';
import { ChevronLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ProfileCompletion = () => {
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    isProfileComplete, 
    profileData, 
    deviceData,
    techFluencyData,
    loading,
    calculateCompletion,
    resumeIncompleteSection
  } = useProfile();

  console.log('ProfileCompletion rendered with:', {
    currentStep,
    isProfileComplete,
    profileData: {
      completion_percentage: profileData.completion_percentage,
      section_4_completed: profileData.section_4_completed,
      technical_experience_level: profileData.technical_experience_level,
      ai_familiarity_level: profileData.ai_familiarity_level
    },
    techFluencyData: {
      ai_interests: techFluencyData.ai_interests,
      ai_models_used: techFluencyData.ai_models_used,
      coding_experience_years: techFluencyData.coding_experience_years
    }
  });

  // Calculate real-time completion percentage using the EXACT same logic as database function
  const calculateRealTimeCompletion = () => {
    const mandatoryFields = {
      // Basic Profile (6 fields - removed avatar_url, phone_number is optional)
      full_name: profileData.full_name,
      country: profileData.country,
      city: profileData.city,
      gender: profileData.gender,
      age: profileData.age,
      timezone: profileData.timezone,
      
      // Devices & Tech (4 fields)
      operating_systems: deviceData.operating_systems,
      devices_owned: deviceData.devices_owned,
      mobile_manufacturers: deviceData.mobile_manufacturers,
      email_clients: deviceData.email_clients,
      
      // Education & Work (1 field)
      education_level: profileData.education_level,
      
      // AI & Tech Fluency (4 fields)
      technical_experience_level: profileData.technical_experience_level,
      ai_familiarity_level: profileData.ai_familiarity_level,
      ai_models_used: techFluencyData.ai_models_used,
      ai_interests: techFluencyData.ai_interests,
    };

    const totalFields = 15; // Updated from 16 to 15 (removed avatar_url)
    const completedFields = Object.values(mandatoryFields).filter(value => {
      if (Array.isArray(value)) {
        return value && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    }).length;

    const percentage = Math.round((completedFields / totalFields) * 100);
    
    console.log('Real-time completion calculation:', {
      mandatoryFields,
      completedFields,
      totalFields,
      percentage
    });
    
    return percentage;
  };

  const realTimeCompletion = calculateRealTimeCompletion();

  useEffect(() => {
    if (user) {
      calculateCompletion();
    }
  }, [user, calculateCompletion]);

  // Resume incomplete section on component mount
  useEffect(() => {
    if (user && !loading && !isProfileComplete) {
      resumeIncompleteSection();
    }
  }, [user, loading, isProfileComplete, resumeIncompleteSection]);

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
    { 
      id: 1, 
      title: "Basic Profile", 
      completed: profileData.section_1_completed || false 
    },
    { 
      id: 2, 
      title: "Devices & Tech", 
      completed: profileData.section_2_completed || false 
    },
    { 
      id: 3, 
      title: "Education & Work", 
      completed: profileData.section_3_completed || false 
    },
    { 
      id: 4, 
      title: "AI & Tech Fluency", 
      completed: profileData.section_4_completed || false 
    },
    { 
      id: 5, 
      title: "Social Presence", 
      completed: profileData.section_5_completed || false 
    },
    { 
      id: 6, 
      title: "Skills & Interests", 
      completed: profileData.section_6_completed || false 
    }
  ];

  const currentSection = sections.find(s => s.id === currentStep);
  const isFirstStep = currentStep === 1;

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSectionClick = (sectionId: number) => {
    // Allow users to navigate to any section
    setCurrentStep(sectionId);
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
            <div className="mt-4 text-sm text-muted-foreground">
              Overall completion: {realTimeCompletion}% (15 mandatory fields)
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    currentStep === section.id
                      ? 'bg-primary text-primary-foreground'
                      : section.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {section.id}. {section.title}
                  {section.completed && ' ✓'}
                </button>
              ))}
            </div>
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
              {currentStep === 1 && <BasicProfileSection key="basic-profile" />}
              {currentStep === 2 && <DevicesSection key="devices-section" />}
              {currentStep === 3 && <EducationWorkSection key="education-section" />}
              {currentStep === 4 && <EnhancedTechFluencySection key="tech-section" />}
              {currentStep === 5 && <EnhancedSocialPresenceSection key="social-section" />}
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
