
import { memoizeWithTTL, createBatchProcessor, withPerformanceMonitoring } from '@/utils/performance';
import { profileDataLoader } from './profileDataLoader';
import { profileDataUpdater } from './profileUpdater';
import { supabase } from '@/integrations/supabase/client';
import { calculateProfileCompletionPercentage } from '@/utils/profileCompletionUtils';

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

// Use the standardized completion calculator instead of the previous optimized one
export const standardizedCompletionCalculator = memoizeWithTTL(
  withPerformanceMonitoring((profileData: any, deviceData: any, techFluencyData: any, skillsData: any) => {
    return calculateProfileCompletionPercentage({
      profileData,
      deviceData,
      techFluencyData,
      skillsData
    });
  }, 'standardized_profile_completion_calculation'),
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
