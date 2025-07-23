
import { supabase } from '@/integrations/supabase/client';

export class SimpleProfileService {
  static async saveProfile(userId: string, userEmail: string, data: any) {
    try {
      console.log('[SimpleProfileService] Saving profile data:', data);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: userId,
          email: userEmail,
          ...data
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SimpleProfileService] Profile save error:', error);
        throw new Error(`Profile save failed: ${error.message}`);
      }

      console.log('[SimpleProfileService] Profile saved successfully');
    } catch (error) {
      console.error('[SimpleProfileService] Save error:', error);
      throw error;
    }
  }

  static async saveDevices(userId: string, data: any) {
    try {
      console.log('[SimpleProfileService] Saving devices data:', data);
      
      const { error } = await supabase
        .from('user_devices')
        .upsert({ 
          user_id: userId,
          ...data
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SimpleProfileService] Devices save error:', error);
        throw new Error(`Devices save failed: ${error.message}`);
      }

      console.log('[SimpleProfileService] Devices saved successfully');
    } catch (error) {
      console.error('[SimpleProfileService] Devices save error:', error);
      throw error;
    }
  }

  static async saveTechFluency(userId: string, data: any) {
    try {
      console.log('[SimpleProfileService] Saving tech fluency data:', data);
      
      // Convert programming_languages array to jsonb format for database
      const processedData = {
        ...data,
        programming_languages: data.programming_languages ? JSON.stringify(data.programming_languages) : null
      };
      
      const { error } = await supabase
        .from('user_tech_fluency')
        .upsert({ 
          user_id: userId,
          ...processedData
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SimpleProfileService] Tech fluency save error:', error);
        throw new Error(`Tech fluency save failed: ${error.message}`);
      }

      console.log('[SimpleProfileService] Tech fluency saved successfully');
    } catch (error) {
      console.error('[SimpleProfileService] Tech fluency save error:', error);
      throw error;
    }
  }

  static async saveSkills(userId: string, data: any) {
    try {
      console.log('[SimpleProfileService] Saving skills data:', data);
      
      const { error } = await supabase
        .from('user_skills')
        .upsert({ 
          user_id: userId,
          ...data
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SimpleProfileService] Skills save error:', error);
        throw new Error(`Skills save failed: ${error.message}`);
      }

      console.log('[SimpleProfileService] Skills saved successfully');
    } catch (error) {
      console.error('[SimpleProfileService] Skills save error:', error);
      throw error;
    }
  }

  static async saveSocialPresence(userId: string, data: any) {
    try {
      console.log('[SimpleProfileService] Saving social presence data:', data);
      
      const { error } = await supabase
        .from('user_social_presence')
        .upsert({ 
          user_id: userId,
          ...data
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SimpleProfileService] Social presence save error:', error);
        throw new Error(`Social presence save failed: ${error.message}`);
      }

      console.log('[SimpleProfileService] Social presence saved successfully');
    } catch (error) {
      console.error('[SimpleProfileService] Social presence save error:', error);
      throw error;
    }
  }
}
