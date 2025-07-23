
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfileCompletionData {
  section_1_completed: boolean;
  section_2_completed: boolean;
  section_3_completed: boolean;
  section_4_completed: boolean;
  section_5_completed: boolean;
  section_6_completed: boolean;
  overall_completion_percentage: number;
}

export interface ProfileData {
  // Section 1: Basic Info
  full_name?: string;
  profile_picture_url?: string;
  location_country?: string;
  location_city?: string;
  contact_number?: string;
  date_of_birth?: string;
  gender?: string;
  
  // Section 2: Devices & Product Usage
  operating_systems?: string[];
  devices_owned?: string[];
  mobile_manufacturers?: string[];
  desktop_manufacturers?: string[];
  email_clients?: string[];
  streaming_subscriptions?: string[];
  music_subscriptions?: string[];
  
  // Section 3: Education & Work
  education_level?: string;
  field_of_study?: string;
  current_job_title?: string;
  current_employer?: string;
  industry?: string;
  work_role?: string;
  company_size?: string;
  household_income_range?: string;
  
  // Section 4: AI & Tech Fluency
  technical_experience_level?: string;
  ai_familiarity_level?: string;
  ai_interests?: string[];
  ai_models_used?: string[];
  programming_languages?: Record<string, string>;
  
  // Section 5: Social Presence
  linkedin_profile?: string;
  twitter_profile?: string;
  github_profile?: string;
  other_social_networks?: Record<string, string>;
  additional_links?: string[];
  
  // Section 6: Skills & Interests
  specific_skills?: Record<string, string>;
  product_categories?: string[];
  languages_spoken?: Record<string, string>;
  time_zone?: string;
  availability?: Record<string, any>;
  short_bio?: string;
}

export const useProfileCompletion = () => {
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile completion
      const { data: completionData, error: completionError } = await supabase
        .from('profile_completion')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (completionError && completionError.code !== 'PGRST116') {
        throw completionError;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profile_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfileCompletion(completionData || {
        section_1_completed: false,
        section_2_completed: false,
        section_3_completed: false,
        section_4_completed: false,
        section_5_completed: false,
        section_6_completed: false,
        overall_completion_percentage: 0
      });

      setProfileData(profileData || {});
    } catch (error) {
      console.error('Error fetching profile completion:', error);
      toast({
        title: "Error",
        description: "Failed to load profile completion data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (section: number, data: Partial<ProfileData>) => {
    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update profile data
      const { error: dataError } = await supabase
        .from('profile_data')
        .upsert({
          user_id: user.id,
          ...data
        });

      if (dataError) throw dataError;

      // Update completion status
      const completionUpdate = {
        [`section_${section}_completed`]: true,
        user_id: user.id
      };

      const { error: completionError } = await supabase
        .from('profile_completion')
        .upsert(completionUpdate);

      if (completionError) throw completionError;

      // Refresh data
      await fetchProfileCompletion();

      toast({
        title: "Success",
        description: `Section ${section} completed successfully!`
      });
    } catch (error) {
      console.error('Error updating profile data:', error);
      toast({
        title: "Error",
        description: "Failed to update profile data",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-picture.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProfileCompletion();
  }, []);

  return {
    profileCompletion,
    profileData,
    loading,
    updating,
    updateProfileData,
    uploadProfilePicture,
    refetch: fetchProfileCompletion
  };
};
