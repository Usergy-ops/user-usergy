
import { memoizeWithTTL, createBatchProcessor, withPerformanceMonitoring } from '@/utils/performance';
import { profileDataLoader } from './profileDataLoader';
import { profileDataUpdater } from './profileUpdater';
import { supabase } from '@/integrations/supabase/client';

/**
 * Performance-optimized profile services with caching and batching
 */

// Memoized profile data loader with 5-minute cache
export const cachedProfileDataLoader = {
  loadAll: memoizeWithTTL(
    withPerformanceMonitoring(
      profileDataLoader.loadAll.bind(profileDataLoader),
      'cached_profile_load'
    ),
    300000 // 5 minutes
  )
};

// Batch processor for profile updates to reduce database calls
export const batchedProfileUpdater = createBatchProcessor(
  async (updates: Array<{ section: string; data: any; userId: string }>) => {
    console.log('Processing batch of profile updates:', updates.length);
    
    const results = await Promise.all(
      updates.map(async ({ section, data, userId }) => {
        try {
          await profileDataUpdater.updateSection(section, data, userId);
          return { success: true };
        } catch (error) {
          console.error(`Batch update failed for ${section}:`, error);
          return { success: false, error };
        }
      })
    );
    
    return results;
  },
  5, // Batch size
  1000 // 1 second delay
);

// Optimized profile completion calculator with caching
export const optimizedCompletionCalculator = memoizeWithTTL(
  withPerformanceMonitoring((profileData: any, deviceData: any, techData: any, skillsData: any) => {
    let score = 0;
    const maxScore = 100;
    
    // Basic profile info (30 points)
    if (profileData.full_name) score += 5;
    if (profileData.email) score += 5;
    if (profileData.bio) score += 5;
    if (profileData.city && profileData.country) score += 5;
    if (profileData.job_title) score += 5;
    if (profileData.company_size) score += 5;
    
    // Education and work (20 points)
    if (profileData.education_level) score += 5;
    if (profileData.field_of_study) score += 5;
    if (profileData.work_role) score += 5;
    if (profileData.technical_experience_level) score += 5;
    
    // Devices and tech (25 points)
    if (deviceData.devices_owned?.length) score += 10;
    if (deviceData.operating_systems?.length) score += 5;
    if (techData.programming_languages?.length) score += 5;
    if (techData.ai_models_used?.length) score += 5;
    
    // Skills and interests (25 points)
    if (skillsData.skills && Object.keys(skillsData.skills).length > 0) score += 15;
    if (skillsData.interests?.length) score += 5;
    if (skillsData.product_categories?.length) score += 5;
    
    return Math.min(score, maxScore);
  }, 'profile_completion_calculation'),
  180000 // 3 minutes cache
);

// Optimized profile picture upload with retry logic
export const optimizedProfilePictureUpload = withPerformanceMonitoring(
  async (file: File, userId: string, retries: number = 3): Promise<string> => {
    let attempt = 0;
    let lastError: Error;
    
    while (attempt < retries) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
        
        return data.publicUrl;
        
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  },
  'optimized_profile_picture_upload'
);

// Preload related profile data in background
export const preloadProfileDependencies = memoizeWithTTL(
  withPerformanceMonitoring(async (userId: string) => {
    // Preload data that might be needed soon
    const preloadPromises = [
      supabase.from('consolidated_social_presence').select('*').eq('user_id', userId).maybeSingle(),
      supabase.storage.from('profile-pictures').list(`${userId}/`, { limit: 1 })
    ];
    
    await Promise.allSettled(preloadPromises);
    
    console.log('Profile dependencies preloaded for user:', userId);
  }, 'preload_profile_dependencies'),
  600000 // 10 minutes cache
);
