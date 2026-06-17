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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      chef_categories: {
        Row: {
          category_id: string
          chef_id: string
        }
        Insert: {
          category_id: string
          chef_id: string
        }
        Update: {
          category_id?: string
          chef_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_items: {
        Row: {
          available: boolean
          chef_id: string
          created_at: string
          id: string
          item_id: string
          lead_time_hours: number
          price: number
          unit_mode: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          chef_id: string
          created_at?: string
          id?: string
          item_id: string
          lead_time_hours?: number
          price: number
          unit_mode?: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          chef_id?: string
          created_at?: string
          id?: string
          item_id?: string
          lead_time_hours?: number
          price?: number
          unit_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_profiles: {
        Row: {
          address: string | null
          address_details: string | null
          ai_id_check: Json | null
          bio: string | null
          created_at: string
          health_cert_url: string | null
          id_back_url: string | null
          id_front_url: string | null
          lat: number | null
          lng: number | null
          max_orders_per_day: number | null
          payment_account: string | null
          payment_method: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          address_details?: string | null
          ai_id_check?: Json | null
          bio?: string | null
          created_at?: string
          health_cert_url?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          lat?: number | null
          lng?: number | null
          max_orders_per_day?: number | null
          payment_account?: string | null
          payment_method?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          address_details?: string | null
          ai_id_check?: Json | null
          bio?: string | null
          created_at?: string
          health_cert_url?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          lat?: number | null
          lng?: number | null
          max_orders_per_day?: number | null
          payment_account?: string | null
          payment_method?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address: string | null
          created_at: string
          details: string | null
          id: string
          is_default: boolean
          label: string
          lat: number | null
          lng: number | null
          user_id: string
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          details?: string | null
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          user_id: string
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          details?: string | null
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_id: string | null
          distance_km: number | null
          earnings: number
          id: string
          order_id: string
          picked_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_id?: string | null
          distance_km?: number | null
          earnings?: number
          id?: string
          order_id: string
          picked_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_id?: string | null
          distance_km?: number | null
          earnings?: number
          id?: string
          order_id?: string
          picked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_profiles: {
        Row: {
          ai_id_check: Json | null
          created_at: string
          driving_license_url: string | null
          id_back_url: string | null
          id_front_url: string | null
          is_online: boolean
          rejection_reason: string | null
          reviewed_at: string | null
          submitted_at: string | null
          total_earnings: number
          updated_at: string
          user_id: string
          vehicle_license_url: string | null
          vehicle_photo_url: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          ai_id_check?: Json | null
          created_at?: string
          driving_license_url?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          is_online?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          total_earnings?: number
          updated_at?: string
          user_id: string
          vehicle_license_url?: string | null
          vehicle_photo_url?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          ai_id_check?: Json | null
          created_at?: string
          driving_license_url?: string | null
          id_back_url?: string | null
          id_front_url?: string | null
          is_online?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          submitted_at?: string | null
          total_earnings?: number
          updated_at?: string
          user_id?: string
          vehicle_license_url?: string | null
          vehicle_photo_url?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          delivery_id: string
          zone_id: string
        }
        Insert: {
          delivery_id: string
          zone_id: string
        }
        Update: {
          delivery_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          item_id: string | null
          percent_off: number
          points_required: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          item_id?: string | null
          percent_off?: number
          points_required?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          item_id?: string | null
          percent_off?: number
          points_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
        }
        Insert: {
          group_id: string
          user_id: string
        }
        Update: {
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      group_orders: {
        Row: {
          created_at: string
          host_id: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          host_id: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          active: boolean
          base_price: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          ingredients: string[]
          name: string
          photos: string[]
          recipe: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string[]
          name: string
          photos?: string[]
          recipe?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string[]
          name?: string
          photos?: string[]
          recipe?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          order_id: string | null
          party_id: string | null
          party_role: Database["public"]["Enums"]["app_role"] | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          order_id?: string | null
          party_id?: string | null
          party_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          order_id?: string | null
          party_id?: string | null
          party_role?: Database["public"]["Enums"]["app_role"] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          active: boolean
          benefits: Json
          created_at: string
          description: string | null
          duration_days: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          benefits?: Json
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean
          benefits?: Json
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          chef_id: string
          chef_item_id: string | null
          id: string
          item_id: string
          lead_time_hours: number
          order_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          chef_id: string
          chef_item_id?: string | null
          id?: string
          item_id: string
          lead_time_hours?: number
          order_id: string
          qty?: number
          unit_price: number
        }
        Update: {
          chef_id?: string
          chef_item_id?: string | null
          id?: string
          item_id?: string
          lead_time_hours?: number
          order_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_chef_item_id_fkey"
            columns: ["chef_item_id"]
            isOneToOne: false
            referencedRelation: "chef_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_fee: number
          discount: number
          group_order_id: string | null
          id: string
          notes: string | null
          payment_gateway_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_fee?: number
          discount?: number
          group_order_id?: string | null
          id?: string
          notes?: string | null
          payment_gateway_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_fee?: number
          discount?: number
          group_order_id?: string | null
          id?: string
          notes?: string | null
          payment_gateway_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_group_order_id_fkey"
            columns: ["group_order_id"]
            isOneToOne: false
            referencedRelation: "group_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          account_number: string | null
          active: boolean
          created_at: string
          id: string
          instructions: string | null
          name: string
        }
        Insert: {
          account_number?: string | null
          active?: boolean
          created_at?: string
          id?: string
          instructions?: string | null
          name: string
        }
        Update: {
          account_number?: string | null
          active?: boolean
          created_at?: string
          id?: string
          instructions?: string | null
          name?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          created_at: string
          id: string
          image_url: string
          notes: string | null
          order_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          notes?: string | null
          order_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          notes?: string | null
          order_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[]
          avatar_url: string | null
          created_at: string
          email: string | null
          favorite_items: string[]
          full_name: string | null
          id: string
          language: string
          phone: string | null
          points: number
          theme: string
          updated_at: string
          username: string | null
        }
        Insert: {
          allergies?: string[]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          favorite_items?: string[]
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
          points?: number
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          allergies?: string[]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          favorite_items?: string[]
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
          points?: number
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          chef_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          chef_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          chef_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean
          expires_at: string
          id: string
          membership_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          expires_at: string
          id?: string
          membership_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          expires_at?: string
          id?: string
          membership_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          active: boolean
          center_lat: number
          center_lng: number
          created_at: string
          id: string
          name: string
          polygon: Json | null
          radius_km: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          center_lat: number
          center_lng: number
          created_at?: string
          id?: string
          name: string
          polygon?: Json | null
          radius_km?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          center_lat?: number
          center_lng?: number
          created_at?: string
          id?: string
          name?: string
          polygon?: Json | null
          radius_km?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_chef_directory: {
        Row: {
          address: string | null
          bio: string | null
          chef_id: string | null
          full_name: string | null
          lat: number | null
          lng: number | null
          username: string | null
          zone_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "chef" | "customer" | "delivery"
      ledger_kind:
        | "customer_charge"
        | "platform_cut"
        | "chef_payout"
        | "delivery_payout"
        | "refund"
      order_status:
        | "placed"
        | "awaiting_payment_verification"
        | "chef_preparing"
        | "ready_for_pickup"
        | "picked_up"
        | "on_the_way"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "verified" | "rejected"
      verification_status: "pending" | "approved" | "rejected" | "not_submitted"
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
      app_role: ["admin", "chef", "customer", "delivery"],
      ledger_kind: [
        "customer_charge",
        "platform_cut",
        "chef_payout",
        "delivery_payout",
        "refund",
      ],
      order_status: [
        "placed",
        "awaiting_payment_verification",
        "chef_preparing",
        "ready_for_pickup",
        "picked_up",
        "on_the_way",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "verified", "rejected"],
      verification_status: ["pending", "approved", "rejected", "not_submitted"],
    },
  },
} as const
