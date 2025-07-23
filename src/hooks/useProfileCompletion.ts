
import { useProfile } from '@/contexts/ProfileContext';

export const useProfileCompletion = () => {
  const { 
    profileData, 
    deviceData, 
    techFluencyData, 
    loading 
  } = useProfile();

  // Simple completion percentage calculation for display purposes only
  const calculateDisplayCompletion = () => {
    const fields = [
      profileData.full_name,
      profileData.country,
      profileData.city,
      profileData.gender,
      profileData.timezone,
      profileData.date_of_birth,
      profileData.avatar_url,
      deviceData.operating_systems,
      deviceData.devices_owned,
      deviceData.mobile_manufacturers,
      deviceData.email_clients,
      profileData.education_level,
      profileData.technical_experience_level,
      profileData.ai_familiarity_level,
      techFluencyData.ai_models_used,
      techFluencyData.ai_interests,
    ];

    const totalFields = fields.length;
    const completedFields = fields.filter(field => {
      if (Array.isArray(field)) {
        return field && field.length > 0;
      }
      return field && field.toString().trim() !== '';
    }).length;

    return Math.round((completedFields / totalFields) * 100);
  };

  const displayCompletion = calculateDisplayCompletion();

  return {
    isChecking: loading,
    completionPercentage: displayCompletion,
    requiredFieldsCount: 16,
    completedFieldsCount: Math.round((displayCompletion / 100) * 16)
  };
};
