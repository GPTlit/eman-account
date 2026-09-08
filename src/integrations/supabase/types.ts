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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          object_id: string | null
          object_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          object_id?: string | null
          object_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          object_id?: string | null
          object_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          notes: string | null
          shop_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          shop_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          shop_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title_key: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title_key: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          language: string
          owner_id: string | null
          phone: string | null
          resident_area: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          language?: string
          owner_id?: string | null
          phone?: string | null
          resident_area?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          language?: string
          owner_id?: string | null
          phone?: string | null
          resident_area?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          created_at: string
          id: string
          shop_id: string
          worker_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          created_at?: string
          id?: string
          shop_id: string
          worker_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          created_at?: string
          id?: string
          shop_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_members_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          full_name: string
          id: string
          id_document_path: string | null
          owner_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          receipt_path: string | null
          resident_area: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          username: string
          whatsapp: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_document_path?: string | null
          owner_id: string
          phone?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          receipt_path?: string | null
          resident_area?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          username: string
          whatsapp?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_document_path?: string | null
          owner_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          receipt_path?: string | null
          resident_area?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          username?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          max_shops: number
          max_workers: number
          owner_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string
          id?: string
          max_shops?: number
          max_workers?: number
          owner_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          max_shops?: number
          max_workers?: number
          owner_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          is_voided: boolean
          notes: string | null
          occurred_at: string
          payment_method: string | null
          product: string | null
          quantity: number
          receipt_url: string | null
          shop_id: string
          total_amount: number
          type: Database["public"]["Enums"]["transaction_type"]
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          is_voided?: boolean
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          product?: string | null
          quantity?: number
          receipt_url?: string | null
          shop_id: string
          total_amount?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          is_voided?: boolean
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          product?: string | null
          quantity?: number
          receipt_url?: string | null
          shop_id?: string
          total_amount?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_requests: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      member_of_shop: { Args: { _shop_id: string }; Returns: boolean }
      owns_shop: { Args: { _shop_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "owner" | "worker"
      cash_movement_type:
        | "cash_added"
        | "cash_removed"
        | "bank_deposit"
        | "withdrawal"
        | "adjustment"
      request_status: "pending" | "approved" | "rejected" | "cancelled"
      subscription_plan: "bronze" | "silver" | "gold" | "platinum"
      transaction_type:
        | "sale"
        | "purchase"
        | "expense"
        | "income"
        | "refund"
        | "debt"
        | "payment_received"
        | "payment_sent"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "owner", "worker"],
      cash_movement_type: [
        "cash_added",
        "cash_removed",
        "bank_deposit",
        "withdrawal",
        "adjustment",
      ],
      request_status: ["pending", "approved", "rejected", "cancelled"],
      subscription_plan: ["bronze", "silver", "gold", "platinum"],
      transaction_type: [
        "sale",
        "purchase",
        "expense",
        "income",
        "refund",
        "debt",
        "payment_received",
        "payment_sent",
        "other",
      ],
    },
  },
} as const
