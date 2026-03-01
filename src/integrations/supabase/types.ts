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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      payment_links: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          link_url: string
          proposal_id: string | null
          provider: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          link_url: string
          proposal_id?: string | null
          provider: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          link_url?: string
          proposal_id?: string | null
          provider?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          case_studies: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          logo_url: string | null
          onboarded: boolean | null
          paypal_key: string | null
          phone: string | null
          razorpay_key: string | null
          services: string | null
          stripe_key: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          case_studies?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          onboarded?: boolean | null
          paypal_key?: string | null
          phone?: string | null
          razorpay_key?: string | null
          services?: string | null
          stripe_key?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          case_studies?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          onboarded?: boolean | null
          paypal_key?: string | null
          phone?: string | null
          razorpay_key?: string | null
          services?: string | null
          stripe_key?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      proposal_analytics: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          section_viewed: string | null
          time_spent: number | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          section_viewed?: string | null
          time_spent?: number | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          section_viewed?: string | null
          time_spent?: number | null
          viewer_ip?: string | null
        }
        Relationships: []
      }
      proposal_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          permissions: string | null
          proposal_id: string
          shared_with_email: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          permissions?: string | null
          proposal_id: string
          shared_with_email?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          permissions?: string | null
          proposal_id?: string
          shared_with_email?: string | null
        }
        Relationships: []
      }
      proposal_signatures: {
        Row: {
          created_at: string
          id: string
          order_index: number | null
          proposal_id: string
          signature_data: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number | null
          proposal_id: string
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number | null
          proposal_id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      secure_proposal_shares: {
        Row: {
          content_snapshot: Json | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          permissions: Json | null
          proposal_id: string
          share_token: string
        }
        Insert: {
          content_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          permissions?: Json | null
          proposal_id: string
          share_token?: string
        }
        Update: {
          content_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          permissions?: Json | null
          proposal_id?: string
          share_token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          is_paid: boolean
          is_trial: boolean
          plan_type: string | null
          status: string
          updated_at: string
          user_id: string
          whop_membership_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          is_paid?: boolean
          is_trial?: boolean
          plan_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
          whop_membership_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          is_paid?: boolean
          is_trial?: boolean
          plan_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          whop_membership_id?: string | null
        }
        Relationships: []
      }
      user_payment_settings: {
        Row: {
          created_at: string
          id: string
          paypal_client_id_custom: string | null
          paypal_merchant_id: string | null
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paypal_client_id_custom?: string | null
          paypal_merchant_id?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paypal_client_id_custom?: string | null
          paypal_merchant_id?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
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
