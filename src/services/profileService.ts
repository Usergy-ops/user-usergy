
import { supabase } from '@/integrations/supabase/client';

export interface SimpleProfileData {
  [key: string]: any;
}

export class ProfileService {
  private static savingInProgress = false;

  static async saveProfileData(section: string, data: SimpleProfileData, userId: string, userEmail: string) {
    // Prevent concurrent saves
    if (this.savingInProgress) {
      throw new Error('Save already in progress');
    }

    this.savingInProgress = true;
    
    try {
      // Clean the data - remove null, undefined, and empty strings
      const cleanedData: SimpleProfileData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanedData[key] = value;
        }
      });

      // If no valid data, don't save
      if (Object.keys(cleanedData).length === 0) {
        return;
      }

      let result;
      
      switch (section) {
        case 'profile':
          result = await supabase
            .from('profiles')
            .upsert({ 
              user_id: userId, 
              email: userEmail,
              ...cleanedData
            }, { onConflict: 'user_id' });
          break;

        case 'devices':
          result = await supabase
            .from('user_devices')
            .upsert({ 
              user_id: userId, 
              ...cleanedData
            }, { onConflict: 'user_id' });
          break;

        case 'tech_fluency':
          result = await supabase
            .from('user_tech_fluency')
            .upsert({ 
              user_id: userId, 
              ...cleanedData
            }, { onConflict: 'user_id' });
          break;

        case 'skills':
          result = await supabase
            .from('user_skills')
            .upsert({ 
              user_id: userId, 
              ...cleanedData
            }, { onConflict: 'user_id' });
          break;

        case 'social_presence':
          result = await supabase
            .from('user_social_presence')
            .upsert({ 
              user_id: userId, 
              ...cleanedData
            }, { onConflict: 'user_id' });
          break;

        default:
          throw new Error(`Unknown section: ${section}`);
      }

      if (result.error) {
        console.error(`Error saving ${section}:`, result.error);
        throw new Error(`Failed to save ${section}: ${result.error.message}`);
      }

      console.log(`Successfully saved ${section} data`);
    } finally {
      this.savingInProgress = false;
    }
  }
}
