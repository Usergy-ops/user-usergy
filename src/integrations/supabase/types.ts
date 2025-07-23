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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
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
      project_applications: {
        Row: {
          applied_at: string
          id: string
          message: string | null
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          message?: string | null
          project_id: string
          status?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          message?: string | null
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          message: string | null
          project_id: string
          status: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          invited_by: string
          message?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          message?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["invitation_status_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_participants: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          completion_percentage: number | null
          earned_amount: number | null
          id: string
          joined_at: string
          project_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          earned_amount?: number | null
          id?: string
          joined_at?: string
          project_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          earned_amount?: number | null
          id?: string
          joined_at?: string
          project_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category_enum"]
          client_avatar_url: string | null
          client_name: string
          created_at: string
          current_participants: number | null
          deadline: string | null
          description: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id: string
          is_public: boolean | null
          max_participants: number | null
          required_skills: string[] | null
          reward_amount: number
          status: Database["public"]["Enums"]["project_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["project_category_enum"]
          client_avatar_url?: string | null
          client_name: string
          created_at?: string
          current_participants?: number | null
          deadline?: string | null
          description: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          required_skills?: string[] | null
          reward_amount: number
          status?: Database["public"]["Enums"]["project_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category_enum"]
          client_avatar_url?: string | null
          client_name?: string
          created_at?: string
          current_participants?: number | null
          deadline?: string | null
          description?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          required_skills?: string[] | null
          reward_amount?: number
          status?: Database["public"]["Enums"]["project_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string | null
          desktop_manufacturers: string[] | null
          devices_owned: string[] | null
          email_clients: string[] | null
          id: string
          mobile_manufacturers: string[] | null
          music_subscriptions: string[] | null
          operating_systems: string[] | null
          streaming_subscriptions: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          email_clients?: string[] | null
          id?: string
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          streaming_subscriptions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          desktop_manufacturers?: string[] | null
          devices_owned?: string[] | null
          email_clients?: string[] | null
          id?: string
          mobile_manufacturers?: string[] | null
          music_subscriptions?: string[] | null
          operating_systems?: string[] | null
          streaming_subscriptions?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_otp_verification: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_otps: {
        Row: {
          attempts: number | null
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          otp_type: string
          used: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          otp_type?: string
          used?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          otp_type?: string
          used?: boolean | null
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string | null
          id: string
          interests: string[] | null
          product_categories: string[] | null
          skills: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interests?: string[] | null
          product_categories?: string[] | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interests?: string[] | null
          product_categories?: string[] | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_social_presence: {
        Row: {
          additional_links: string[] | null
          created_at: string | null
          id: string
          other_social_networks: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_links?: string[] | null
          created_at?: string | null
          id?: string
          other_social_networks?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_links?: string[] | null
          created_at?: string | null
          id?: string
          other_social_networks?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_social_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          created_at: string | null
          id: string
          programming_languages: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          coding_experience_years?: number | null
          created_at?: string | null
          id?: string
          programming_languages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_interests?: string[] | null
          ai_models_used?: string[] | null
          coding_experience_years?: number | null
          created_at?: string | null
          id?: string
          programming_languages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tech_fluency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      calculate_profile_completion: {
        Args: { profile_user_id: string }
        Returns: number
      }
    }
    Enums: {
      difficulty_level_enum: "beginner" | "intermediate" | "advanced" | "expert"
      invitation_status_enum: "pending" | "accepted" | "declined" | "expired"
      project_category_enum:
        | "ai_ml"
        | "mobile_apps"
        | "web_platforms"
        | "blockchain"
        | "data_science"
        | "ui_ux"
        | "other"
      project_status_enum: "active" | "completed" | "cancelled" | "pending"
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
    Enums: {
      difficulty_level_enum: ["beginner", "intermediate", "advanced", "expert"],
      invitation_status_enum: ["pending", "accepted", "declined", "expired"],
      project_category_enum: [
        "ai_ml",
        "mobile_apps",
        "web_platforms",
        "blockchain",
        "data_science",
        "ui_ux",
        "other",
      ],
      project_status_enum: ["active", "completed", "cancelled", "pending"],
    },
  },
} as const
