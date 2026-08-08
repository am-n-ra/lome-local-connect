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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          campaign_active_until: string | null
          cost_fcfa: number
          created_at: string
          facility_id: string
          id: string
          is_city_wide: boolean
          product_ids: string[]
          radius_km: number | null
          reach_estimate: number
        }
        Insert: {
          campaign_active_until?: string | null
          cost_fcfa?: number
          created_at?: string
          facility_id: string
          id?: string
          is_city_wide?: boolean
          product_ids?: string[]
          radius_km?: number | null
          reach_estimate?: number
        }
        Update: {
          campaign_active_until?: string | null
          cost_fcfa?: number
          created_at?: string
          facility_id?: string
          id?: string
          is_city_wide?: boolean
          product_ids?: string[]
          radius_km?: number | null
          reach_estimate?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          price_at_time: number
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          id?: string
          price_at_time?: number
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          id?: string
          price_at_time?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          buyer_id: string
          created_at: string
          facility_id: string
          id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          facility_id: string
          id?: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          facility_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number
          facility_id: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          facility_id: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          facility_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_online: boolean
          last_position_update: string | null
          latitude: number
          longitude: number
          name: string
          owner_id: string | null
          phone: string | null
          status: string
          type: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_online?: boolean
          last_position_update?: string | null
          latitude: number
          longitude: number
          name: string
          owner_id?: string | null
          phone?: string | null
          status?: string
          type?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_online?: boolean
          last_position_update?: string | null
          latitude?: number
          longitude?: number
          name?: string
          owner_id?: string | null
          phone?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          in_stock: boolean
          last_confirmed_at: string | null
          name: string
          photo_url: string | null
          price: number
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          in_stock?: boolean
          last_confirmed_at?: string | null
          name: string
          photo_url?: string | null
          price?: number
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          in_stock?: boolean
          last_confirmed_at?: string | null
          name?: string
          photo_url?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          wallet_bonus_used: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string
          wallet_bonus_used?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          wallet_bonus_used?: boolean
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          facility_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          facility_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          facility_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          facility_id: string
          last_qualifying_action_month: string | null
          pro_active_until: string | null
          tier: string
          wallet_balance: number
        }
        Insert: {
          facility_id: string
          last_qualifying_action_month?: string | null
          pro_active_until?: string | null
          tier?: string
          wallet_balance?: number
        }
        Update: {
          facility_id?: string
          last_qualifying_action_month?: string | null
          pro_active_until?: string | null
          tier?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          search_term: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          search_term: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          search_term?: string
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
