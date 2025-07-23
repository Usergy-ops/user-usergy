
import { supabase } from '@/integrations/supabase/client';
import { validateAndCleanData, validateRequiredFields } from '@/utils/dataValidation';
import { handleProfileError } from '@/utils/profileErrors';

export interface SimpleProfileData {
  [key: string]: any;
}

export class ProfileService {
  static async saveProfileData(section: string, data: SimpleProfileData, userId: string, userEmail: string) {
    try {
      console.log(`[ProfileService] Saving ${section} data for user ${userId}:`, data);
      
      // Clean and validate data
      const cleanedData = validateAndCleanData(data);
      
      // If no valid data after cleaning, return success (nothing to save)
      if (Object.keys(cleanedData).length === 0) {
        console.log(`[ProfileService] No valid data to save for ${section}`);
        return;
      }

      let result;
      const baseData = { user_id: userId };
      
      switch (section) {
        case 'profile':
          result = await supabase
            .from('profiles')
            .upsert({ 
              ...baseData,
              email: userEmail,
              ...cleanedData
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          break;

        case 'devices':
          result = await supabase
            .from('user_devices')
            .upsert({ 
              ...baseData,
              ...cleanedData
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          break;

        case 'tech_fluency':
          result = await supabase
            .from('user_tech_fluency')
            .upsert({ 
              ...baseData,
              ...cleanedData
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          break;

        case 'skills':
          result = await supabase
            .from('user_skills')
            .upsert({ 
              ...baseData,
              ...cleanedData
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          break;

        case 'social_presence':
          result = await supabase
            .from('user_social_presence')
            .upsert({ 
              ...baseData,
              ...cleanedData
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          break;

        default:
          throw new Error(`Unknown section: ${section}`);
      }

      if (result.error) {
        console.error(`[ProfileService] Supabase error for ${section}:`, result.error);
        throw handleProfileError(result.error);
      }

      console.log(`[ProfileService] Successfully saved ${section} data`);
      return result.data;
    } catch (error) {
      console.error(`[ProfileService] Error saving ${section}:`, error);
      throw handleProfileError(error);
    }
  }
}
