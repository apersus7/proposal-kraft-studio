export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brand_kits: {
        Row: {
          accent_color: string
          created_at: string
          font_primary: string
          font_secondary: string
          id: string
          is_default: boolean
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          font_primary?: string
          font_secondary?: string
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          font_primary?: string
          font_secondary?: string
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: string
          payment_method: string
          paypal_order_id: string | null
          plan_type: string
          status: string
          updated_at: string
          user_country: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method: string
          paypal_order_id?: string | null
          plan_type: string
          status?: string
          updated_at?: string
          user_country: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          paypal_order_id?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_country?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_analytics: {
        Row: {
          device_type: string | null
          id: string
          proposal_id: string
          section_viewed: string | null
          time_spent: number | null
          viewed_at: string
          viewer_ip: string | null
          viewer_location: string | null
        }
        Insert: {
          device_type?: string | null
          id?: string
          proposal_id: string
          section_viewed?: string | null
          time_spent?: number | null
          viewed_at?: string
          viewer_ip?: string | null
          viewer_location?: string | null
        }
        Update: {
          device_type?: string | null
          id?: string
          proposal_id?: string
          section_viewed?: string | null
          time_spent?: number | null
          viewed_at?: string
          viewer_ip?: string | null
          viewer_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_analytics_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          permissions: string
          proposal_id: string
          shared_with_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          permissions?: string
          proposal_id: string
          shared_with_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          permissions?: string
          proposal_id?: string
          shared_with_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_signatures: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          proposal_id: string
          signature_data: string | null
          signed_at: string | null
          signer_email: string
          signer_name: string
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id: string
          signature_data?: string | null
          signed_at?: string | null
          signer_email: string
          signer_name: string
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_email: string | null
          client_name: string
          content: Json | null
          created_at: string
          id: string
          last_viewed_at: string | null
          payment_status: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
          worth: number | null
        }
        Insert: {
          client_email?: string | null
          client_name: string
          content?: Json | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          payment_status?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
          worth?: number | null
        }
        Update: {
          client_email?: string | null
          client_name?: string
          content?: Json | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          payment_status?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
          worth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_proposal_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          permissions: string
          proposal_id: string
          share_token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          permissions?: string
          proposal_id: string
          share_token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          permissions?: string
          proposal_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "secure_proposal_shares_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paypal_subscription_id: string | null
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          industry: string
          is_public: boolean
          name: string
          preview_color: string | null
          preview_image_url: string | null
          tags: string[] | null
          template_data: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string
          is_public?: boolean
          name: string
          preview_color?: string | null
          preview_image_url?: string | null
          tags?: string[] | null
          template_data?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string
          is_public?: boolean
          name?: string
          preview_color?: string | null
          preview_image_url?: string | null
          tags?: string[] | null
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_payment_settings: {
        Row: {
          created_at: string
          id: string
          paypal_client_id: string | null
          paypal_client_secret: string | null
          paypal_environment: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_environment?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_environment?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
