
/**
 * Consolidated social presence utilities using the new database structure
 */

import { supabase } from '@/integrations/supabase/client';
import { validateURL, normalizeURL } from './security';
import { handleCentralizedError, createValidationError, createDatabaseError } from './centralizedErrorHandling';
import type { Json } from '@/integrations/supabase/types';

export interface ConsolidatedSocialPresenceData {
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  portfolio_url?: string;
  additional_links?: string[];
  other_social_networks?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ConsolidatedSocialPresenceResult {
  primary_profiles: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  additional_links: string[];
  other_social_networks: Record<string, any>;
  metadata: {
    last_updated: string;
    profiles_count: number;
    is_complete: boolean;
  };
}

// Enhanced type guard for metadata objects
const isMetadataObject = (value: Json): value is Record<string, Json> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Enhanced type guard for other social networks
const isOtherSocialNetworksObject = (value: Json): value is Record<string, Json> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Safe accessor for nested Json properties
const getJsonProperty = (obj: Json, key: string): Json | undefined => {
  if (isMetadataObject(obj)) {
    return obj[key];
  }
  return undefined;
};

// Safe number extraction from Json
const getNumberFromJson = (value: Json): number => {
  if (typeof value === 'number') {
    return value;
  }
  return 0;
};

/**
 * Validates social media URLs and returns validation results
 */
export const validateConsolidatedSocialUrls = (
  data: ConsolidatedSocialPresenceData,
  userId?: string
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  try {
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
  } catch (error) {
    handleCentralizedError(error as Error, 'social_url_validation', userId);
    throw createValidationError('Failed to validate social URLs', 'social_urls', userId);
  }
};

/**
 * Normalizes social media URLs to ensure consistency
 */
export const normalizeConsolidatedSocialUrls = (
  data: ConsolidatedSocialPresenceData,
  userId?: string
): ConsolidatedSocialPresenceData => {
  try {
    const normalized: ConsolidatedSocialPresenceData = {};
    
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
    
    // Preserve other data
    if (data.other_social_networks) {
      normalized.other_social_networks = data.other_social_networks;
    }
    
    if (data.metadata) {
      normalized.metadata = data.metadata;
    }
    
    return normalized;
  } catch (error) {
    handleCentralizedError(error as Error, 'social_url_normalization', userId);
    throw createValidationError('Failed to normalize social URLs', 'social_urls', userId);
  }
};

/**
 * Saves consolidated social presence data to the database
 */
export const saveConsolidatedSocialPresence = async (
  userId: string,
  socialData: ConsolidatedSocialPresenceData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate URLs first
    const validation = validateConsolidatedSocialUrls(socialData, userId);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors).join(', ')
      };
    }
    
    // Normalize URLs
    const normalizedData = normalizeConsolidatedSocialUrls(socialData, userId);
    
    // Prepare data for insertion/update
    const dataToSave = {
      user_id: userId,
      linkedin_url: normalizedData.linkedin_url || null,
      github_url: normalizedData.github_url || null,
      twitter_url: normalizedData.twitter_url || null,
      portfolio_url: normalizedData.portfolio_url || null,
      additional_links: normalizedData.additional_links || [],
      other_social_networks: normalizedData.other_social_networks || {},
      metadata: {
        ...normalizedData.metadata,
        last_updated: new Date().toISOString(),
        profiles_count: Object.values({
          linkedin: normalizedData.linkedin_url,
          github: normalizedData.github_url,
          twitter: normalizedData.twitter_url,
          portfolio: normalizedData.portfolio_url
        }).filter(Boolean).length + (normalizedData.additional_links?.length || 0)
      },
      updated_at: new Date().toISOString()
    };
    
    // Upsert to consolidated table
    const { error } = await supabase
      .from('consolidated_social_presence')
      .upsert(dataToSave);
    
    if (error) {
      throw createDatabaseError(error.message, 'save_consolidated_social_presence', userId);
    }
    
    return { success: true };
  } catch (error) {
    await handleCentralizedError(error as Error, 'save_consolidated_social_presence', userId);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save social presence'
    };
  }
};

/**
 * Loads consolidated social presence data from the database
 */
export const loadConsolidatedSocialPresence = async (
  userId: string
): Promise<{ data: ConsolidatedSocialPresenceResult | null; error?: string }> => {
  try {
    // Load consolidated data
    const { data, error } = await supabase
      .from('consolidated_social_presence')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw createDatabaseError(error.message, 'load_consolidated_social_presence', userId);
    }
    
    if (!data) {
      return { data: null };
    }
    
    // Safely extract metadata with improved type guards
    const metadata = isMetadataObject(data.metadata) ? data.metadata : {};
    const otherSocialNetworks = isOtherSocialNetworksObject(data.other_social_networks) ? data.other_social_networks : {};
    
    // Safe extraction of profiles_count from metadata
    const profilesCountValue = getJsonProperty(metadata, 'profiles_count');
    const profilesCount = getNumberFromJson(profilesCountValue);
    
    // Transform data to result format
    const result: ConsolidatedSocialPresenceResult = {
      primary_profiles: {
        linkedin: data.linkedin_url || undefined,
        github: data.github_url || undefined,
        twitter: data.twitter_url || undefined,
        portfolio: data.portfolio_url || undefined
      },
      additional_links: Array.isArray(data.additional_links) ? data.additional_links : [],
      other_social_networks: otherSocialNetworks,
      metadata: {
        last_updated: data.updated_at || new Date().toISOString(),
        profiles_count: profilesCount,
        is_complete: profilesCount > 0
      }
    };
    
    return { data: result };
  } catch (error) {
    await handleCentralizedError(error as Error, 'load_consolidated_social_presence', userId);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load social presence'
    };
  }
};

/**
 * Migrates existing social presence data to consolidated table
 */
export const migrateToConsolidatedSocialPresence = async (userId: string): Promise<void> => {
  try {
    // Load existing profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('linkedin_url, github_url, twitter_url, portfolio_url')
      .eq('user_id', userId)
      .single();
    
    // Load existing social presence data
    const { data: socialData } = await supabase
      .from('user_social_presence')
      .select('additional_links, other_social_networks')
      .eq('user_id', userId)
      .single();
    
    // Safely extract other social networks
    const otherSocialNetworks = socialData && isOtherSocialNetworksObject(socialData.other_social_networks) 
      ? socialData.other_social_networks 
      : {};
    
    // Combine data
    const consolidatedData: ConsolidatedSocialPresenceData = {
      linkedin_url: profileData?.linkedin_url || undefined,
      github_url: profileData?.github_url || undefined,
      twitter_url: profileData?.twitter_url || undefined,
      portfolio_url: profileData?.portfolio_url || undefined,
      additional_links: Array.isArray(socialData?.additional_links) ? socialData.additional_links : [],
      other_social_networks: otherSocialNetworks
    };
    
    // Save to consolidated table
    await saveConsolidatedSocialPresence(userId, consolidatedData);
  } catch (error) {
    await handleCentralizedError(error as Error, 'migrate_consolidated_social_presence', userId);
    throw error;
  }
};
