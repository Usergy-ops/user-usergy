
/**
 * Specialized updater for skills data with fallback handling
 */

import { supabase } from '@/integrations/supabase/client';

export class SkillsUpdater {
  async updateSkills(userId: string, data: any): Promise<void> {
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
      
      // Fallback: try update/insert separately
      await this.updateWithFallback(userId, data);
    }
  }

  private async updateWithFallback(userId: string, data: any): Promise<void> {
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

export const skillsUpdater = new SkillsUpdater();
