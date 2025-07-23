
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
  updateProfileData: (section: string, data: any) => Promise<void>;
  setCurrentStep: (step: number) => void;
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

      if (profileError && profileError.code !== 'PGRST116') {
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

      if (devicesError && devicesError.code !== 'PGRST116') {
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

      if (techError && techError.code !== 'PGRST116') {
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

      if (skillsError && skillsError.code !== 'PGRST116') {
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

      if (socialError && socialError.code !== 'PGRST116') {
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

  const validateData = (section: string, data: any) => {
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid data provided for section: ${section}`);
    }

    // Remove undefined values and empty strings
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return cleanData;
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) {
      console.error('No user found, cannot update profile data');
      throw new Error('User not authenticated');
    }

    try {
      console.log(`Updating ${section} data:`, data);
      
      const cleanData = validateData(section, data);
      
      if (Object.keys(cleanData).length === 0) {
        console.warn(`No valid data to save for section: ${section}`);
        return;
      }

      switch (section) {
        case 'profile':
          // First update local state
          setProfileData(prev => ({ ...prev, ...cleanData }));
          
          // Separate completion fields from profile data
          const { completion_percentage, ...profileDataToSave } = cleanData;
          
          // Then save to database
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              user_id: user.id, 
              email: user.email || '',
              ...profileDataToSave
            });
          
          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw new Error(`Failed to save profile: ${profileError.message}`);
          }
          
          break;

        case 'devices':
          // First update local state
          setDeviceData(prev => ({ ...prev, ...cleanData }));
          
          // Then save to database
          const { error: devicesError } = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (devicesError) {
            console.error('Error updating devices:', devicesError);
            throw new Error(`Failed to save devices: ${devicesError.message}`);
          }
          
          break;

        case 'tech_fluency':
          // First update local state
          setTechFluencyData(prev => ({ ...prev, ...cleanData }));
          
          // Then save to database
          const { error: techError } = await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (techError) {
            console.error('Error updating tech fluency:', techError);
            throw new Error(`Failed to save tech fluency: ${techError.message}`);
          }
          
          break;

        case 'skills':
          // First update local state
          setSkillsData(prev => ({ ...prev, ...cleanData }));
          
          // Then save to database
          const { error: skillsError } = await supabase
            .from('user_skills')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (skillsError) {
            console.error('Error updating skills:', skillsError);
            throw new Error(`Failed to save skills: ${skillsError.message}`);
          }
          
          break;

        case 'social_presence':
          // First update local state
          setSocialPresenceData(prev => ({ ...prev, ...cleanData }));
          
          // Then save to database
          const { error: socialError } = await supabase
            .from('user_social_presence')
            .upsert({ 
              user_id: user.id, 
              ...cleanData
            });
          
          if (socialError) {
            console.error('Error updating social presence:', socialError);
            throw new Error(`Failed to save social presence: ${socialError.message}`);
          }
          
          break;

        default:
          console.error(`Unknown section: ${section}`);
          throw new Error(`Unknown section: ${section}`);
      }

      console.log(`Successfully updated ${section} data`);
    } catch (error) {
      console.error(`Error updating ${section} data:`, error);
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
    updateProfileData,
    setCurrentStep,
    uploadProfilePicture,
    autoSaveData
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
