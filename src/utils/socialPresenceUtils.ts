
/**
 * Social presence utilities for consolidating social media data
 */

import { supabase } from '@/integrations/supabase/client';
import { validateURL, normalizeURL } from './security';

export interface SocialPresenceData {
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  portfolio_url?: string;
  additional_links?: string[];
  other_social_networks?: Record<string, any>;
}

export interface ConsolidatedSocialPresence {
  primary_profiles: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  additional_links: string[];
  metadata: {
    last_updated: string;
    profiles_count: number;
    is_complete: boolean;
  };
}

/**
 * Validates social media URLs and returns validation results
 */
export const validateSocialUrls = (data: SocialPresenceData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate primary social profiles
  if (data.linkedin_url && !validateURL(data.linkedin_url)) {
    errors.linkedin_url = 'Please enter a valid LinkedIn URL';
  }
  
  if (data.github_url && !validateURL(data.github_url)) {
    errors.github_url = 'Please enter a valid GitHub URL';
  }
  
  if (data.twitter_url && !validateURL(data.twitter_url)) {
    errors.twitter_url = 'Please enter a valid Twitter/X URL';
  }
  
  if (data.portfolio_url && !validateURL(data.portfolio_url)) {
    errors.portfolio_url = 'Please enter a valid portfolio URL';
  }
  
  // Validate additional links
  if (data.additional_links) {
    data.additional_links.forEach((link, index) => {
      if (link && !validateURL(link)) {
        errors[`additional_link_${index}`] = `Additional link ${index + 1} is not a valid URL`;
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Normalizes social media URLs to ensure consistency
 */
export const normalizeSocialUrls = (data: SocialPresenceData): SocialPresenceData => {
  const normalized: SocialPresenceData = {};
  
  // Normalize primary profiles
  if (data.linkedin_url) {
    normalized.linkedin_url = normalizeURL(data.linkedin_url);
  }
  
  if (data.github_url) {
    normalized.github_url = normalizeURL(data.github_url);
  }
  
  if (data.twitter_url) {
    normalized.twitter_url = normalizeURL(data.twitter_url);
  }
  
  if (data.portfolio_url) {
    normalized.portfolio_url = normalizeURL(data.portfolio_url);
  }
  
  // Normalize additional links
  if (data.additional_links) {
    normalized.additional_links = data.additional_links
      .map(link => normalizeURL(link))
      .filter(link => link.length > 0);
  }
  
  // Preserve other social networks data
  if (data.other_social_networks) {
    normalized.other_social_networks = data.other_social_networks;
  }
  
  return normalized;
};

/**
 * Consolidates social presence data from multiple sources
 */
export const consolidateSocialPresence = (
  profileData: any,
  socialPresenceData: any
): ConsolidatedSocialPresence => {
  const primary_profiles: ConsolidatedSocialPresence['primary_profiles'] = {};
  const additional_links: string[] = [];
  
  // Extract primary profiles from profile data
  if (profileData.linkedin_url) primary_profiles.linkedin = profileData.linkedin_url;
  if (profileData.github_url) primary_profiles.github = profileData.github_url;
  if (profileData.twitter_url) primary_profiles.twitter = profileData.twitter_url;
  if (profileData.portfolio_url) primary_profiles.portfolio = profileData.portfolio_url;
  
  // Add additional links from social presence data
  if (socialPresenceData?.additional_links) {
    additional_links.push(...socialPresenceData.additional_links);
  }
  
  // Extract links from other social networks
  if (socialPresenceData?.other_social_networks) {
    Object.values(socialPresenceData.other_social_networks).forEach(link => {
      if (typeof link === 'string' && link.length > 0) {
        additional_links.push(link);
      }
    });
  }
  
  // Remove duplicates and empty links
  const uniqueAdditionalLinks = [...new Set(additional_links)].filter(link => 
    link && 
    link.length > 0 && 
    !Object.values(primary_profiles).includes(link)
  );
  
  const profiles_count = Object.keys(primary_profiles).length + uniqueAdditionalLinks.length;
  
  return {
    primary_profiles,
    additional_links: uniqueAdditionalLinks,
    metadata: {
      last_updated: new Date().toISOString(),
      profiles_count,
      is_complete: profiles_count > 0
    }
  };
};

/**
 * Saves consolidated social presence data to the database
 */
export const saveSocialPresence = async (
  userId: string,
  socialData: SocialPresenceData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate URLs first
    const validation = validateSocialUrls(socialData);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors).join(', ')
      };
    }
    
    // Normalize URLs
    const normalizedData = normalizeSocialUrls(socialData);
    
    // Update profile table with primary social links
    const profileUpdate = {
      linkedin_url: normalizedData.linkedin_url || null,
      github_url: normalizedData.github_url || null,
      twitter_url: normalizedData.twitter_url || null,
      portfolio_url: normalizedData.portfolio_url || null,
      section_5_completed: true,
      updated_at: new Date().toISOString()
    };
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', userId);
    
    if (profileError) {
      throw profileError;
    }
    
    // Update or insert social presence data
    const socialPresenceUpdate = {
      user_id: userId,
      additional_links: normalizedData.additional_links || [],
      other_social_networks: normalizedData.other_social_networks || {},
      updated_at: new Date().toISOString()
    };
    
    const { error: socialError } = await supabase
      .from('user_social_presence')
      .upsert(socialPresenceUpdate);
    
    if (socialError) {
      throw socialError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving social presence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save social presence'
    };
  }
};

/**
 * Loads consolidated social presence data from the database
 */
export const loadSocialPresence = async (
  userId: string
): Promise<{ data: ConsolidatedSocialPresence | null; error?: string }> => {
  try {
    // Load profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('linkedin_url, github_url, twitter_url, portfolio_url')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Load social presence data
    const { data: socialData, error: socialError } = await supabase
      .from('user_social_presence')
      .select('additional_links, other_social_networks')
      .eq('user_id', userId)
      .single();
    
    if (socialError && socialError.code !== 'PGRST116') {
      throw socialError;
    }
    
    // Consolidate the data
    const consolidatedData = consolidateSocialPresence(
      profileData || {},
      socialData || {}
    );
    
    return { data: consolidatedData };
  } catch (error) {
    console.error('Error loading social presence:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load social presence'
    };
  }
};
