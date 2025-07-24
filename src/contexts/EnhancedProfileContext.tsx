
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
import { checkRateLimit } from '@/utils/rateLimiting';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type UserDevices = Database['public']['Tables']['user_devices']['Row'];
type UserTechFluency = Database['public']['Tables']['user_tech_fluency']['Row'];
type UserSkills = Database['public']['Tables']['user_skills']['Row'];
type UserSocialPresence = Database['public']['Tables']['user_social_presence']['Row'];

interface ProfileData extends Partial<Profile> {}
interface DeviceData extends Partial<UserDevices> {}
interface TechFluencyData extends Partial<UserTechFluency> {}
interface SkillsData extends Partial<UserSkills> {}
interface SocialPresenceData extends Partial<UserSocialPresence> {}

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
  retryFailedOperation: (operation: () => Promise<any>) => Promise<any>;
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

  // Enhanced retry mechanism with exponential backoff
  const retryFailedOperation = useCallback(async (operation: () => Promise<any>, maxRetries = 3) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }, []);

  // Enhanced completion calculation with proper field mapping
  const calculateCompletion = useCallback(() => {
    const mandatoryFields = {
      // Basic Profile (7 fields)
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
      
      // AI & Tech Fluency (4 fields) - CORRECTED field names
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

    const percentage = Math.round((completedFields / totalFields) * 100);
    
    // Update completion percentage with rate limiting
    if (user && percentage !== profileData.completion_percentage) {
      setProfileData(prev => ({ ...prev, completion_percentage: percentage }));
      
      // Rate limit completion updates
      retryFailedOperation(async () => {
        const rateLimitResult = await checkRateLimit(user.id, 'profile_update');
        if (!rateLimitResult.allowed) {
          throw new Error('Rate limit exceeded for profile updates');
        }
        
        await supabase
          .from('profiles')
          .update({ completion_percentage: percentage } as ProfileUpdate)
          .eq('user_id', user.id);
          
        console.log('Completion percentage updated:', percentage);
      }).catch(error => {
        console.error('Failed to update completion percentage:', error);
      });
    }
    
    return percentage;
  }, [profileData, deviceData, techFluencyData, user, retryFailedOperation]);

  // Enhanced data loading with better error handling
  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Rate limit data loading
      const rateLimitResult = await checkRateLimit(user.id, 'profile_load');
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for profile loading');
      }

      // Load all data in parallel with timeout
      const loadPromises = [
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_devices').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_social_presence').select('*').eq('user_id', user.id).maybeSingle()
      ];

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data loading timeout')), 10000)
      );

      const results = await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]) as any[];

      const [profileResult, devicesResult, techResult, skillsResult, socialResult] = results;

      // Set data with validation
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

    } catch (error) {
      handleError(error, 'EnhancedProfileContext.loadProfileData');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced profile data update with comprehensive validation
  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      // Rate limit updates
      const rateLimitResult = await checkRateLimit(user.id, 'profile_update');
      if (!rateLimitResult.allowed) {
        throw new ValidationError('Too many profile updates. Please wait before trying again.');
      }

      // Enhanced validation
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
        throw new ValidationError(validationResult.errors.join(', '));
      }

      // Update with retry mechanism
      await retryFailedOperation(async () => {
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
              .from('user_social_presence')
              .upsert({ 
                user_id: user.id, 
                ...data
              });
            setSocialPresenceData(prev => ({ ...prev, ...data }));
            break;
        }
      });

    } catch (error) {
      handleError(error, `EnhancedProfileContext.updateProfileData.${section}`);
      throw error;
    }
  };

  // Enhanced file upload with validation
  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Rate limit file uploads
      const rateLimitResult = await checkRateLimit(user.id, 'file_upload');
      if (!rateLimitResult.allowed) {
        throw new ValidationError('Too many file uploads. Please wait before trying again.');
      }

      // Enhanced file validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (file.size > maxSize) {
        throw new ValidationError('File size must be less than 5MB');
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError('File must be a JPEG, PNG, or WebP image');
      }

      // Upload with retry mechanism
      return await retryFailedOperation(async () => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);

        return data.publicUrl;
      });

    } catch (error) {
      handleError(error, 'EnhancedProfileContext.uploadProfilePicture');
      throw error;
    }
  };

  // Resume incomplete section logic
  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
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
      setCurrentStep(1);
    }
  }, [profileData, user]);

  // Enhanced initialization with error recovery
  useEffect(() => {
    if (user) {
      retryFailedOperation(loadProfileData).catch(error => {
        console.error('Failed to load profile data after retries:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recalculate completion with debouncing
  useEffect(() => {
    if (user && !loading) {
      const debounceTimer = setTimeout(() => {
        calculateCompletion();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [profileData, deviceData, techFluencyData, calculateCompletion, user, loading]);

  // Resume logic
  useEffect(() => {
    if (user && !loading && !isProfileComplete) {
      resumeIncompleteSection();
    }
  }, [user, loading, isProfileComplete, resumeIncompleteSection]);

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
    resumeIncompleteSection,
    retryFailedOperation
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
