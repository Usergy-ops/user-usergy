
/**
 * Enhanced profile completion utilities that integrate with the new database functions
 */

import { supabase } from '@/integrations/supabase/client';
import { handleDatabaseError, recordSystemMetric } from './enhancedMonitoring';

export interface ProfileCompletionResult {
  completionPercentage: number;
  isComplete: boolean;
  sectionScores: {
    basic_profile: number;
    devices: number;
    tech_fluency: number;
    skills: number;
    social_presence: number;
  };
  totalScore: number;
  maxScore: number;
  lastCalculated: Date;
}

// Type guard for profile completion data
function isValidProfileCompletionData(data: any): data is {
  completion_percentage: number;
  is_complete: boolean;
  section_scores: Record<string, number>;
  total_score: number;
  max_score: number;
  last_calculated: string;
} {
  return data && 
    typeof data.completion_percentage === 'number' &&
    typeof data.is_complete === 'boolean' &&
    typeof data.section_scores === 'object' &&
    typeof data.total_score === 'number' &&
    typeof data.max_score === 'number' &&
    typeof data.last_calculated === 'string';
}

export async function calculateEnhancedProfileCompletion(userId: string): Promise<ProfileCompletionResult> {
  try {
    // Use the enhanced database function for profile completion calculation
    const { data, error } = await supabase
      .rpc('calculate_profile_completion_enhanced', {
        user_uuid: userId
      });

    if (error) {
      throw new Error(`Profile completion calculation failed: ${error.message}`);
    }

    if (!isValidProfileCompletionData(data)) {
      throw new Error('Invalid profile completion data received from database');
    }

    // Record completion calculation metric
    await recordSystemMetric({
      metric_name: 'profile_completion_calculated',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        completion_percentage: data.completion_percentage.toString(),
        is_complete: data.is_complete.toString()
      },
      user_id: userId
    });

    return {
      completionPercentage: data.completion_percentage,
      isComplete: data.is_complete,
      sectionScores: {
        basic_profile: data.section_scores.basic_profile || 0,
        devices: data.section_scores.devices || 0,
        tech_fluency: data.section_scores.tech_fluency || 0,
        skills: data.section_scores.skills || 0,
        social_presence: data.section_scores.social_presence || 0
      },
      totalScore: data.total_score,
      maxScore: data.max_score,
      lastCalculated: new Date(data.last_calculated)
    };

  } catch (error) {
    console.error('Error calculating enhanced profile completion:', error);
    await handleDatabaseError(
      error as Error,
      'profiles',
      'completion_calculation',
      userId
    );

    // Return fallback result
    return {
      completionPercentage: 0,
      isComplete: false,
      sectionScores: {
        basic_profile: 0,
        devices: 0,
        tech_fluency: 0,
        skills: 0,
        social_presence: 0
      },
      totalScore: 0,
      maxScore: 100,
      lastCalculated: new Date()
    };
  }
}

export async function triggerProfileCompletionUpdate(userId: string): Promise<void> {
  try {
    // The database triggers will automatically update completion when profile data changes
    // This function can be used to manually trigger an update if needed
    const result = await calculateEnhancedProfileCompletion(userId);
    
    // Update the profiles table directly if needed (though triggers should handle this)
    const { error } = await supabase
      .from('profiles')
      .update({
        completion_percentage: result.completionPercentage,
        profile_completed: result.isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Profile completion update failed: ${error.message}`);
    }

    await recordSystemMetric({
      metric_name: 'profile_completion_manual_update',
      metric_value: 1,
      metric_type: 'counter',
      labels: {
        completion_percentage: result.completionPercentage.toString(),
        is_complete: result.isComplete.toString()
      },
      user_id: userId
    });

  } catch (error) {
    console.error('Error triggering profile completion update:', error);
    await handleDatabaseError(
      error as Error,
      'profiles',
      'completion_trigger',
      userId
    );
    throw error;
  }
}
