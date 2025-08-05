
/**
 * Handles profile section updates in the database
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProfileUpdate } from './types';

export class ProfileSectionUpdater {
  async updateProfile(data: any, userId: string): Promise<void> {
    const { completion_percentage, ...profileDataToSave } = data;
    const profileUpdate: ProfileUpdate = profileDataToSave;
    
    const updateResult = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', userId);
    
    if (updateResult.error) {
      throw updateResult.error;
    }
    
    console.log('Profile updated successfully');
  }

  async updateDevices(data: any, userId: string): Promise<void> {
    const updateResult = await supabase
      .from('user_devices')
      .upsert({ 
        user_id: userId, 
        ...data
      });
    
    if (updateResult.error) {
      throw updateResult.error;
    }
    
    console.log('Devices updated successfully');
  }

  async updateSocialPresence(data: any, userId: string): Promise<void> {
    const updateResult = await supabase
      .from('consolidated_social_presence')
      .upsert({ 
        user_id: userId, 
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (updateResult.error) {
      throw updateResult.error;
    }
    
    console.log('Social presence updated successfully');
  }
}

export const profileSectionUpdater = new ProfileSectionUpdater();
