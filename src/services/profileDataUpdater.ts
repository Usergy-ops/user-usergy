
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit } from '@/utils/rateLimit';
import { 
  validateProfileData, 
  validateDeviceData, 
  validateTechFluencyData, 
  validateSkillsData, 
  validateSocialPresenceData 
} from '@/utils/dataValidation';
import { handleError } from '@/utils/unifiedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import type { Database } from '@/integrations/supabase/types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

class ProfileDataUpdater {
  async updateSection(section: string, data: any, userId: string): Promise<void> {
    console.log(`Updating ${section} with data:`, data);
    monitoring.startTiming(`profile_update_${section}`);

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'profile_update');
    if (!rateLimitResult.allowed) {
      throw new Error('Too many profile update requests. Please try again later.');
    }

    try {
      // Validate data before updating
      const validationResult = this.validateSectionData(section, data);
      console.log(`Validation result for ${section}:`, validationResult);

      if (!validationResult.isValid) {
        const errorMessage = Array.isArray(validationResult.errors) 
          ? validationResult.errors.join(', ')
          : Object.values(validationResult.errors).join(', ');
        
        throw new Error(errorMessage);
      }

      await this.updateSectionInDatabase(section, data, userId);

      monitoring.endTiming(`profile_update_${section}`);
      
      trackUserAction('profile_updated', {
        section,
        data_keys: Object.keys(data),
        user_id: userId
      });

    } catch (error) {
      monitoring.endTiming(`profile_update_${section}`);
      throw error;
    }
  }

  private validateSectionData(section: string, data: any) {
    switch (section) {
      case 'profile':
        return validateProfileData(data);
      case 'devices':
        return validateDeviceData(data);
      case 'tech_fluency':
        return validateTechFluencyData(data);
      case 'skills':
        return validateSkillsData(data);
      case 'social_presence':
        return validateSocialPresenceData(data);
      default:
        return { isValid: true, errors: [] };
    }
  }

  private async updateSectionInDatabase(section: string, data: any, userId: string): Promise<void> {
    let updateResult;
    
    switch (section) {
      case 'profile':
        const { completion_percentage, ...profileDataToSave } = data;
        const profileUpdate: ProfileUpdate = profileDataToSave;
        
        updateResult = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', userId);
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        console.log('Profile updated successfully');
        break;

      case 'devices':
        updateResult = await supabase
          .from('user_devices')
          .upsert({ 
            user_id: userId, 
            ...data
          });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        console.log('Devices updated successfully');
        break;

      case 'tech_fluency':
        await this.updateTechFluencyWithFallback(userId, data);
        break;

      case 'skills':
        await this.updateSkillsWithFallback(userId, data);
        break;

      case 'social_presence':
        updateResult = await supabase
          .from('consolidated_social_presence')
          .upsert({ 
            user_id: userId, 
            ...data
          });
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        console.log('Social presence updated successfully');
        break;
    }
  }

  private async updateTechFluencyWithFallback(userId: string, data: any): Promise<void> {
    try {
      const updateResult = await supabase
        .from('user_tech_fluency')
        .upsert({ 
          user_id: userId, 
          ...data
        }, {
          onConflict: 'user_id'
        });
      
      if (updateResult.error) {
        throw updateResult.error;
      }
      
      console.log('Tech fluency updated successfully:', data);
    } catch (upsertError: any) {
      console.error('Tech fluency upsert error:', upsertError);
      
      // If upsert fails, try update first
      const existingResult = await supabase
        .from('user_tech_fluency')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let updateResult;
      if (existingResult.data) {
        // Record exists, update it
        updateResult = await supabase
          .from('user_tech_fluency')
          .update(data)
          .eq('user_id', userId);
      } else {
        // Record doesn't exist, insert it
        updateResult = await supabase
          .from('user_tech_fluency')
          .insert({ 
            user_id: userId, 
            ...data 
          });
      }
      
      if (updateResult.error) {
        throw updateResult.error;
      }
      
      console.log('Tech fluency updated successfully (fallback):', data);
    }
  }

  private async updateSkillsWithFallback(userId: string, data: any): Promise<void> {
    try {
      const updateResult = await supabase
        .from('user_skills')
        .upsert({ 
          user_id: userId, 
          ...data
        }, {
          onConflict: 'user_id'
        });
      
      if (updateResult.error) {
        throw updateResult.error;
      }
      
      console.log('Skills updated successfully');
    } catch (upsertError: any) {
      console.error('Skills upsert error:', upsertError);
      
      // If upsert fails, try update first
      const existingResult = await supabase
        .from('user_skills')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let updateResult;
      if (existingResult.data) {
        // Record exists, update it
        updateResult = await supabase
          .from('user_skills')
          .update(data)
          .eq('user_id', userId);
      } else {
        // Record doesn't exist, insert it
        updateResult = await supabase
          .from('user_skills')
          .insert({ 
            user_id: userId, 
            ...data 
          });
      }
      
      if (updateResult.error) {
        throw updateResult.error;
      }
      
      console.log('Skills updated successfully (fallback)');
    }
  }
}

export const profileDataUpdater = new ProfileDataUpdater();
