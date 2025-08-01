
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface ProfileData extends Partial<Profile> {}

interface ProfileContextType {
  profileData: ProfileData;
  loading: boolean;
  currentStep: number;
  isProfileComplete: boolean;
  updateProfileData: (section: string, data: any) => Promise<void>;
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
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfileData(data);
      } else if (error) {
        console.warn('Profile not found:', error);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error loading profile",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user) return;

    try {
      const { _isSubmission, ...cleanData } = data;
      
      const updateResult = await supabase
        .from('profiles')
        .update(cleanData as ProfileUpdate)
        .eq('user_id', user.id);
      
      if (updateResult.error) {
        throw updateResult.error;
      }
      
      setProfileData(prev => ({ ...prev, ...cleanData }));
      
      if (!_isSubmission) {
        return; // Don't show success toast for auto-save
      }
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully."
      });
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
    loading,
    currentStep,
    isProfileComplete,
    updateProfileData,
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
