
/**
 * OAuth-specific profile service for handling Google OAuth users
 */

import { supabase } from '@/integrations/supabase/client';
import { trackUserAction } from '@/utils/monitoring';
import { handleCentralizedError } from '@/utils/centralizedErrorHandling';

export interface OAuthProfileData {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  provider: string;
  oauth_signup: boolean;
  account_type: 'client' | 'user';
  profile_completed: boolean;
}

export class OAuthProfileService {
  static async createOAuthProfile(user: any): Promise<{
    success: boolean;
    profile?: OAuthProfileData;
    error?: string;
  }> {
    try {
      console.log('Creating OAuth profile for user:', user.id);

      const profileData = {
        user_id: user.id, // This is required by the database schema
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create OAuth profile:', error);
        await handleCentralizedError(error, 'oauth_profile_creation', undefined, { user_id: user.id });
        return {
          success: false,
          error: 'Failed to create user profile'
        };
      }

      trackUserAction('oauth_profile_created', {
        user_id: user.id,
        provider: user.app_metadata?.provider || 'google',
        has_avatar: !!profileData.avatar_url
      });

      console.log('OAuth profile created successfully:', data);
      
      // Map database response to OAuthProfileData with OAuth-specific defaults
      const oauthProfile: OAuthProfileData = {
        id: data.id,
        email: data.email,
        full_name: data.full_name || undefined,
        avatar_url: data.avatar_url || undefined,
        provider: user.app_metadata?.provider || 'google', // Get from user metadata
        oauth_signup: true, // Always true for OAuth users
        account_type: 'client', // Default for OAuth users
        profile_completed: data.profile_completed || false
      };
      
      return {
        success: true,
        profile: oauthProfile
      };
    } catch (error) {
      console.error('OAuth profile creation error:', error);
      await handleCentralizedError(error as Error, 'oauth_profile_creation', undefined, { user_id: user.id });
      return {
        success: false,
        error: 'An unexpected error occurred while creating profile'
      };
    }
  }

  static async getOAuthProfile(userId: string): Promise<{
    success: boolean;
    profile?: OAuthProfileData;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return {
            success: false,
            error: 'Profile not found'
          };
        }
        
        console.error('Failed to fetch OAuth profile:', error);
        return {
          success: false,
          error: 'Failed to fetch profile'
        };
      }

      // Get user metadata for OAuth-specific information
      const { data: { user } } = await supabase.auth.getUser();

      // Map database response to OAuthProfileData with OAuth-specific defaults
      const oauthProfile: OAuthProfileData = {
        id: data.id,
        email: data.email,
        full_name: data.full_name || undefined,
        avatar_url: data.avatar_url || undefined,
        provider: user?.app_metadata?.provider || 'google', // Get from user metadata
        oauth_signup: true, // Assume true since we're in OAuth context
        account_type: 'client', // Default for OAuth users
        profile_completed: data.profile_completed || false
      };

      return {
        success: true,
        profile: oauthProfile
      };
    } catch (error) {
      console.error('OAuth profile fetch error:', error);
      await handleCentralizedError(error as Error, 'oauth_profile_fetch', undefined, { user_id: userId });
      return {
        success: false,
        error: 'An unexpected error occurred while fetching profile'
      };
    }
  }

  static async updateOAuthProfileCompletion(userId: string, completed: boolean = true): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_completed: completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update profile completion:', error);
        return {
          success: false,
          error: 'Failed to update profile completion status'
        };
      }

      trackUserAction('oauth_profile_completion_updated', {
        user_id: userId,
        completed
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Profile completion update error:', error);
      await handleCentralizedError(error as Error, 'oauth_profile_completion_update', undefined, { user_id: userId });
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }
}
