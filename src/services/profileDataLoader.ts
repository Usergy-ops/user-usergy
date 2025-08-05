
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleError } from '@/utils/unifiedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface ProfileDataResponse {
  profile: any;
  devices: any;
  techFluency: any;
  skills: any;
  socialPresence: any;
}

class ProfileDataLoader {
  async loadAll(userId: string): Promise<ProfileDataResponse> {
    console.log('Loading profile data for user:', userId);
    monitoring.startTiming('profile_load');

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'profile_load');
    if (!rateLimitResult.allowed) {
      throw new Error('Too many profile load requests. Please try again later.');
    }

    try {
      // Load all data in parallel using consolidated_social_presence
      const [profileResult, devicesResult, techResult, skillsResult, socialResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_devices').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_tech_fluency').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_skills').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('consolidated_social_presence').select('*').eq('user_id', userId).maybeSingle()
      ]);

      console.log('Profile data loaded:', {
        profile: profileResult.data,
        devices: devicesResult.data,
        techFluency: techResult.data,
        skills: skillsResult.data,
        socialPresence: socialResult.data
      });

      monitoring.endTiming('profile_load');
      
      trackUserAction('profile_loaded', {
        sections_completed: [
          profileResult.data?.section_1_completed,
          profileResult.data?.section_2_completed,
          profileResult.data?.section_3_completed,
          profileResult.data?.section_4_completed,
          profileResult.data?.section_5_completed,
          profileResult.data?.section_6_completed
        ].filter(Boolean).length,
        completion_percentage: profileResult.data?.completion_percentage || 0,
        profile_completed: profileResult.data?.profile_completed || false
      });

      return {
        profile: profileResult.data,
        devices: devicesResult.data,
        techFluency: techResult.data,
        skills: skillsResult.data,
        socialPresence: socialResult.data
      };
    } catch (error) {
      monitoring.endTiming('profile_load');
      throw error;
    }
  }
}

export const profileDataLoader = new ProfileDataLoader();
