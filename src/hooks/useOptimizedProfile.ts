
import { useMemo, useCallback } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { debounce } from '@/utils/performance';

/**
 * Performance-optimized profile hook with debounced updates and memoized calculations
 */
export const useOptimizedProfile = () => {
  const profileContext = useProfile();
  
  // Memoize complex calculations
  const profileStats = useMemo(() => {
    const { profileData, deviceData, techFluencyData, skillsData } = profileContext;
    
    const sectionsCompleted = [
      profileData.section_1_completed,
      profileData.section_2_completed,
      profileData.section_3_completed,
      profileData.section_4_completed,
      profileData.section_5_completed,
      profileData.section_6_completed
    ].filter(Boolean).length;
    
    const hasBasicInfo = !!(profileData.full_name && profileData.email);
    const hasDevices = !!(deviceData.devices_owned?.length);
    const hasTechInfo = !!(techFluencyData.programming_languages?.length || techFluencyData.ai_models_used?.length);
    const hasSkills = !!(skillsData.skills && Object.keys(skillsData.skills).length > 0);
    
    return {
      sectionsCompleted,
      hasBasicInfo,
      hasDevices,
      hasTechInfo,
      hasSkills,
      completionScore: profileContext.profileData.completion_percentage || 0
    };
  }, [
    profileContext.profileData,
    profileContext.deviceData,
    profileContext.techFluencyData,
    profileContext.skillsData
  ]);
  
  // Debounced update function to prevent excessive API calls
  const debouncedUpdate = useMemo(
    () => debounce(profileContext.updateProfileData, 500),
    [profileContext.updateProfileData]
  );
  
  // Memoized handlers
  const optimizedHandlers = useMemo(() => ({
    updateSection: useCallback((section: string, data: any) => {
      return debouncedUpdate(section, data);
    }, [debouncedUpdate]),
    
    setCurrentStep: useCallback((step: number) => {
      profileContext.setCurrentStep(step);
    }, [profileContext.setCurrentStep]),
    
    uploadProfilePicture: useCallback((file: File) => {
      return profileContext.uploadProfilePicture(file);
    }, [profileContext.uploadProfilePicture])
  }), [debouncedUpdate, profileContext]);
  
  return {
    ...profileContext,
    ...optimizedHandlers,
    profileStats,
    // Add performance tracking
    isOptimized: true
  };
};
