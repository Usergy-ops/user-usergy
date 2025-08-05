
/**
 * Specialized updater for tech fluency data with fallback handling
 */

import { supabase } from '@/integrations/supabase/client';

export class TechFluencyUpdater {
  async updateTechFluency(userId: string, data: any): Promise<void> {
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
      
      // Fallback: try update/insert separately
      await this.updateWithFallback(userId, data);
    }
  }

  private async updateWithFallback(userId: string, data: any): Promise<void> {
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

export const techFluencyUpdater = new TechFluencyUpdater();
