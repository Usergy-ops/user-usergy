
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/contexts/ProfileContext';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';

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
  const { profileData, deviceData, techFluencyData, skillsData } = useProfile();
  const [realTimeCompletion, setRealTimeCompletion] = useState(completionPercentage);

  // Calculate real-time completion percentage using the utility function
  useEffect(() => {
    const completionData = {
      profileData,
      deviceData,
      techFluencyData,
      skillsData
    };

    const percentage = calculateProfileCompletionPercentage(completionData);
    setRealTimeCompletion(percentage);
  }, [profileData, deviceData, techFluencyData, skillsData]);

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
