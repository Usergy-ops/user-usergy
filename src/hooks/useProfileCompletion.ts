
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';

interface MissingField {
  field: string;
  table: string;
  displayName: string;
}

export const useProfileCompletion = () => {
  const { 
    profileData, 
    deviceData, 
    techFluencyData, 
    updateProfileData, 
    calculateCompletion,
    loading 
  } = useProfile();
  
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Define required fields with their display names
  const requiredFields = [
    { field: 'full_name', table: 'profiles', displayName: 'Full Name' },
    { field: 'country', table: 'profiles', displayName: 'Country' },
    { field: 'city', table: 'profiles', displayName: 'City' },
    { field: 'gender', table: 'profiles', displayName: 'Gender' },
    { field: 'timezone', table: 'profiles', displayName: 'Timezone' },
    { field: 'date_of_birth', table: 'profiles', displayName: 'Date of Birth' },
    { field: 'avatar_url', table: 'profiles', displayName: 'Profile Picture' },
    { field: 'operating_systems', table: 'user_devices', displayName: 'Operating Systems' },
    { field: 'devices_owned', table: 'user_devices', displayName: 'Devices Owned' },
    { field: 'mobile_manufacturers', table: 'user_devices', displayName: 'Mobile Manufacturers' },
    { field: 'email_clients', table: 'user_devices', displayName: 'Email Clients' },
    { field: 'education_level', table: 'profiles', displayName: 'Education Level' },
    { field: 'technical_experience_level', table: 'profiles', displayName: 'Technical Experience' },
    { field: 'ai_familiarity_level', table: 'profiles', displayName: 'AI Familiarity' },
    { field: 'ai_models_used', table: 'user_tech_fluency', displayName: 'AI Models Used' },
    { field: 'ai_interests', table: 'user_tech_fluency', displayName: 'AI Interests' },
  ];

  const validateRequiredFields = useCallback(() => {
    const missing: MissingField[] = [];

    requiredFields.forEach(({ field, table, displayName }) => {
      let value;
      
      switch (table) {
        case 'profiles':
          value = profileData[field as keyof typeof profileData];
          break;
        case 'user_devices':
          value = deviceData[field as keyof typeof deviceData];
          break;
        case 'user_tech_fluency':
          value = techFluencyData[field as keyof typeof techFluencyData];
          break;
        default:
          value = null;
      }

      const isEmpty = Array.isArray(value) 
        ? !value || value.length === 0 
        : !value || value.toString().trim() === '';

      if (isEmpty) {
        missing.push({ field, table, displayName });
      }
    });

    setMissingFields(missing);
    return missing;
  }, [profileData, deviceData, techFluencyData, requiredFields]);

  const checkCompletion = useCallback(async () => {
    try {
      setIsChecking(true);
      setCompletionError(null);

      // First validate required fields
      const missing = validateRequiredFields();
      
      console.log('Profile completion check:', {
        totalRequired: requiredFields.length,
        missing: missing.length,
        missingFields: missing.map(f => f.displayName),
        profileData: {
          completion_percentage: profileData.completion_percentage,
          full_name: profileData.full_name,
          country: profileData.country,
          city: profileData.city,
          gender: profileData.gender,
          timezone: profileData.timezone,
          date_of_birth: profileData.date_of_birth,
          avatar_url: profileData.avatar_url,
          education_level: profileData.education_level,
          technical_experience_level: profileData.technical_experience_level,
          ai_familiarity_level: profileData.ai_familiarity_level,
        },
        deviceData: {
          operating_systems: deviceData.operating_systems,
          devices_owned: deviceData.devices_owned,
          mobile_manufacturers: deviceData.mobile_manufacturers,
          email_clients: deviceData.email_clients,
        },
        techFluencyData: {
          ai_models_used: techFluencyData.ai_models_used,
          ai_interests: techFluencyData.ai_interests,
        }
      });

      if (missing.length > 0) {
        setCompletionError(`Missing required fields: ${missing.map(f => f.displayName).join(', ')}`);
        return false;
      }

      // Force recalculation and database update
      const completionPercentage = await calculateCompletion();
      
      console.log('Completion percentage after calculation:', completionPercentage);
      
      if (completionPercentage !== 100) {
        setCompletionError(`Profile completion is ${completionPercentage}%. Please ensure all required fields are filled.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setCompletionError('Failed to check profile completion. Please try again.');
      toast({
        title: "Error",
        description: "Failed to check profile completion. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [validateRequiredFields, calculateCompletion, profileData, deviceData, techFluencyData, toast]);

  const isProfileComplete = useCallback(() => {
    const missing = validateRequiredFields();
    return missing.length === 0 && (profileData.completion_percentage || 0) >= 100;
  }, [validateRequiredFields, profileData.completion_percentage]);

  return {
    isChecking: isChecking || loading,
    missingFields,
    completionError,
    checkCompletion,
    isProfileComplete: isProfileComplete(),
    requiredFieldsCount: requiredFields.length,
    completedFieldsCount: requiredFields.length - missingFields.length,
    completionPercentage: profileData.completion_percentage || 0
  };
};
