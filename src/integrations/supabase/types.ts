export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          age: number | null
          ai_familiarity_level: string | null
          availability_hours: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_size: string | null
          completion_percentage: number | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          education_level: string | null
          email: string
          employer: string | null
          field_of_study: string | null
          full_name: string | null
          gender: string | null
          github_url: string | null
          household_income_range: string | null
          id: string
          industry: string | null
          job_title: string | null
          languages_spoken: string[] | null
          linkedin_url: string | null
          phone_number: string | null
          portfolio_url: string | null
          profile_completed: boolean | null
          section_1_completed: boolean | null
          section_2_completed: boolean | null
          section_3_completed: boolean | null
          section_4_completed: boolean | null
          section_5_completed: boolean | null
          section_6_completed: boolean | null
          technical_experience_level: string | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          work_role: string | null
        }
        Insert: {
          age?: number | null
          ai_familiarity_level?: string | null
          availability_hours?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_size?: string | null
          completion_percentage?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          email: string
          employer?: string | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          household_income_range?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          languages_spoken?: string[] | null
          linkedin_url?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          profile_completed?: boolean | null
          section_1_completed?: boolean | null
          section_2_completed?: boolean | null
          section_3_completed?: boolean | null
          section_4_completed?: boolean | null
          section_5_completed?: boolean | null
          section_6_completed?: boolean | null
          technical_experience_level?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          work_role?: string | null
        }
        Update: {
          age?: number | null
          ai_familiarity_level?: string | null
          availability_hours?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_size?: string | null
          completion_percentage?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          email?: string
          employer?: string | null
          field_of_study?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          household_income_range?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          languages_spoken?: string[] | null
          linkedin_url?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          profile_completed?: boolean | null
          section_1_completed?: boolean | null
          section_2_completed?: boolean | null
          section_3_completed?: boolean | null
          section_4_completed?: boolean | null
          section_5_completed?: boolean | null
          section_6_completed?: boolean | null
          technical_experience_level?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          work_role?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          desktop_manufacturers: string[] | null
          devices_owned: string[] | null
          email_clients: string[] | null
          id: string
          mobile_manufacturers: string[] | null
          music_subscriptions: string[] | null
          operating_systems: string[] | null
          streaming_subscriptions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          email_clients?: string[] | null
          id?: string
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          streaming_subscriptions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          email_clients?: string[] | null
          id?: string
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          streaming_subscriptions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_otp_verification: {
        Row: {
          attempts: number | null
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string
          id: string
          interests: string[] | null
          product_categories: string[] | null
          skills: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[] | null
          product_categories?: string[] | null
          skills?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[] | null
          product_categories?: string[] | null
          skills?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_social_presence: {
        Row: {
          additional_links: string[] | null
          created_at: string
          id: string
          other_social_networks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_links?: string[] | null
          created_at?: string
          id?: string
          other_social_networks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_links?: string[] | null
          created_at?: string
          id?: string
          other_social_networks?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_tech_fluency: {
        Row: {
          ai_interests: string[] | null
          ai_models_used: string[] | null
          coding_experience_years: number | null
          created_at: string
          id: string
          programming_languages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          coding_experience_years?: number | null
          created_at?: string
          id?: string
          programming_languages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          coding_experience_years?: number | null
          created_at?: string
          id?: string
          programming_languages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tech_fluency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_updated_at_column: {
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
