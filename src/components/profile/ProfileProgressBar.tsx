
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/contexts/ProfileContext';

interface ProfileProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
}

export const ProfileProgressBar: React.FC<ProfileProgressBarProps> = ({
  currentStep,
  totalSteps,
  completionPercentage
}) => {
  const { profileData, deviceData, techFluencyData } = useProfile();
  const [realTimeCompletion, setRealTimeCompletion] = useState(completionPercentage);

  // Calculate real-time completion percentage using CORRECT field names
  useEffect(() => {
    const calculateRealTimeCompletion = () => {
      const mandatoryFields = {
        // Basic Profile (7 fields - using actual database field names)
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        country: profileData.country,
        city: profileData.city,
        gender: profileData.gender,
        date_of_birth: profileData.date_of_birth,
        timezone: profileData.timezone,
        
        // Devices & Tech (4 fields)
        operating_systems: deviceData.operating_systems,
        devices_owned: deviceData.devices_owned,
        mobile_manufacturers: deviceData.mobile_manufacturers,
        email_clients: deviceData.email_clients,
        
        // Education & Work (1 field)
        education_level: profileData.education_level,
        
        // AI & Tech Fluency (4 fields - using actual database field names)
        technical_experience_level: profileData.technical_experience_level,
        ai_familiarity_level: profileData.ai_familiarity_level,
        ai_models_used: techFluencyData.ai_models_used,
        ai_interests: techFluencyData.ai_interests,
      };

      const totalFields = Object.keys(mandatoryFields).length;
      const completedFields = Object.values(mandatoryFields).filter(value => {
        if (Array.isArray(value)) {
          return value && value.length > 0;
        }
        return value && value.toString().trim() !== '';
      }).length;

      return Math.round((completedFields / totalFields) * 100);
    };

    setRealTimeCompletion(calculateRealTimeCompletion());
  }, [profileData, deviceData, techFluencyData]);

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-foreground">Profile Completion</h3>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                {realTimeCompletion}%
              </div>
              <div className="text-xs text-muted-foreground">
                {realTimeCompletion >= 100 ? 'Complete!' : 'Almost there!'}
              </div>
            </div>
          </div>
          
          <Progress 
            value={realTimeCompletion} 
            className="h-3 bg-muted"
          />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 <= currentStep 
                    ? 'bg-primary' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
