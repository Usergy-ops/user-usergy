import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface ProfileData extends Partial<Profile> {}

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
  programming_languages?: string[];
  ai_models_used?: string[];
  ai_interests?: string[];
  coding_experience_years?: number;
}

interface SkillsData {
  interests?: string[];
  product_categories?: string[];
  skills?: any;
}

interface ProfileContextType {
  profileData: ProfileData;
  deviceData: DeviceData;
  techFluencyData: TechFluencyData;
  skillsData: SkillsData;
  loading: boolean;
  currentStep: number;
  isProfileComplete: boolean;
  updateProfileData: (section: string, data: any) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  setCurrentStep: (step: number) => void;
  calculateCompletion: () => number;
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
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const isProfileComplete = React.useMemo(() => {
    const completionPercentage = profileData?.completion_percentage || 0;
    const profileCompleted = profileData?.profile_completed || false;
    return profileCompleted || completionPercentage >= 100;
  }, [profileData?.completion_percentage, profileData?.profile_completed]);

  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
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
      setCurrentStep(1);
    }
  }, [profileData, user]);

  const calculateCompletion = useCallback(() => {
    // Simple completion calculation based on completed sections
    const sections = [
      profileData?.section_1_completed,
      profileData?.section_2_completed,
      profileData?.section_3_completed,
      profileData?.section_4_completed,
      profileData?.section_5_completed,
      profileData?.section_6_completed
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  }, [profileData]);

  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileData(profile);
      } else if (profileError && !profileError.message.includes('No rows')) {
        console.warn('Profile not found:', profileError);
      }

      // Load device data
      const { data: devices, error: deviceError } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (devices) {
        setDeviceData(devices);
      } else if (deviceError && !deviceError.message.includes('No rows')) {
        console.warn('Device data not found:', deviceError);
      }

      // Load tech fluency data
      const { data: techFluency, error: techError } = await supabase
        .from('user_tech_fluency')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (techFluency) {
        setTechFluencyData(techFluency);
      } else if (techError && !techError.message.includes('No rows')) {
        console.warn('Tech fluency data not found:', techError);
      }

      // Load skills data
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (skills) {
        setSkillsData(skills);
      } else if (skillsError && !skillsError.message.includes('No rows')) {
        console.warn('Skills data not found:', skillsError);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading profile",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('No user found');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      const { _isSubmission, ...cleanData } = data;
      
      if (section === 'profile') {
        // Ensure email is always included for profile updates since it's required
        const profileUpdateData = {
          user_id: user.id,
          email: user.email || profileData?.email || '',
          ...cleanData
        };
        
        // Update profiles table
        const updateResult = await supabase
          .from('profiles')
          .upsert(profileUpdateData, { onConflict: 'user_id' });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        setProfileData(prev => ({ ...prev, ...cleanData }));
      } else if (section === 'devices') {
        // Update user_devices table
        const updateResult = await supabase
          .from('user_devices')
          .upsert({ user_id: user.id, ...cleanData }, { onConflict: 'user_id' });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        setDeviceData(prev => ({ ...prev, ...cleanData }));
      } else if (section === 'techfluency') {
        // Update user_tech_fluency table
        const updateResult = await supabase
          .from('user_tech_fluency')
          .upsert({ user_id: user.id, ...cleanData }, { onConflict: 'user_id' });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        setTechFluencyData(prev => ({ ...prev, ...cleanData }));
      } else if (section === 'skills') {
        // Update user_skills table
        const updateResult = await supabase
          .from('user_skills')
          .upsert({ user_id: user.id, ...cleanData }, { onConflict: 'user_id' });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        setSkillsData(prev => ({ ...prev, ...cleanData }));
      }
      
      if (_isSubmission) {
        toast({
          title: "Profile updated",
          description: "Your changes have been saved successfully."
        });
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const value = {
    profileData,
    deviceData,
    techFluencyData,
    skillsData,
    loading,
    currentStep,
    isProfileComplete,
    updateProfileData,
    uploadProfilePicture,
    setCurrentStep,
    calculateCompletion,
    resumeIncompleteSection
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
