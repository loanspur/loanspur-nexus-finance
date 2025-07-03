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
      clients: {
        Row: {
          address: Json | null
          client_number: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          is_active: boolean
          last_name: string
          mifos_client_id: number | null
          monthly_income: number | null
          national_id: string | null
          occupation: string | null
          phone: string | null
          profile_picture_url: string | null
          tenant_id: string
          timely_repayment_rate: number | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          client_number: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          mifos_client_id?: number | null
          monthly_income?: number | null
          national_id?: string | null
          occupation?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          tenant_id: string
          timely_repayment_rate?: number | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          client_number?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          mifos_client_id?: number | null
          monthly_income?: number | null
          national_id?: string | null
          occupation?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          tenant_id?: string
          timely_repayment_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          client_id: string
          group_id: string
          id: string
          is_active: boolean
          joined_at: string
        }
        Insert: {
          client_id: string
          group_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          client_id?: string
          group_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          group_number: string
          id: string
          is_active: boolean
          meeting_day: string | null
          meeting_frequency: string | null
          meeting_time: string | null
          mifos_group_id: number | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_number: string
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_frequency?: string | null
          meeting_time?: string | null
          mifos_group_id?: number | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_number?: string
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_frequency?: string | null
          meeting_time?: string | null
          mifos_group_id?: number | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_guarantors: {
        Row: {
          created_at: string
          guarantee_amount: number
          guarantor_client_id: string | null
          guarantor_name: string
          guarantor_national_id: string | null
          guarantor_phone: string | null
          id: string
          loan_id: string
        }
        Insert: {
          created_at?: string
          guarantee_amount: number
          guarantor_client_id?: string | null
          guarantor_name: string
          guarantor_national_id?: string | null
          guarantor_phone?: string | null
          id?: string
          loan_id: string
        }
        Update: {
          created_at?: string
          guarantee_amount?: number
          guarantor_client_id?: string | null
          guarantor_name?: string
          guarantor_national_id?: string | null
          guarantor_phone?: string | null
          id?: string
          loan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_guarantors_guarantor_client_id_fkey"
            columns: ["guarantor_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_products: {
        Row: {
          created_at: string
          currency_code: string
          default_nominal_interest_rate: number | null
          default_principal: number | null
          default_term: number | null
          description: string | null
          id: string
          is_active: boolean
          max_nominal_interest_rate: number
          max_principal: number
          max_term: number
          mifos_product_id: number | null
          min_nominal_interest_rate: number
          min_principal: number
          min_term: number
          name: string
          repayment_frequency: string
          short_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          default_nominal_interest_rate?: number | null
          default_principal?: number | null
          default_term?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_nominal_interest_rate: number
          max_principal: number
          max_term: number
          mifos_product_id?: number | null
          min_nominal_interest_rate: number
          min_principal: number
          min_term: number
          name: string
          repayment_frequency?: string
          short_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          default_nominal_interest_rate?: number | null
          default_principal?: number | null
          default_term?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_nominal_interest_rate?: number
          max_principal?: number
          max_term?: number
          mifos_product_id?: number | null
          min_nominal_interest_rate?: number
          min_principal?: number
          min_term?: number
          name?: string
          repayment_frequency?: string
          short_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          client_id: string
          created_at: string
          disbursement_date: string | null
          expected_maturity_date: string | null
          id: string
          interest_rate: number
          loan_number: string
          loan_officer_id: string | null
          loan_product_id: string
          mifos_loan_id: number | null
          next_repayment_amount: number | null
          next_repayment_date: string | null
          outstanding_balance: number | null
          principal_amount: number
          status: Database["public"]["Enums"]["loan_status"]
          tenant_id: string
          term_months: number
          total_overdue_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          disbursement_date?: string | null
          expected_maturity_date?: string | null
          id?: string
          interest_rate: number
          loan_number: string
          loan_officer_id?: string | null
          loan_product_id: string
          mifos_loan_id?: number | null
          next_repayment_amount?: number | null
          next_repayment_date?: string | null
          outstanding_balance?: number | null
          principal_amount: number
          status?: Database["public"]["Enums"]["loan_status"]
          tenant_id: string
          term_months: number
          total_overdue_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          disbursement_date?: string | null
          expected_maturity_date?: string | null
          id?: string
          interest_rate?: number
          loan_number?: string
          loan_officer_id?: string | null
          loan_product_id?: string
          mifos_loan_id?: number | null
          next_repayment_amount?: number | null
          next_repayment_date?: string | null
          outstanding_balance?: number | null
          principal_amount?: number
          status?: Database["public"]["Enums"]["loan_status"]
          tenant_id?: string
          term_months?: number
          total_overdue_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_product_id_fkey"
            columns: ["loan_product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_products: {
        Row: {
          created_at: string
          currency_code: string
          description: string | null
          id: string
          is_active: boolean
          mifos_product_id: number | null
          min_balance_for_interest_calculation: number | null
          min_required_opening_balance: number | null
          name: string
          nominal_annual_interest_rate: number | null
          short_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mifos_product_id?: number | null
          min_balance_for_interest_calculation?: number | null
          min_required_opening_balance?: number | null
          name: string
          nominal_annual_interest_rate?: number | null
          short_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mifos_product_id?: number | null
          min_balance_for_interest_calculation?: number | null
          min_required_opening_balance?: number | null
          name?: string
          nominal_annual_interest_rate?: number | null
          short_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          mifos_base_url: string | null
          mifos_password: string | null
          mifos_tenant_identifier: string | null
          mifos_username: string | null
          name: string
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at: string | null
          theme_colors: Json | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          mifos_base_url?: string | null
          mifos_password?: string | null
          mifos_tenant_identifier?: string | null
          mifos_username?: string | null
          name: string
          pricing_tier?: Database["public"]["Enums"]["pricing_tier"]
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at?: string | null
          theme_colors?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          mifos_base_url?: string | null
          mifos_password?: string | null
          mifos_tenant_identifier?: string | null
          mifos_username?: string | null
          name?: string
          pricing_tier?: Database["public"]["Enums"]["pricing_tier"]
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at?: string | null
          theme_colors?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
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
      loan_status:
        | "pending"
        | "approved"
        | "active"
        | "closed"
        | "overdue"
        | "written_off"
      payment_status: "pending" | "completed" | "failed" | "cancelled"
      payment_type:
        | "cash"
        | "bank_transfer"
        | "mpesa"
        | "mobile_money"
        | "cheque"
      pricing_tier: "starter" | "professional" | "enterprise" | "scale"
      tenant_status: "active" | "suspended" | "cancelled"
      transaction_type:
        | "loan_repayment"
        | "savings_deposit"
        | "loan_disbursement"
        | "savings_withdrawal"
        | "fee_payment"
      user_role: "super_admin" | "tenant_admin" | "loan_officer" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      loan_status: [
        "pending",
        "approved",
        "active",
        "closed",
        "overdue",
        "written_off",
      ],
      payment_status: ["pending", "completed", "failed", "cancelled"],
      payment_type: [
        "cash",
        "bank_transfer",
        "mpesa",
        "mobile_money",
        "cheque",
      ],
      pricing_tier: ["starter", "professional", "enterprise", "scale"],
      tenant_status: ["active", "suspended", "cancelled"],
      transaction_type: [
        "loan_repayment",
        "savings_deposit",
        "loan_disbursement",
        "savings_withdrawal",
        "fee_payment",
      ],
      user_role: ["super_admin", "tenant_admin", "loan_officer", "client"],
    },
  },
} as const
