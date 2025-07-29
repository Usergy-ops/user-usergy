
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { 
  validateForAutoSave,
  validateForSubmission
} from '@/utils/validation/formValidation';
import { ValidationError } from '@/utils/errorHandling';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleCentralizedError, createValidationError, createDatabaseError } from '@/utils/centralizedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type UserDevices = Database['public']['Tables']['user_devices']['Row'];
type UserTechFluency = Database['public']['Tables']['user_tech_fluency']['Row'];
type UserSkills = Database['public']['Tables']['user_skills']['Row'];
type ConsolidatedSocialPresence = Database['public']['Tables']['consolidated_social_presence']['Row'];

interface ProfileData extends Partial<Profile> {}
interface DeviceData extends Partial<UserDevices> {}
interface TechFluencyData extends Partial<UserTechFluency> {}
interface SkillsData extends Partial<UserSkills> {}
interface SocialPresenceData extends Partial<ConsolidatedSocialPresence> {}

interface ProfileContextType {
  profileData: ProfileData;
  deviceData: DeviceData;
  techFluencyData: TechFluencyData;
  skillsData: SkillsData;
  socialPresenceData: SocialPresenceData;
  loading: boolean;
  currentStep: number;
  isProfileComplete: boolean;
  updateProfileData: (section: string, data: any) => Promise<void>;
  setCurrentStep: (step: number) => void;
  calculateCompletion: () => number;
  uploadProfilePicture: (file: File) => Promise<string>;
  resumeIncompleteSection: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Enhanced profile completion check with better race condition handling
  const isProfileComplete = React.useMemo(() => {
    const completionPercentage = profileData?.completion_percentage || 0;
    const profileCompleted = profileData?.profile_completed || false;
    
    // Profile is complete if either flag is true OR completion percentage is 100%
    return profileCompleted || completionPercentage >= 100;
  }, [profileData?.completion_percentage, profileData?.profile_completed]);

  console.log('ProfileProvider state:', {
    profileData: {
      completion_percentage: profileData?.completion_percentage,
      profile_completed: profileData?.profile_completed,
      section_4_completed: profileData?.section_4_completed,
      technical_experience_level: profileData?.technical_experience_level,
      ai_familiarity_level: profileData?.ai_familiarity_level
    },
    techFluencyData: {
      ai_interests: techFluencyData?.ai_interests,
      ai_models_used: techFluencyData?.ai_models_used,
      coding_experience_years: techFluencyData?.coding_experience_years
    },
    skillsData: {
      interests: skillsData?.interests
    },
    isProfileComplete,
    loading,
    isUpdating,
    userAuthenticated: !!user
  });

  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
    console.log('Resuming incomplete section, checking sections:', {
      section_1_completed: profileData?.section_1_completed,
      section_2_completed: profileData?.section_2_completed,
      section_3_completed: profileData?.section_3_completed,
      section_4_completed: profileData?.section_4_completed,
      section_5_completed: profileData?.section_5_completed,
      section_6_completed: profileData?.section_6_completed
    });
    
