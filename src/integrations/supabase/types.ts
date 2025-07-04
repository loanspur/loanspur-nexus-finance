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
      audit_trails: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          compliance_flags: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          risk_level: string | null
          session_id: string | null
          table_name: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          compliance_flags?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          compliance_flags?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statement_transactions: {
        Row: {
          balance: number | null
          bank_statement_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string
          id: string
          raw_data: Json | null
          reference_number: string | null
          transaction_code: string | null
          transaction_date: string
        }
        Insert: {
          balance?: number | null
          bank_statement_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          id?: string
          raw_data?: Json | null
          reference_number?: string | null
          transaction_code?: string | null
          transaction_date: string
        }
        Update: {
          balance?: number | null
          bank_statement_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          id?: string
          raw_data?: Json | null
          reference_number?: string | null
          transaction_code?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_transactions_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          bank_account_name: string
          bank_account_number: string
          closing_balance: number
          created_at: string
          id: string
          is_processed: boolean
          opening_balance: number
          statement_file_url: string | null
          statement_period_end: string
          statement_period_start: string
          statement_type: string
          tenant_id: string
          updated_at: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          bank_account_name: string
          bank_account_number: string
          closing_balance?: number
          created_at?: string
          id?: string
          is_processed?: boolean
          opening_balance?: number
          statement_file_url?: string | null
          statement_period_end: string
          statement_period_start: string
          statement_type?: string
          tenant_id: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          bank_account_name?: string
          bank_account_number?: string
          closing_balance?: number
          created_at?: string
          id?: string
          is_processed?: boolean
          opening_balance?: number
          statement_file_url?: string | null
          statement_period_end?: string
          statement_period_start?: string
          statement_type?: string
          tenant_id?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          addon_charges: Json | null
          base_amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          payment_attempts: number | null
          payment_method_id: string | null
          payment_provider: string | null
          payment_reference: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tax_amount: number | null
          tenant_id: string
          total_amount: number
        }
        Insert: {
          addon_charges?: Json | null
          base_amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_attempts?: number | null
          payment_method_id?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
        }
        Update: {
          addon_charges?: Json | null
          base_amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_attempts?: number | null
          payment_method_id?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "tenant_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_category: string
          account_code: string
          account_name: string
          account_type: string
          balance: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          parent_account_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_category: string
          account_code: string
          account_name: string
          account_type: string
          balance?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_category?: string
          account_code?: string
          account_name?: string
          account_type?: string
          balance?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          is_verified: boolean
          mime_type: string | null
          tenant_id: string
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          tenant_id: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          tenant_id?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      compliance_reports: {
        Row: {
          created_at: string
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          report_data: Json
          report_name: string
          report_period_end: string
          report_period_start: string
          report_status: string
          report_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data: Json
          report_name: string
          report_period_end: string
          report_period_start: string
          report_status?: string
          report_type: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_name?: string
          report_period_end?: string
          report_period_start?: string
          report_status?: string
          report_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          auto_remediation: boolean
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          remediation_config: Json | null
          rule_config: Json
          rule_description: string | null
          rule_name: string
          rule_type: string
          severity: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_remediation?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          remediation_config?: Json | null
          rule_config?: Json
          rule_description?: string | null
          rule_name: string
          rule_type: string
          severity?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_remediation?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          remediation_config?: Json | null
          rule_config?: Json
          rule_description?: string | null
          rule_name?: string
          rule_type?: string
          severity?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_violations: {
        Row: {
          affected_record_id: string | null
          affected_table: string | null
          auto_detected: boolean
          created_at: string
          detection_details: Json | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string
          severity: string
          status: string
          tenant_id: string
          updated_at: string
          violation_description: string
          violation_type: string
        }
        Insert: {
          affected_record_id?: string | null
          affected_table?: string | null
          auto_detected?: boolean
          created_at?: string
          detection_details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id: string
          severity: string
          status?: string
          tenant_id: string
          updated_at?: string
          violation_description: string
          violation_type: string
        }
        Update: {
          affected_record_id?: string | null
          affected_table?: string | null
          auto_detected?: boolean
          created_at?: string
          detection_details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          violation_description?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "compliance_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_report_templates: {
        Row: {
          chart_config: Json | null
          columns_config: Json
          created_at: string
          created_by: string | null
          description: string | null
          filters_config: Json | null
          id: string
          is_public: boolean
          report_query: Json
          template_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          chart_config?: Json | null
          columns_config: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters_config?: Json | null
          id?: string
          is_public?: boolean
          report_query: Json
          template_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          chart_config?: Json | null
          columns_config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters_config?: Json | null
          id?: string
          is_public?: boolean
          report_query?: Json
          template_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_report_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_backups: {
        Row: {
          backup_config: Json | null
          backup_metadata: Json | null
          backup_name: string
          backup_scope: string
          backup_status: string
          backup_type: string
          checksum: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          retention_until: string | null
          started_at: string | null
          tenant_id: string
        }
        Insert: {
          backup_config?: Json | null
          backup_metadata?: Json | null
          backup_name: string
          backup_scope: string
          backup_status?: string
          backup_type: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_until?: string | null
          started_at?: string | null
          tenant_id: string
        }
        Update: {
          backup_config?: Json | null
          backup_metadata?: Json | null
          backup_name?: string
          backup_scope?: string
          backup_status?: string
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_until?: string | null
          started_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_backups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_user_sessions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          session_token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          session_token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_user_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approvals: {
        Row: {
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string
          id: string
          stage_id: string
          status: string
          workflow_id: string
        }
        Insert: {
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          id?: string
          stage_id: string
          status: string
          workflow_id: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          stage_id?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "document_workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "document_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      document_compliance: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          compliance_type: string
          created_at: string
          document_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          requirement_name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          compliance_type: string
          created_at?: string
          document_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          requirement_name: string
          status: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          compliance_type?: string
          created_at?: string
          document_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          requirement_name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_compliance_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_compliance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          created_at: string
          document_id: string
          id: string
          ip_address: string | null
          is_valid: boolean
          signature_data: string | null
          signature_method: string
          signed_at: string
          signer_email: string | null
          signer_id: string | null
          signer_name: string
          user_agent: string | null
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          signature_data?: string | null
          signature_method: string
          signed_at?: string
          signer_email?: string | null
          signer_id?: string | null
          signer_name: string
          user_agent?: string | null
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          signature_data?: string | null
          signature_method?: string
          signed_at?: string
          signer_email?: string | null
          signer_id?: string | null
          signer_name?: string
          user_agent?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          placeholders: Json | null
          requires_approval: boolean
          template_content: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          placeholders?: Json | null
          requires_approval?: boolean
          template_content?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          placeholders?: Json | null
          requires_approval?: boolean
          template_content?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          changes_description: string | null
          created_at: string
          created_by: string | null
          document_id: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
          document_id: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          version_number: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflow_stages: {
        Row: {
          auto_approve: boolean
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          required_role: string | null
          stage_order: number
          tenant_id: string
        }
        Insert: {
          auto_approve?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          required_role?: string | null
          stage_order: number
          tenant_id: string
        }
        Update: {
          auto_approve?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          required_role?: string | null
          stage_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflow_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          completed_at: string | null
          created_at: string
          current_stage_id: string | null
          document_id: string
          id: string
          initiated_at: string
          initiated_by: string | null
          notes: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_stage_id?: string | null
          document_id: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_stage_id?: string | null
          document_id?: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflows_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "document_workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          created_at: string
          file_url: string | null
          generated_by: string | null
          id: string
          report_config: Json
          report_data: Json | null
          report_name: string
          report_period_end: string
          report_period_start: string
          report_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          report_config?: Json
          report_data?: Json | null
          report_name: string
          report_period_end: string
          report_period_start: string
          report_type: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          report_config?: Json
          report_data?: Json | null
          report_name?: string
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      global_integrations: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          integration_type: string
          is_active: boolean
          provider_name: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          integration_type: string
          is_active?: boolean
          provider_name: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          provider_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_leadership: {
        Row: {
          created_at: string
          elected_date: string | null
          election_notes: string | null
          end_date: string | null
          group_id: string
          id: string
          is_active: boolean
          member_id: string
          role_description: string | null
          role_title: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          elected_date?: string | null
          election_notes?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          member_id: string
          role_description?: string | null
          role_title: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          elected_date?: string | null
          election_notes?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          member_id?: string
          role_description?: string | null
          role_title?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_leadership_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_leadership_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_loan_applications: {
        Row: {
          application_number: string
          applied_at: string
          applied_by: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          disbursement_date: string | null
          group_id: string
          group_resolution: string | null
          id: string
          loan_purpose: string
          product_id: string
          repayment_plan: string | null
          requested_amount: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_number: string
          applied_at?: string
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          disbursement_date?: string | null
          group_id: string
          group_resolution?: string | null
          id?: string
          loan_purpose: string
          product_id: string
          repayment_plan?: string | null
          requested_amount: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_number?: string
          applied_at?: string
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          disbursement_date?: string | null
          group_id?: string
          group_resolution?: string | null
          id?: string
          loan_purpose?: string
          product_id?: string
          repayment_plan?: string | null
          requested_amount?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_loan_applications_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_loan_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_loan_applications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_loan_applications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "group_loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_loan_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_loan_member_allocations: {
        Row: {
          allocated_amount: number
          approval_status: string
          created_at: string
          group_loan_application_id: string
          guarantee_amount: number
          id: string
          individual_purpose: string | null
          member_id: string
        }
        Insert: {
          allocated_amount: number
          approval_status?: string
          created_at?: string
          group_loan_application_id: string
          guarantee_amount?: number
          id?: string
          individual_purpose?: string | null
          member_id: string
        }
        Update: {
          allocated_amount?: number
          approval_status?: string
          created_at?: string
          group_loan_application_id?: string
          guarantee_amount?: number
          id?: string
          individual_purpose?: string | null
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_loan_member_allocations_group_loan_application_id_fkey"
            columns: ["group_loan_application_id"]
            isOneToOne: false
            referencedRelation: "group_loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_loan_member_allocations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      group_loan_products: {
        Row: {
          created_at: string
          description: string | null
          group_guarantee_required: boolean
          id: string
          individual_guarantee_amount: number | null
          interest_rate: number
          is_active: boolean
          max_group_size: number
          max_loan_amount: number
          meeting_frequency_required: string | null
          min_group_size: number
          min_loan_amount: number
          product_name: string
          tenant_id: string
          term_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_guarantee_required?: boolean
          id?: string
          individual_guarantee_amount?: number | null
          interest_rate: number
          is_active?: boolean
          max_group_size?: number
          max_loan_amount: number
          meeting_frequency_required?: string | null
          min_group_size?: number
          min_loan_amount: number
          product_name: string
          tenant_id: string
          term_months: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_guarantee_required?: boolean
          id?: string
          individual_guarantee_amount?: number | null
          interest_rate?: number
          is_active?: boolean
          max_group_size?: number
          max_loan_amount?: number
          meeting_frequency_required?: string | null
          min_group_size?: number
          min_loan_amount?: number
          product_name?: string
          tenant_id?: string
          term_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_loan_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_meeting_types: {
        Row: {
          created_at: string
          default_duration_minutes: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          required_attendance_percentage: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          default_duration_minutes?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          required_attendance_percentage?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          default_duration_minutes?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          required_attendance_percentage?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_meeting_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_meetings: {
        Row: {
          agenda: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          facilitator_id: string | null
          group_id: string
          id: string
          location: string | null
          meeting_date: string
          meeting_time: string
          meeting_title: string
          meeting_type_id: string
          minutes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          facilitator_id?: string | null
          group_id: string
          id?: string
          location?: string | null
          meeting_date: string
          meeting_time: string
          meeting_title: string
          meeting_type_id: string
          minutes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          facilitator_id?: string | null
          group_id?: string
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_time?: string
          meeting_title?: string
          meeting_type_id?: string
          minutes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_meetings_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_meetings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_meetings_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "group_meeting_types"
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
      group_performance_metrics: {
        Row: {
          active_members: number
          created_at: string
          group_id: string
          group_solidarity_score: number
          id: string
          loan_repayment_rate: number
          meeting_attendance_rate: number
          metric_date: string
          performance_data: Json | null
          savings_target_achievement: number
          total_loans_outstanding: number
          total_members: number
          total_savings_balance: number
        }
        Insert: {
          active_members?: number
          created_at?: string
          group_id: string
          group_solidarity_score?: number
          id?: string
          loan_repayment_rate?: number
          meeting_attendance_rate?: number
          metric_date: string
          performance_data?: Json | null
          savings_target_achievement?: number
          total_loans_outstanding?: number
          total_members?: number
          total_savings_balance?: number
        }
        Update: {
          active_members?: number
          created_at?: string
          group_id?: string
          group_solidarity_score?: number
          id?: string
          loan_repayment_rate?: number
          meeting_attendance_rate?: number
          metric_date?: string
          performance_data?: Json | null
          savings_target_achievement?: number
          total_loans_outstanding?: number
          total_members?: number
          total_savings_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_performance_metrics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rules: {
        Row: {
          approval_date: string | null
          approved_by_group: boolean
          created_at: string
          created_by: string | null
          effective_date: string
          group_id: string
          id: string
          is_active: boolean
          penalty_amount: number | null
          penalty_type: string | null
          rule_category: string
          rule_description: string
          rule_title: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approved_by_group?: boolean
          created_at?: string
          created_by?: string | null
          effective_date?: string
          group_id: string
          id?: string
          is_active?: boolean
          penalty_amount?: number | null
          penalty_type?: string | null
          rule_category: string
          rule_description: string
          rule_title: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approved_by_group?: boolean
          created_at?: string
          created_by?: string | null
          effective_date?: string
          group_id?: string
          id?: string
          is_active?: boolean
          penalty_amount?: number | null
          penalty_type?: string | null
          rule_category?: string
          rule_description?: string
          rule_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_savings_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          contribution_frequency: string | null
          created_at: string
          current_balance: number
          group_id: string
          id: string
          interest_rate: number | null
          is_active: boolean
          maturity_date: string | null
          minimum_contribution: number | null
          opened_date: string
          target_amount: number | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          contribution_frequency?: string | null
          created_at?: string
          current_balance?: number
          group_id: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          maturity_date?: string | null
          minimum_contribution?: number | null
          opened_date?: string
          target_amount?: number | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          contribution_frequency?: string | null
          created_at?: string
          current_balance?: number
          group_id?: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          maturity_date?: string | null
          minimum_contribution?: number | null
          opened_date?: string
          target_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_savings_accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_savings_contributions: {
        Row: {
          contribution_amount: number
          contribution_date: string
          contribution_type: string
          created_at: string
          id: string
          member_id: string
          notes: string | null
          payment_method: string
          recorded_by: string | null
          reference_number: string | null
          savings_account_id: string
        }
        Insert: {
          contribution_amount: number
          contribution_date?: string
          contribution_type: string
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          savings_account_id: string
        }
        Update: {
          contribution_amount?: number
          contribution_date?: string
          contribution_type?: string
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          savings_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_savings_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_savings_contributions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_savings_contributions_savings_account_id_fkey"
            columns: ["savings_account_id"]
            isOneToOne: false
            referencedRelation: "group_savings_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_savings_withdrawals: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          savings_account_id: string
          updated_at: string
          withdrawal_amount: number
          withdrawal_date: string
          withdrawal_reason: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          savings_account_id: string
          updated_at?: string
          withdrawal_amount: number
          withdrawal_date?: string
          withdrawal_reason: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          savings_account_id?: string
          updated_at?: string
          withdrawal_amount?: number
          withdrawal_date?: string
          withdrawal_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_savings_withdrawals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_savings_withdrawals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_savings_withdrawals_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_savings_withdrawals_savings_account_id_fkey"
            columns: ["savings_account_id"]
            isOneToOne: false
            referencedRelation: "group_savings_accounts"
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
      journal_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string
          entry_number: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          tenant_id: string
          total_amount: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          entry_number: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id: string
          total_amount: number
          transaction_date: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          entry_number?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          application_number: string
          approval_notes: string | null
          client_id: string
          created_at: string
          id: string
          loan_product_id: string
          purpose: string | null
          requested_amount: number
          requested_term: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          application_number: string
          approval_notes?: string | null
          client_id: string
          created_at?: string
          id?: string
          loan_product_id: string
          purpose?: string | null
          requested_amount: number
          requested_term: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          application_number?: string
          approval_notes?: string | null
          client_id?: string
          created_at?: string
          id?: string
          loan_product_id?: string
          purpose?: string | null
          requested_amount?: number
          requested_term?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_loan_product_id_fkey"
            columns: ["loan_product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_approvals: {
        Row: {
          approval_level: number
          approved_amount: number | null
          approved_term: number | null
          approver_id: string
          created_at: string
          decision_notes: string | null
          id: string
          loan_application_id: string
          status: string
        }
        Insert: {
          approval_level?: number
          approved_amount?: number | null
          approved_term?: number | null
          approver_id: string
          created_at?: string
          decision_notes?: string | null
          id?: string
          loan_application_id: string
          status: string
        }
        Update: {
          approval_level?: number
          approved_amount?: number | null
          approved_term?: number | null
          approver_id?: string
          created_at?: string
          decision_notes?: string | null
          id?: string
          loan_application_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_approvals_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_collections: {
        Row: {
          assigned_to: string | null
          collection_notes: string | null
          collection_status: string
          created_at: string
          days_overdue: number
          id: string
          last_contact_date: string | null
          loan_id: string
          next_action_date: string | null
          overdue_amount: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          collection_notes?: string | null
          collection_status?: string
          created_at?: string
          days_overdue?: number
          id?: string
          last_contact_date?: string | null
          loan_id: string
          next_action_date?: string | null
          overdue_amount?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          collection_notes?: string | null
          collection_status?: string
          created_at?: string
          days_overdue?: number
          id?: string
          last_contact_date?: string | null
          loan_id?: string
          next_action_date?: string | null
          overdue_amount?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_collections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_collections_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_collections_tenant_id_fkey"
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
      loan_payments: {
        Row: {
          created_at: string
          fee_amount: number
          id: string
          interest_amount: number
          loan_id: string
          payment_amount: number
          payment_date: string
          payment_method: string
          principal_amount: number
          processed_by: string | null
          reference_number: string | null
          schedule_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          fee_amount?: number
          id?: string
          interest_amount?: number
          loan_id: string
          payment_amount: number
          payment_date?: string
          payment_method?: string
          principal_amount?: number
          processed_by?: string | null
          reference_number?: string | null
          schedule_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          id?: string
          interest_amount?: number
          loan_id?: string
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          principal_amount?: number
          processed_by?: string | null
          reference_number?: string | null
          schedule_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "loan_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      loan_schedules: {
        Row: {
          created_at: string
          due_date: string
          fee_amount: number
          id: string
          installment_number: number
          interest_amount: number
          loan_id: string
          outstanding_amount: number
          paid_amount: number
          payment_status: string
          principal_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          due_date: string
          fee_amount?: number
          id?: string
          installment_number: number
          interest_amount?: number
          loan_id: string
          outstanding_amount: number
          paid_amount?: number
          payment_status?: string
          principal_amount?: number
          total_amount: number
        }
        Update: {
          created_at?: string
          due_date?: string
          fee_amount?: number
          id?: string
          installment_number?: number
          interest_amount?: number
          loan_id?: string
          outstanding_amount?: number
          paid_amount?: number
          payment_status?: string
          principal_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedules_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
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
      meeting_attendance: {
        Row: {
          attendance_status: string
          check_in_time: string | null
          created_at: string
          id: string
          meeting_id: string
          member_id: string
          notes: string | null
          recorded_by: string | null
        }
        Insert: {
          attendance_status?: string
          check_in_time?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          member_id: string
          notes?: string | null
          recorded_by?: string | null
        }
        Update: {
          attendance_status?: string
          check_in_time?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          member_id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "group_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_credentials: {
        Row: {
          account_balance_callback_url: string | null
          business_short_code: string
          callback_url: string | null
          confirmation_url: string | null
          consumer_key: string
          consumer_secret: string
          created_at: string
          created_by: string | null
          environment: string
          id: string
          initiator_name: string | null
          is_active: boolean
          passkey: string
          paybill_number: string | null
          result_url: string | null
          security_credential: string | null
          tenant_id: string
          till_number: string | null
          timeout_url: string | null
          updated_at: string
          validation_url: string | null
        }
        Insert: {
          account_balance_callback_url?: string | null
          business_short_code: string
          callback_url?: string | null
          confirmation_url?: string | null
          consumer_key: string
          consumer_secret: string
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey: string
          paybill_number?: string | null
          result_url?: string | null
          security_credential?: string | null
          tenant_id: string
          till_number?: string | null
          timeout_url?: string | null
          updated_at?: string
          validation_url?: string | null
        }
        Update: {
          account_balance_callback_url?: string | null
          business_short_code?: string
          callback_url?: string | null
          confirmation_url?: string | null
          consumer_key?: string
          consumer_secret?: string
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey?: string
          paybill_number?: string | null
          result_url?: string | null
          security_credential?: string | null
          tenant_id?: string
          till_number?: string | null
          timeout_url?: string | null
          updated_at?: string
          validation_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          account_reference: string | null
          amount: number
          bill_ref_number: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          matched_transaction_id: string | null
          middle_name: string | null
          mpesa_receipt_number: string
          msisdn: string | null
          org_account_balance: number | null
          phone_number: string
          raw_callback_data: Json | null
          reconciliation_status: string
          tenant_id: string
          third_party_trans_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          account_reference?: string | null
          amount: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_transaction_id?: string | null
          middle_name?: string | null
          mpesa_receipt_number: string
          msisdn?: string | null
          org_account_balance?: number | null
          phone_number: string
          raw_callback_data?: Json | null
          reconciliation_status?: string
          tenant_id: string
          third_party_trans_id?: string | null
          transaction_date: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          account_reference?: string | null
          amount?: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_transaction_id?: string | null
          middle_name?: string | null
          mpesa_receipt_number?: string
          msisdn?: string | null
          org_account_balance?: number | null
          phone_number?: string
          raw_callback_data?: Json | null
          reconciliation_status?: string
          tenant_id?: string
          third_party_trans_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_matched_transaction_id_fkey"
            columns: ["matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          failed_sends: number | null
          id: string
          message: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          successful_sends: number | null
          target_audience: string
          tenant_id: string
          total_recipients: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_sends?: number | null
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          successful_sends?: number | null
          target_audience: string
          tenant_id: string
          total_recipients?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_sends?: number | null
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          successful_sends?: number | null
          target_audience?: string
          tenant_id?: string
          total_recipients?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          campaign_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          recipient_contact: string
          recipient_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          recipient_contact: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          recipient_contact?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          name: string
          subject: string | null
          tenant_id: string
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          name: string
          subject?: string | null
          tenant_id: string
          trigger_event: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          name?: string
          subject?: string | null
          tenant_id?: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          tenant_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          tenant_id: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analysis: {
        Row: {
          active_loans: number
          analysis_data: Json | null
          analysis_date: string
          average_loan_size: number
          created_at: string
          id: string
          overdue_loans: number
          par_30: number
          par_90: number
          tenant_id: string
          total_portfolio_value: number
          write_off_ratio: number
          yield_on_portfolio: number
        }
        Insert: {
          active_loans?: number
          analysis_data?: Json | null
          analysis_date: string
          average_loan_size?: number
          created_at?: string
          id?: string
          overdue_loans?: number
          par_30?: number
          par_90?: number
          tenant_id: string
          total_portfolio_value?: number
          write_off_ratio?: number
          yield_on_portfolio?: number
        }
        Update: {
          active_loans?: number
          analysis_data?: Json | null
          analysis_date?: string
          average_loan_size?: number
          created_at?: string
          id?: string
          overdue_loans?: number
          par_30?: number
          par_90?: number
          tenant_id?: string
          total_portfolio_value?: number
          write_off_ratio?: number
          yield_on_portfolio?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analysis_tenant_id_fkey"
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
      reconciliation_matches: {
        Row: {
          amount_difference: number | null
          bank_transaction_id: string
          created_at: string
          id: string
          match_confidence: number | null
          match_type: string
          matched_at: string
          matched_by: string | null
          notes: string | null
          system_transaction_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_difference?: number | null
          bank_transaction_id: string
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type: string
          matched_at?: string
          matched_by?: string | null
          notes?: string | null
          system_transaction_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_difference?: number | null
          bank_transaction_id?: string
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type?: string
          matched_at?: string
          matched_by?: string | null
          notes?: string | null
          system_transaction_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_matches_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_statement_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_matches_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_matches_system_transaction_id_fkey"
            columns: ["system_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_reports: {
        Row: {
          created_at: string
          id: string
          matched_amount: number | null
          period_end: string
          period_start: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          report_name: string
          statement_file_url: string
          statement_type: string
          tenant_id: string
          total_statement_amount: number | null
          total_system_amount: number | null
          unmatched_amount: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          matched_amount?: number | null
          period_end: string
          period_start: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          report_name: string
          statement_file_url: string
          statement_type: string
          tenant_id: string
          total_statement_amount?: number | null
          total_system_amount?: number | null
          unmatched_amount?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          matched_amount?: number | null
          period_end?: string
          period_start?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          report_name?: string
          statement_file_url?: string
          statement_type?: string
          tenant_id?: string
          total_statement_amount?: number | null
          total_system_amount?: number | null
          unmatched_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_reports_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_summary_reports: {
        Row: {
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          matched_transactions: number | null
          mpesa_matched: number | null
          mpesa_transactions: number | null
          mpesa_unmatched: number | null
          report_data: Json | null
          report_period_end: string
          report_period_start: string
          suspense_balance: number | null
          suspense_entries: number | null
          tenant_id: string
          total_bank_amount: number | null
          total_bank_transactions: number | null
          total_system_amount: number | null
          total_system_transactions: number | null
          unmatched_bank_transactions: number | null
          unmatched_system_transactions: number | null
          variance_amount: number | null
        }
        Insert: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          matched_transactions?: number | null
          mpesa_matched?: number | null
          mpesa_transactions?: number | null
          mpesa_unmatched?: number | null
          report_data?: Json | null
          report_period_end: string
          report_period_start: string
          suspense_balance?: number | null
          suspense_entries?: number | null
          tenant_id: string
          total_bank_amount?: number | null
          total_bank_transactions?: number | null
          total_system_amount?: number | null
          total_system_transactions?: number | null
          unmatched_bank_transactions?: number | null
          unmatched_system_transactions?: number | null
          variance_amount?: number | null
        }
        Update: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          matched_transactions?: number | null
          mpesa_matched?: number | null
          mpesa_transactions?: number | null
          mpesa_unmatched?: number | null
          report_data?: Json | null
          report_period_end?: string
          report_period_start?: string
          suspense_balance?: number | null
          suspense_entries?: number | null
          tenant_id?: string
          total_bank_amount?: number | null
          total_bank_transactions?: number | null
          total_system_amount?: number | null
          total_system_transactions?: number | null
          unmatched_bank_transactions?: number | null
          unmatched_system_transactions?: number | null
          variance_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_summary_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_summary_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_accounts: {
        Row: {
          account_balance: number | null
          account_number: string
          available_balance: number | null
          client_id: string
          created_at: string
          id: string
          interest_earned: number | null
          is_active: boolean
          mifos_account_id: number | null
          opened_date: string
          savings_product_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_balance?: number | null
          account_number: string
          available_balance?: number | null
          client_id: string
          created_at?: string
          id?: string
          interest_earned?: number | null
          is_active?: boolean
          mifos_account_id?: number | null
          opened_date?: string
          savings_product_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_balance?: number | null
          account_number?: string
          available_balance?: number | null
          client_id?: string
          created_at?: string
          id?: string
          interest_earned?: number | null
          is_active?: boolean
          mifos_account_id?: number | null
          opened_date?: string
          savings_product_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_accounts_savings_product_id_fkey"
            columns: ["savings_product_id"]
            isOneToOne: false
            referencedRelation: "savings_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_interest_postings: {
        Row: {
          average_balance: number
          created_at: string
          id: string
          interest_amount: number
          interest_rate: number
          period_end: string
          period_start: string
          posting_date: string
          savings_account_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          average_balance: number
          created_at?: string
          id?: string
          interest_amount: number
          interest_rate: number
          period_end: string
          period_start: string
          posting_date?: string
          savings_account_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          average_balance?: number
          created_at?: string
          id?: string
          interest_amount?: number
          interest_rate?: number
          period_end?: string
          period_start?: string
          posting_date?: string
          savings_account_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_interest_postings_savings_account_id_fkey"
            columns: ["savings_account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_interest_postings_tenant_id_fkey"
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
      savings_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          processed_by: string | null
          reference_number: string | null
          savings_account_id: string
          tenant_id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          processed_by?: string | null
          reference_number?: string | null
          savings_account_id: string
          tenant_id: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          processed_by?: string | null
          reference_number?: string | null
          savings_account_id?: string
          tenant_id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_savings_account_id_fkey"
            columns: ["savings_account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suspense_accounts: {
        Row: {
          account_name: string
          account_type: string
          created_at: string
          created_by: string | null
          current_balance: number
          description: string | null
          id: string
          is_active: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_type: string
          created_at?: string
          created_by?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          is_active?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_type?: string
          created_at?: string
          created_by?: string | null
          current_balance?: number
          description?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspense_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspense_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suspense_entries: {
        Row: {
          amount: number
          created_at: string
          description: string
          entry_date: string
          id: string
          reference_transaction_id: string | null
          reference_type: string
          resolution_notes: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          suspense_account_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          entry_date?: string
          id?: string
          reference_transaction_id?: string | null
          reference_type: string
          resolution_notes?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          suspense_account_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          reference_transaction_id?: string | null
          reference_type?: string
          resolution_notes?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          suspense_account_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspense_entries_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspense_entries_suspense_account_id_fkey"
            columns: ["suspense_account_id"]
            isOneToOne: false
            referencedRelation: "suspense_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          status: string | null
          tenant_id: string | null
          threshold_critical: number | null
          threshold_warning: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          status?: string | null
          tenant_id?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          status?: string | null
          tenant_id?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_health_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_addons: {
        Row: {
          activated_at: string | null
          addon_name: string
          addon_type: string
          billing_cycle: string | null
          created_at: string | null
          deactivated_at: string | null
          id: string
          is_active: boolean | null
          quantity: number | null
          tenant_id: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          addon_name: string
          addon_type: string
          billing_cycle?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean | null
          quantity?: number | null
          tenant_id: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          addon_name?: string
          addon_type?: string
          billing_cycle?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean | null
          quantity?: number | null
          tenant_id?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string | null
          dns_records: Json | null
          domain_name: string
          domain_type: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          ssl_status: string | null
          tenant_id: string
          updated_at: string | null
          verification_status: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          dns_records?: Json | null
          domain_name: string
          domain_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          ssl_status?: string | null
          tenant_id: string
          updated_at?: string | null
          verification_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          dns_records?: Json | null
          domain_name?: string
          domain_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          ssl_status?: string | null
          tenant_id?: string
          updated_at?: string | null
          verification_status?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integration_preferences: {
        Row: {
          created_at: string
          id: string
          integration_id: string
          integration_type: string
          is_primary: boolean
          tenant_id: string
          tenant_specific_config: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_id: string
          integration_type: string
          is_primary?: boolean
          tenant_id: string
          tenant_specific_config?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_id?: string
          integration_type?: string
          is_primary?: boolean
          tenant_id?: string
          tenant_specific_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integration_preferences_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "global_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_integration_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_mpesa_config: {
        Row: {
          business_short_code: string | null
          callback_url: string | null
          config_type: string
          confirmation_url: string | null
          consumer_key: string | null
          consumer_secret: string | null
          created_at: string | null
          environment: string | null
          id: string
          is_active: boolean | null
          passkey: string | null
          result_url: string | null
          tenant_id: string
          timeout_url: string | null
          updated_at: string | null
          validation_url: string | null
        }
        Insert: {
          business_short_code?: string | null
          callback_url?: string | null
          config_type: string
          confirmation_url?: string | null
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          passkey?: string | null
          result_url?: string | null
          tenant_id: string
          timeout_url?: string | null
          updated_at?: string | null
          validation_url?: string | null
        }
        Update: {
          business_short_code?: string | null
          callback_url?: string | null
          config_type?: string
          confirmation_url?: string | null
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          passkey?: string | null
          result_url?: string | null
          tenant_id?: string
          timeout_url?: string | null
          updated_at?: string | null
          validation_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_mpesa_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          payment_method_id: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string
          payment_type: string
          processed_at: string | null
          processing_fee: number | null
          provider_transaction_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_type: string
          processed_at?: string | null
          processing_fee?: number | null
          provider_transaction_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_type?: string
          processed_at?: string | null
          processing_fee?: number | null
          provider_transaction_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payment_history_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "tenant_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payment_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          payment_type: string
          provider: string | null
          provider_payment_method_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          payment_type: string
          provider?: string | null
          provider_payment_method_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          payment_type?: string
          provider?: string | null
          provider_payment_method_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscription_history: {
        Row: {
          billing_amount: number | null
          billing_frequency: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          pricing_tier: string
          started_at: string
          tenant_id: string
        }
        Insert: {
          billing_amount?: number | null
          billing_frequency?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          pricing_tier: string
          started_at: string
          tenant_id: string
        }
        Update: {
          billing_amount?: number | null
          billing_frequency?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          pricing_tier?: string
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscription_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          addons: Json | null
          address: Json | null
          auto_billing: boolean | null
          billing_address: Json | null
          billing_cycle: string | null
          city: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          country: string | null
          created_at: string
          currency_code: string | null
          dns_settings: Json | null
          domain: string | null
          id: string
          logo_url: string | null
          mifos_base_url: string | null
          mifos_password: string | null
          mifos_tenant_identifier: string | null
          mifos_username: string | null
          mpesa_settings: Json | null
          name: string
          payment_terms: number | null
          postal_code: string | null
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
          slug: string
          state_province: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at: string | null
          theme_colors: Json | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          addons?: Json | null
          address?: Json | null
          auto_billing?: boolean | null
          billing_address?: Json | null
          billing_cycle?: string | null
          city?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          country?: string | null
          created_at?: string
          currency_code?: string | null
          dns_settings?: Json | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          mifos_base_url?: string | null
          mifos_password?: string | null
          mifos_tenant_identifier?: string | null
          mifos_username?: string | null
          mpesa_settings?: Json | null
          name: string
          payment_terms?: number | null
          postal_code?: string | null
          pricing_tier?: Database["public"]["Enums"]["pricing_tier"]
          slug: string
          state_province?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at?: string | null
          theme_colors?: Json | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          addons?: Json | null
          address?: Json | null
          auto_billing?: boolean | null
          billing_address?: Json | null
          billing_cycle?: string | null
          city?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          country?: string | null
          created_at?: string
          currency_code?: string | null
          dns_settings?: Json | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          mifos_base_url?: string | null
          mifos_password?: string | null
          mifos_tenant_identifier?: string | null
          mifos_username?: string | null
          mpesa_settings?: Json | null
          name?: string
          payment_terms?: number | null
          postal_code?: string | null
          pricing_tier?: Database["public"]["Enums"]["pricing_tier"]
          slug?: string
          state_province?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_ends_at?: string | null
          theme_colors?: Json | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          description: string | null
          external_transaction_id: string | null
          id: string
          loan_id: string | null
          mpesa_receipt_number: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          processed_by: string | null
          reconciliation_status: string | null
          savings_account_id: string | null
          tenant_id: string
          transaction_date: string
          transaction_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          loan_id?: string | null
          mpesa_receipt_number?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          processed_by?: string | null
          reconciliation_status?: string | null
          savings_account_id?: string | null
          tenant_id: string
          transaction_date?: string
          transaction_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          loan_id?: string | null
          mpesa_receipt_number?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          processed_by?: string | null
          reconciliation_status?: string | null
          savings_account_id?: string | null
          tenant_id?: string
          transaction_date?: string
          transaction_id?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_savings_account_id_fkey"
            columns: ["savings_account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      unallocated_payments: {
        Row: {
          allocated_at: string | null
          allocated_by: string | null
          allocated_to_loan_id: string | null
          allocated_to_savings_id: string | null
          amount: number
          created_at: string
          id: string
          is_allocated: boolean
          notes: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_number: string | null
          tenant_id: string
        }
        Insert: {
          allocated_at?: string | null
          allocated_by?: string | null
          allocated_to_loan_id?: string | null
          allocated_to_savings_id?: string | null
          amount: number
          created_at?: string
          id?: string
          is_allocated?: boolean
          notes?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          tenant_id: string
        }
        Update: {
          allocated_at?: string | null
          allocated_by?: string | null
          allocated_to_loan_id?: string | null
          allocated_to_savings_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          is_allocated?: boolean
          notes?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unallocated_payments_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unallocated_payments_allocated_to_loan_id_fkey"
            columns: ["allocated_to_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unallocated_payments_allocated_to_savings_id_fkey"
            columns: ["allocated_to_savings_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unallocated_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_description: string | null
          activity_type: string
          api_endpoint: string | null
          created_at: string
          duration_ms: number | null
          id: string
          metadata: Json | null
          page_url: string | null
          request_method: string | null
          response_status: number | null
          session_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          api_endpoint?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          request_method?: string | null
          response_status?: number | null
          session_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          api_endpoint?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          request_method?: string | null
          response_status?: number | null
          session_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          location_data: Json | null
          login_time: string
          logout_time: string | null
          session_token: string
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_data?: Json | null
          login_time?: string
          logout_time?: string | null
          session_token: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_data?: Json | null
          login_time?: string
          logout_time?: string | null
          session_token?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_sessions_user_id_fkey"
            columns: ["user_id"]
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
      dev_switch_user_context: {
        Args: { target_profile_id: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "EXPORT"
        | "IMPORT"
        | "BACKUP"
        | "RESTORE"
        | "VIEW"
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
      audit_action: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
        "IMPORT",
        "BACKUP",
        "RESTORE",
        "VIEW",
      ],
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
