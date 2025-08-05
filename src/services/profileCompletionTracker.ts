
import { supabase } from '@/integrations/supabase/client';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';

class ProfileCompletionTracker {
  resumeIncompleteSection(profileData: any, setCurrentStep: (step: number) => void): void {
    console.log('Resuming incomplete section, checking sections:', {
      section_1_completed: profileData.section_1_completed,
      section_2_completed: profileData.section_2_completed,
      section_3_completed: profileData.section_3_completed,
      section_4_completed: profileData.section_4_completed,
      section_5_completed: profileData.section_5_completed,
      section_6_completed: profileData.section_6_completed
    });
    
    // Check which sections are completed and set the current step accordingly
    if (!profileData.section_1_completed) {
      setCurrentStep(1);
    } else if (!profileData.section_2_completed) {
      setCurrentStep(2);
    } else if (!profileData.section_3_completed) {
      setCurrentStep(3);
    } else if (!profileData.section_4_completed) {
      setCurrentStep(4);
    } else if (!profileData.section_5_completed) {
      setCurrentStep(5);
    } else if (!profileData.section_6_completed) {
      setCurrentStep(6);
    } else {
      setCurrentStep(1); // All sections completed, start from beginning
    }
  }

  calculateAndUpdateCompletion(
    completionData: any,
    user: any,
    isUpdating: boolean,
    setProfileData: (updater: (prev: any) => any) => void
  ): number {
    const percentage = calculateProfileCompletionPercentage(completionData);
    
    console.log('Frontend completion calculation:', {
      percentage,
      currentStoredPercentage: completionData.profileData.completion_percentage
    });
    
    // Update completion percentage and profile_completed flag if needed
    if (user && !isUpdating) {
      const needsUpdate = percentage !== completionData.profileData.completion_percentage || 
                         (percentage >= 100 && !completionData.profileData.profile_completed);
      
      if (needsUpdate) {
        console.log('Updating completion data:', {
          oldPercentage: completionData.profileData.completion_percentage,
          newPercentage: percentage,
          oldCompleted: completionData.profileData.profile_completed,
          newCompleted: percentage >= 100
        });
        
        const updateData = {
          completion_percentage: percentage,
          profile_completed: percentage >= 100
        };
        
        setProfileData(prev => ({ ...prev, ...updateData }));
        
        // Update in database
        supabase
          .from('profiles')
          .update(updateData as any)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating completion data:', error);
            } else {
              console.log('Completion data updated successfully:', updateData);
            }
          });
      }
    }
    
    return percentage;
  }
}

export const profileCompletionTracker = new ProfileCompletionTracker();
