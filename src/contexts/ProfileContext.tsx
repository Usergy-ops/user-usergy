import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useOptimizedErrorHandler } from '@/hooks/useOptimizedErrorHandler';
import { handleError } from '@/utils/unifiedErrorHandling';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';
import { cachedProfileDataLoader, batchedProfileUpdater, preloadProfileDependencies } from '@/services/optimizedProfileServices';
import { profilePictureUploader } from '@/services/profilePictureUploader';
import { profileCompletionTracker } from '@/services/profileCompletionTracker';
import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
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
  const { handleError: handleErrorWithToast } = useOptimizedErrorHandler();

  // State management
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [techFluencyData, setTechFluencyData] = useState<TechFluencyData>({});
  const [skillsData, setSkillsData] = useState<SkillsData>({});
  const [socialPresenceData, setSocialPresenceData] = useState<SocialPresenceData>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Standardized completion calculation using the utility function
  const calculateCompletion = useCallback(() => {
    return calculateProfileCompletionPercentage({
      profileData,
      deviceData,
      techFluencyData,
      skillsData
    });
  }, [profileData, deviceData, techFluencyData, skillsData]);

  // Memoized profile completion check - simplified to use single source of truth
  const isProfileComplete = useMemo(() => {
    const completionPercentage = calculateCompletion();
    
    // Profile is complete if completion percentage is 100% OR if profile_completed flag is true
    const isComplete = completionPercentage >= 100 || profileData.profile_completed === true;
    
    console.log('Profile completion check (simplified):', {
      completionPercentage,
      profileCompletedFlag: profileData.profile_completed,
      isComplete
    });
    
    return isComplete;
  }, [calculateCompletion, profileData.profile_completed]);

  const resumeIncompleteSection = useCallback(() => {
    if (!user) return;
    
    profileCompletionTracker.resumeIncompleteSection(profileData, setCurrentStep);
  }, [profileData, user]);

  // Load profile data when user changes - now using cached loader
  useEffect(() => {
    if (user) {
      loadProfileData();
      // Preload dependencies in background
      preloadProfileDependencies(user.id).catch(console.warn);
    } else {
      // Reset all state when no user
      setProfileData({});
      setDeviceData({});
      setTechFluencyData({});
      setSkillsData({});
      setSocialPresenceData({});
      setLoading(false);
    }
  }, [user]);

  // Update completion tracking when data changes - ensure profile_completed flag is synchronized
  useEffect(() => {
    if (user && !loading && !isUpdating) {
      const currentCompletion = calculateCompletion();
      
      // Check if we need to update the profile_completed flag
      const shouldBeComplete = currentCompletion >= 100;
      const currentlyMarkedComplete = profileData.profile_completed === true;
      
      // If completion percentage is 100% but profile_completed is not true, update it
      if (shouldBeComplete && !currentlyMarkedComplete) {
        console.log('Profile reached 100% completion, updating profile_completed flag to true');
        
        const updateData = {
          completion_percentage: currentCompletion,
          profile_completed: true
        };
        
        setProfileData(prev => ({ ...prev, ...updateData }));
        
        // Update in database
        profileCompletionTracker.calculateAndUpdateCompletion(
          { profileData: { ...profileData, ...updateData }, deviceData, techFluencyData, skillsData },
          user,
          isUpdating,
          setProfileData
        );
      } else if (Math.abs(currentCompletion - (profileData.completion_percentage || 0)) > 0) {
        // Update completion percentage if it has changed
        console.log('Completion percentage changed:', {
          old: profileData.completion_percentage,
          new: currentCompletion
        });
        
        profileCompletionTracker.calculateAndUpdateCompletion(
          { profileData, deviceData, techFluencyData, skillsData },
          user,
          isUpdating,
          setProfileData
        );
      }
    }
  }, [profileData, deviceData, techFluencyData, skillsData, calculateCompletion, user, loading, isUpdating]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      console.log('Loading profile data for user:', user.id);
      
      // Use cached profile data loader
      const profileDataResponse = await cachedProfileDataLoader.loadAll(user.id);
      
      console.log('Profile data loaded:', profileDataResponse);
      
      setProfileData(profileDataResponse.profile || {});
      setDeviceData(profileDataResponse.devices || {});
      setTechFluencyData(profileDataResponse.techFluency || {});
      setSkillsData(profileDataResponse.skills || {});
      setSocialPresenceData(profileDataResponse.socialPresence || {});
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      await handleError(error as Error, 'profile_load', user.id);
      handleErrorWithToast(error, 'ProfileContext.loadProfileData');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: string, data: any) => {
    if (!user || isUpdating) return;

    try {
      setIsUpdating(true);
      
      console.log(`Updating ${section} section:`, data);
      
      // Use batched updater for better performance
      await batchedProfileUpdater.add({ section, data, userId: user.id });
      
      // Update local state based on section
      switch (section) {
        case 'profile':
          setProfileData(prev => ({ ...prev, ...data }));
          break;
        case 'devices':
          setDeviceData(prev => ({ ...prev, ...data }));
          break;
        case 'tech_fluency':
          setTechFluencyData(prev => ({ ...prev, ...data }));
          break;
        case 'skills':
          setSkillsData(prev => ({ ...prev, ...data }));
          break;
        case 'social_presence':
          setSocialPresenceData(prev => ({ ...prev, ...data }));
          break;
      }

      console.log(`${section} section updated successfully`);

    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      await handleError(error as Error, `profile_update_${section}`, user.id);
      handleErrorWithToast(error, `ProfileContext.updateProfileData.${section}`);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const publicUrl = await profilePictureUploader.upload(file, user.id);
      return publicUrl;
    } catch (error) {
      await handleError(error as Error, 'profile_picture_upload', user.id);
      handleErrorWithToast(error, 'ProfileContext.uploadProfilePicture');
      throw error;
    }
  };

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [
    profileData,
    deviceData,
    techFluencyData,
    skillsData,
    socialPresenceData,
    loading,
    currentStep,
    isProfileComplete,
    updateProfileData,
    calculateCompletion,
    uploadProfilePicture,
    resumeIncompleteSection
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
