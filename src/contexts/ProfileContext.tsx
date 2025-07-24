
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { 
  validateProfileData, 
  validateDeviceData, 
  validateTechFluencyData, 
  validateSkillsData, 
  validateSocialPresenceData 
} from '@/utils/dataValidation';
import { ValidationError } from '@/utils/errorHandling';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleCentralizedError, createValidationError, createDatabaseError } from '@/utils/centralizedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';
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

  const isProfileComplete = (profileData.completion_percentage || 0) >= 100;

  // Resume incomplete section based on completed sections
  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
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
  }, [profileData, user]);

  // Calculate completion percentage using the EXACT same logic as database function
  const calculateCompletion = useCallback(() => {
    const mandatoryFields = {
      // Basic Profile (7 fields - phone_number is optional)
      full_name: profileData.full_name,
      avatar_url: profileData.avatar_url,
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

    const totalFields = 16; // Match database calculation exactly
    const completedFields = Object.values(mandatoryFields).filter(value => {
      if (Array.isArray(value)) {
        return value && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    }).length;

    const percentage = Math.round((completedFields / totalFields) * 100);
    
    // Update completion percentage in state and database
    if (user && percentage !== profileData.completion_percentage) {
      setProfileData(prev => ({ ...prev, completion_percentage: percentage }));
      supabase
        .from('profiles')
        .update({ completion_percentage: percentage } as ProfileUpdate)
        .eq('user_id', user.id)
        .then(() => {
          console.log('Completion percentage updated:', percentage);
        });
    }
    
    return percentage;
  }, [profileData, deviceData, techFluencyData, user]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recalculate completion whenever data changes
  useEffect(() => {
    if (user && !loading) {
      calculateCompletion();
    }
  }, [profileData, deviceData, techFluencyData, calculateCompletion, user, loading]);

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

      if (profileResult.data) {
        setProfileData(profileResult.data);
      }

      if (devicesResult.data) {
        setDeviceData(devicesResult.data);
      }

      if (techResult.data) {
        setTechFluencyData(techResult.data);
      }

      if (skillsResult.data) {
        setSkillsData(skillsResult.data);
      }

      if (socialResult.data) {
        setSocialPresenceData(socialResult.data);
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
        completion_percentage: profileResult.data?.completion_percentage || 0
      });

    } catch (error) {
      await handleCentralizedError(error as Error, 'profile_load', user.id);
      handleError(error, 'ProfileContext.loadProfileData');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      monitoring.startTiming(`profile_update_${section}`);

      // Check rate limiting using unified system
      const rateLimitResult = await checkRateLimit(user.id, 'profile_update');
      if (!rateLimitResult.allowed) {
        const error = createDatabaseError('Too many profile update requests. Please try again later.', 'profile_update', user.id);
        await handleCentralizedError(error, `profile_update_${section}`, user.id);
        throw error;
      }

      // Validate data before updating
      let validationResult;
      
      switch (section) {
        case 'profile':
          validationResult = validateProfileData(data);
          break;
        case 'devices':
          validationResult = validateDeviceData(data);
          break;
        case 'tech_fluency':
          validationResult = validateTechFluencyData(data);
          break;
        case 'skills':
          validationResult = validateSkillsData(data);
          break;
        case 'social_presence':
          validationResult = validateSocialPresenceData(data);
          break;
        default:
          validationResult = { isValid: true, errors: [] };
      }

      if (!validationResult.isValid) {
        const error = createValidationError(validationResult.errors.join(', '), section, user.id);
        await handleCentralizedError(error, `profile_update_${section}`, user.id);
        throw error;
      }

      switch (section) {
        case 'profile':
          const { completion_percentage, ...profileDataToSave } = data;
          const profileUpdate: ProfileUpdate = profileDataToSave;
          
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', user.id);
          setProfileData(prev => ({ ...prev, ...data }));
          break;

        case 'devices':
          await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setDeviceData(prev => ({ ...prev, ...data }));
          break;

        case 'tech_fluency':
          await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;

        case 'skills':
          await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setSkillsData(prev => ({ ...prev, ...data }));
          break;

        case 'social_presence':
          await supabase
            .from('consolidated_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }

      monitoring.endTiming(`profile_update_${section}`);
      
      trackUserAction('profile_updated', {
        section,
        data_keys: Object.keys(data),
        user_id: user.id
      });

    } catch (error) {
      await handleCentralizedError(error as Error, `profile_update_${section}`, user.id);
      handleError(error, `ProfileContext.updateProfileData.${section}`);
      throw error;
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
