
/**
 * Types for profile update operations
 */

import type { Database } from '@/integrations/supabase/types';

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UpdateResult {
  success: boolean;
  error?: string;
}

export interface SectionUpdateData {
  section: string;
  data: any;
  userId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[] | Record<string, string>;
}
