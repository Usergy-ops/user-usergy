import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ProfileData {
  // Basic Profile
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  timezone?: string;
  
  // Education & Work
  education_level?: string;
  field_of_study?: string;
  job_title?: string;
  employer?: string;
  industry?: string;
  work_role?: string;
  company_size?: string;
  household_income_range?: string;
  
  // Tech Fluency
  technical_experience_level?: string;
  ai_familiarity_level?: string;
  
  // Personal
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  languages_spoken?: string[];
  
  // Completion tracking
  completion_percentage?: number;
  section_1_completed?: boolean;
  section_2_completed?: boolean;
  section_3_completed?: boolean;
  section_4_completed?: boolean;
  section_5_completed?: boolean;
  section_6_completed?: boolean;
}

interface DeviceData {
  operating_systems?: string[];
  devices_owned?: string[];
  mobile_manufacturers?: string[];
  desktop_manufacturers?: string[];
  email_clients?: string[];
  streaming_subscriptions?: string[];
  music_subscriptions?: string[];
}

interface TechFluencyData {
  ai_interests?: string[];
  ai_models_used?: string[];
  programming_languages?: string[];
  coding_experience_years?: number;
}

interface SkillsData {
  skills?: any;
  interests?: string[];
  product_categories?: string[];
}

interface SocialPresenceData {
  other_social_networks?: any;
  additional_links?: string[];
}

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
  calculateCompletion: () => Promise<number | undefined>;
  uploadProfilePicture: (file: File) => Promise<string>;
  autoSaveData: () => Promise<void>;
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
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Calculate completion percentage based on mandatory fields using CORRECT field names
  const calculateMandatoryCompletion = useCallback(() => {
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
  }, [profileData, deviceData, techFluencyData]);

  const isProfileComplete = (profileData.completion_percentage || 0) >= 100;

  // Load current step from localStorage to maintain state across tabs
  useEffect(() => {
    const savedStep = localStorage.getItem('profileCurrentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('profileCurrentStep', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Auto-save functionality - save every 10 seconds
  useEffect(() => {
    if (!user) return;

    const autoSaveInterval = setInterval(async () => {
      await autoSaveData();
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [user, profileData, deviceData, techFluencyData, skillsData, socialPresenceData]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading profile data for user:', user.id);

      // Load main profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        throw profileError;
      }

      if (profile) {
        console.log('Loaded profile data:', profile);
        setProfileData(profile);
      }

      // Load device data
      const { data: devices, error: devicesError } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (devicesError) {
        console.error('Error loading devices:', devicesError);
        throw devicesError;
      }

      if (devices) {
        console.log('Loaded device data:', devices);
        setDeviceData(devices);
      }

      // Load tech fluency data
      const { data: techFluency, error: techError } = await supabase
        .from('user_tech_fluency')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (techError) {
        console.error('Error loading tech fluency:', techError);
        throw techError;
      }

      if (techFluency) {
        console.log('Loaded tech fluency data:', techFluency);
        // Handle programming_languages field type conversion
        const processedTechFluency = {
          ...techFluency,
          programming_languages: Array.isArray(techFluency.programming_languages)
            ? techFluency.programming_languages
            : techFluency.programming_languages
              ? (typeof techFluency.programming_languages === 'string' 
                  ? JSON.parse(techFluency.programming_languages)
                  : [])
              : []
        };
        setTechFluencyData(processedTechFluency);
      }

      // Load skills data
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (skillsError) {
        console.error('Error loading skills:', skillsError);
        throw skillsError;
      }

      if (skills) {
        console.log('Loaded skills data:', skills);
        setSkillsData(skills);
      }

      // Load social presence data
      const { data: socialPresence, error: socialError } = await supabase
        .from('user_social_presence')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (socialError) {
        console.error('Error loading social presence:', socialError);
        throw socialError;
      }

      if (socialPresence) {
        console.log('Loaded social presence data:', socialPresence);
        setSocialPresenceData(socialPresence);
      }

      console.log('Profile data loading completed successfully');

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSaveData = async () => {
    if (!user) return;

    try {
      console.log('Auto-saving profile data...');
      
      // Save profile data
      if (Object.keys(profileData).length > 0) {
        const { completion_percentage, ...dataToSave } = profileData;
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            user_id: user.id, 
            email: user.email || '',
            ...dataToSave
          });
        
        if (error) {
          console.error('Error auto-saving profile:', error);
          throw error;
        }
      }

      // Save other data sections
      if (Object.keys(deviceData).length > 0) {
        const { error } = await supabase
          .from('user_devices')
          .upsert({ 
            user_id: user.id, 
            ...deviceData
          });
        
        if (error) {
          console.error('Error auto-saving devices:', error);
          throw error;
        }
      }

      if (Object.keys(techFluencyData).length > 0) {
        const { error } = await supabase
          .from('user_tech_fluency')
          .upsert({ 
            user_id: user.id, 
            ...techFluencyData
          });
        
        if (error) {
          console.error('Error auto-saving tech fluency:', error);
          throw error;
        }
      }

      if (Object.keys(skillsData).length > 0) {
        const { error } = await supabase
          .from('user_skills')
          .upsert({ 
            user_id: user.id, 
            ...skillsData
          });
        
        if (error) {
          console.error('Error auto-saving skills:', error);
          throw error;
        }
      }

      if (Object.keys(socialPresenceData).length > 0) {
        const { error } = await supabase
          .from('user_social_presence')
          .upsert({ 
            user_id: user.id, 
            ...socialPresenceData
          });
        
        if (error) {
          console.error('Error auto-saving social presence:', error);
          throw error;
        }
      }

      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      console.log(`Updating ${section} data:`, data);
      
      switch (section) {
        case 'profile':
          const { completion_percentage, ...profileDataToSave } = data;
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              user_id: user.id, 
              email: user.email || '',
              ...profileDataToSave
            });
          
          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw profileError;
          }
          
          setProfileData(prev => ({ ...prev, ...data }));
          break;

        case 'devices':
          const { error: devicesError } = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          
          if (devicesError) {
            console.error('Error updating devices:', devicesError);
            throw devicesError;
          }
          
          setDeviceData(prev => ({ ...prev, ...data }));
          break;

        case 'tech_fluency':
          const { error: techError } = await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          
          if (techError) {
            console.error('Error updating tech fluency:', techError);
            throw techError;
          }
          
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;

        case 'skills':
          const { error: skillsError } = await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          
          if (skillsError) {
            console.error('Error updating skills:', skillsError);
            throw skillsError;
          }
          
          setSkillsData(prev => ({ ...prev, ...data }));
          break;

        case 'social_presence':
          const { error: socialError } = await supabase
            .from('user_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...data
            });
          
          if (socialError) {
            console.error('Error updating social presence:', socialError);
            throw socialError;
          }
          
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }

      console.log(`Successfully updated ${section} data`);
      
      // Recalculate completion percentage
      await calculateCompletion();
    } catch (error) {
      console.error('Error updating profile data:', error);
      throw error;
    }
  };

  const calculateCompletion = async () => {
    if (!user) return;

    try {
      console.log('Calculating completion percentage...');
      
      // First reload all data to ensure we have the latest from DB
      await loadProfileData();
      
      const completionPercentage = calculateMandatoryCompletion();
      
      console.log('Calculated completion percentage:', completionPercentage);
      
      // Update the completion percentage in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ completion_percentage: completionPercentage })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating completion percentage:', error);
        throw error;
      }

      // Update local state immediately
      setProfileData(prev => ({ ...prev, completion_percentage: completionPercentage }));
      
      console.log('Completion percentage updated successfully:', completionPercentage);
      
      // Return the completion percentage so callers can use it
      return completionPercentage;
    } catch (error) {
      console.error('Error calculating completion:', error);
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

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
    autoSaveData
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
