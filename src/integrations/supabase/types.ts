export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      auth_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          otp_code: string
          resend_count: number | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          otp_code: string
          resend_count?: number | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          otp_code?: string
          resend_count?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      profile_completion: {
        Row: {
          created_at: string | null
          id: string
          overall_completion_percentage: number | null
          section_1_completed: boolean | null
          section_2_completed: boolean | null
          section_3_completed: boolean | null
          section_4_completed: boolean | null
          section_5_completed: boolean | null
          section_6_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          overall_completion_percentage?: number | null
          section_1_completed?: boolean | null
          section_2_completed?: boolean | null
          section_3_completed?: boolean | null
          section_4_completed?: boolean | null
          section_5_completed?: boolean | null
          section_6_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          overall_completion_percentage?: number | null
          section_1_completed?: boolean | null
          section_2_completed?: boolean | null
          section_3_completed?: boolean | null
          section_4_completed?: boolean | null
          section_5_completed?: boolean | null
          section_6_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_data: {
        Row: {
          additional_links: string[] | null
          ai_familiarity_level: string | null
          ai_interests: string[] | null
          ai_models_used: string[] | null
          availability: Json | null
          company_size: string | null
          contact_number: string | null
          created_at: string | null
          current_employer: string | null
          current_job_title: string | null
          date_of_birth: string | null
          desktop_manufacturers: string[] | null
          devices_owned: string[] | null
          education_level: string | null
          email_clients: string[] | null
          field_of_study: string | null
          full_name: string | null
          gender: string | null
          github_profile: string | null
          household_income_range: string | null
          id: string
          industry: string | null
          languages_spoken: Json | null
          linkedin_profile: string | null
          location_city: string | null
          location_country: string | null
          mobile_manufacturers: string[] | null
          music_subscriptions: string[] | null
          operating_systems: string[] | null
          other_social_networks: Json | null
          product_categories: string[] | null
          profile_picture_url: string | null
          programming_languages: Json | null
          short_bio: string | null
          specific_skills: Json | null
          streaming_subscriptions: string[] | null
          technical_experience_level: string | null
          time_zone: string | null
          twitter_profile: string | null
          updated_at: string | null
          user_id: string
          work_role: string | null
        }
        Insert: {
          additional_links?: string[] | null
          ai_familiarity_level?: string | null
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          availability?: Json | null
          company_size?: string | null
          contact_number?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_job_title?: string | null
          date_of_birth?: string | null
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          education_level?: string | null
          email_clients?: string[] | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          github_profile?: string | null
          household_income_range?: string | null
          id?: string
          industry?: string | null
          languages_spoken?: Json | null
          linkedin_profile?: string | null
          location_city?: string | null
          location_country?: string | null
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          other_social_networks?: Json | null
          product_categories?: string[] | null
          profile_picture_url?: string | null
          programming_languages?: Json | null
          short_bio?: string | null
          specific_skills?: Json | null
          streaming_subscriptions?: string[] | null
          technical_experience_level?: string | null
          time_zone?: string | null
          twitter_profile?: string | null
          updated_at?: string | null
          user_id: string
          work_role?: string | null
        }
        Update: {
          additional_links?: string[] | null
          ai_familiarity_level?: string | null
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          availability?: Json | null
          company_size?: string | null
          contact_number?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_job_title?: string | null
          date_of_birth?: string | null
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          education_level?: string | null
          email_clients?: string[] | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          github_profile?: string | null
          household_income_range?: string | null
          id?: string
          industry?: string | null
          languages_spoken?: Json | null
          linkedin_profile?: string | null
          location_city?: string | null
          location_country?: string | null
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          other_social_networks?: Json | null
          product_categories?: string[] | null
          profile_picture_url?: string | null
          programming_languages?: Json | null
          short_bio?: string | null
          specific_skills?: Json | null
          streaming_subscriptions?: string[] | null
          technical_experience_level?: string | null
          time_zone?: string | null
          twitter_profile?: string | null
          updated_at?: string | null
          user_id?: string
          work_role?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          profile_completed: boolean | null
          profile_completion_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          profile_completed?: boolean | null
          profile_completion_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          profile_completed?: boolean | null
          profile_completion_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_completion_percentage: {
        Args: { user_id: string }
        Returns: number
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