    // Check which sections are completed and set the current step accordingly
    if (!profileData?.section_1_completed) {
      setCurrentStep(1);
    } else if (!profileData?.section_2_completed) {
      setCurrentStep(2);
    } else if (!profileData?.section_3_completed) {
      setCurrentStep(3);
    } else if (!profileData?.section_4_completed) {
      setCurrentStep(4);
    } else if (!profileData?.section_5_completed) {
      setCurrentStep(5);
    } else if (!profileData?.section_6_completed) {
      setCurrentStep(6);
    } else {
      setCurrentStep(1); // All sections completed, start from beginning
    }
  }, [profileData, user]);

  const calculateCompletion = useCallback(() => {
    const completionData = {
      profileData,
      deviceData,
      techFluencyData,
      skillsData
    };

    const percentage = calculateProfileCompletionPercentage(completionData);
    
    console.log('Frontend completion calculation:', {
      percentage,
      currentStoredPercentage: profileData?.completion_percentage,
      currentProfileCompleted: profileData?.profile_completed
    });
    
    // Update completion percentage and profile_completed flag if needed
    if (user && !isUpdating) {
      const needsUpdate = percentage !== profileData?.completion_percentage || 
                         (percentage >= 100 && !profileData?.profile_completed);
      
      if (needsUpdate) {
        console.log('Updating completion data:', {
          oldPercentage: profileData?.completion_percentage,
          newPercentage: percentage,
          oldCompleted: profileData?.profile_completed,
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
          .update(updateData as ProfileUpdate)
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
  }, [profileData, deviceData, techFluencyData, skillsData, user, isUpdating]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recalculate completion whenever data changes
  useEffect(() => {
    if (user && !loading && !isUpdating) {
      calculateCompletion();
    }
  }, [profileData, deviceData, techFluencyData, skillsData, calculateCompletion, user, loading, isUpdating]);

  // Resume incomplete section when profile data is loaded
  useEffect(() => {
    if (user && !loading && !isProfileComplete) {
      resumeIncompleteSection();
    }
  }, [user, loading, isProfileComplete, resumeIncompleteSection]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      monitoring.startTiming('profile_load');
      
      console.log('Loading profile data for user:', user.id);

      // Check rate limiting using unified system
      const rateLimitResult = await checkRateLimit(user.id, 'profile_load');
      if (!rateLimitResult.allowed) {
        const error = createDatabaseError('Too many profile load requests. Please try again later.', 'profile_load', user.id);
        await handleCentralizedError(error, 'profile_load', user.id);
        throw error;
      }

      // Load all data in parallel using consolidated_social_presence
      const [profileResult, devicesResult, techResult, skillsResult, socialResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('consolidated_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      console.log('Profile data loaded:', {
        profile: profileResult.data,
        devices: devicesResult.data,
        techFluency: techResult.data,
        skills: skillsResult.data,
        socialPresence: socialResult.data
      });

      // Set data with null safety
      if (profileResult.data) {
        setProfileData(profileResult.data);
      } else if (profileResult.error) {
        console.warn('Profile not found, this should not happen after migration:', profileResult.error);
      }

      if (devicesResult.data) {
        setDeviceData(devicesResult.data);
      } else {
        setDeviceData({});
      }

      if (techResult.data) {
        setTechFluencyData(techResult.data);
      } else {
        setTechFluencyData({});
      }

      if (skillsResult.data) {
        setSkillsData(skillsResult.data);
      } else {
        setSkillsData({});
      }

      if (socialResult.data) {
        setSocialPresenceData(socialResult.data);
      } else {
        setSocialPresenceData({});
      }

      monitoring.endTiming('profile_load');
      
      trackUserAction('profile_loaded', {
        sections_completed: [
          profileResult.data?.section_1_completed,
          profileResult.data?.section_2_completed,
          profileResult.data?.section_3_completed,
          profileResult.data?.section_4_completed,
          profileResult.data?.section_5_completed,
          profileResult.data?.section_6_completed
        ].filter(Boolean).length,
        completion_percentage: profileResult.data?.completion_percentage || 0,
        profile_completed: profileResult.data?.profile_completed || false
      });

    } catch (error) {
      console.error('Error loading profile data:', error);
      await handleCentralizedError(error as Error, 'profile_load', user.id);
      handleError(error, 'ProfileContext.loadProfileData');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user || isUpdating) return;

    try {
      setIsUpdating(true);
      console.log(`Updating ${section} with data:`, data);
      monitoring.startTiming(`profile_update_${section}`);

      // Check rate limiting using unified system
      const rateLimitResult = await checkRateLimit(user.id, 'profile_update');
      if (!rateLimitResult.allowed) {
        const error = createDatabaseError('Too many profile update requests. Please try again later.', 'profile_update', user.id);
        await handleCentralizedError(error, `profile_update_${section}`, user.id);
        throw error;
      }

      // Use context-aware validation - auto-save for non-submit operations
      const isAutoSave = !data._isSubmission;
      
      let validationResult;
      if (isAutoSave) {
        validationResult = validateForAutoSave(data, section);
      } else {
        validationResult = validateForSubmission(data, section);
      }

      console.log(`Validation result for ${section} (autoSave: ${isAutoSave}):`, validationResult);

      // Only throw validation errors for the current section during submission
      if (!validationResult.isValid && !isAutoSave) {
        const errorMessage = Array.isArray(validationResult.errors) 
          ? validationResult.errors.join(', ')
          : Object.values(validationResult.errors).join(', ');
        
        const error = createValidationError(errorMessage, section, user.id);
        await handleCentralizedError(error, `profile_update_${section}`, user.id);
        throw error;
      }

      // Remove internal flags before saving
      const { _isSubmission, ...cleanData } = data;
      
      let updateResult;
      
      switch (section) {
        case 'profile':
          const { completion_percentage, ...profileDataToSave } = cleanData;
          const profileUpdate: ProfileUpdate = profileDataToSave;
          
          updateResult = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', user.id);
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          setProfileData(prev => ({ ...prev, ...cleanData }));
          console.log('Profile updated successfully');
          break;

        case 'devices':
          updateResult = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          setDeviceData(prev => ({ ...prev, ...cleanData }));
          console.log('Devices updated successfully');
          break;

        case 'tech_fluency':
          updateResult = await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            }, {
              onConflict: 'user_id'
            });
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          setTechFluencyData(prev => ({ ...prev, ...cleanData }));
          console.log('Tech fluency updated successfully:', cleanData);
          break;

        case 'skills':
          updateResult = await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            }, {
              onConflict: 'user_id'
            });
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          setSkillsData(prev => ({ ...prev, ...cleanData }));
          console.log('Skills updated successfully');
          break;

        case 'social_presence':
          updateResult = await supabase
            .from('consolidated_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          setSocialPresenceData(prev => ({ ...prev, ...cleanData }));
          console.log('Social presence updated successfully');
          break;
      }

      monitoring.endTiming(`profile_update_${section}`);
      
      trackUserAction('profile_updated', {
        section,
        data_keys: Object.keys(cleanData),
        user_id: user.id,
        is_auto_save: isAutoSave
      });

    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      // Only show errors for submissions, not auto-save
      if (!data._isSubmission) {
        console.log('Suppressing auto-save error from UI');
        return; // Don't show error for auto-save
      }
      await handleCentralizedError(error as Error, `profile_update_${section}`, user.id);
      handleError(error, `ProfileContext.updateProfileData.${section}`);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      monitoring.startTiming('profile_picture_upload');

      // Check rate limiting using unified system
      const rateLimitResult = await checkRateLimit(user.id, 'file_upload');
      if (!rateLimitResult.allowed) {
        const error = createDatabaseError('Too many file upload requests. Please try again later.', 'file_upload', user.id);
        await handleCentralizedError(error, 'profile_picture_upload', user.id);
        throw error;
      }

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (file.size > maxSize) {
        const error = createValidationError('File size must be less than 5MB', 'file_size', user.id);
        await handleCentralizedError(error, 'profile_picture_upload', user.id);
        throw error;
      }
      
      if (!allowedTypes.includes(file.type)) {
        const error = createValidationError('File must be a JPEG, PNG, or WebP image', 'file_type', user.id);
        await handleCentralizedError(error, 'profile_picture_upload', user.id);
        throw error;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        const error = createDatabaseError(uploadError.message, 'file_upload', user.id);
        await handleCentralizedError(error, 'profile_picture_upload', user.id);
        throw error;
      }

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      monitoring.endTiming('profile_picture_upload');
      
      trackUserAction('profile_picture_uploaded', {
        file_size: file.size,
        file_type: file.type,
        user_id: user.id
      });

      return data.publicUrl;
    } catch (error) {
      await handleCentralizedError(error as Error, 'profile_picture_upload', user.id);
      handleError(error, 'ProfileContext.uploadProfilePicture');
      throw error;
    }
  };

  const value = {
    profileData,
    deviceData,
    techFluencyData,
    skillsData,
    socialPresenceData,
    loading,
    currentStep,
    isProfileComplete,
    updateProfileData,
    setCurrentStep,
    calculateCompletion,
    uploadProfilePicture,
    resumeIncompleteSection
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
