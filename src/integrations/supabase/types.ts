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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          automations: Json | null
          bot_name: string | null
          context_window: number | null
          id: string
          instructions: string | null
          tone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          automations?: Json | null
          bot_name?: string | null
          context_window?: number | null
          id?: string
          instructions?: string | null
          tone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          automations?: Json | null
          bot_name?: string | null
          context_window?: number | null
          id?: string
          instructions?: string | null
          tone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_code: string
          collaborator_id: string | null
          created_at: string
          customer_id: string
          date: string | null
          discount: number
          final_total: number
          guests: number
          id: string
          invoice_issued: boolean | null
          invoice_number: string | null
          invoice_url: string | null
          item_name: string
          marketing_campaign_id: string | null
          notes: string | null
          partner_id: string | null
          pay_method: string
          payment_status: string
          pix_code: string | null
          receipt_issued: boolean | null
          status: string
          total: number
          type: string
          unit_price: number
          updated_at: string
          user_id: string | null
          voucher_url: string | null
        }
        Insert: {
          booking_code: string
          collaborator_id?: string | null
          created_at?: string
          customer_id: string
          date?: string | null
          discount?: number
          final_total: number
          guests?: number
          id?: string
          invoice_issued?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          item_name: string
          marketing_campaign_id?: string | null
          notes?: string | null
          partner_id?: string | null
          pay_method: string
          payment_status?: string
          pix_code?: string | null
          receipt_issued?: boolean | null
          status?: string
          total: number
          type: string
          unit_price: number
          updated_at?: string
          user_id?: string | null
          voucher_url?: string | null
        }
        Update: {
          booking_code?: string
          collaborator_id?: string | null
          created_at?: string
          customer_id?: string
          date?: string | null
          discount?: number
          final_total?: number
          guests?: number
          id?: string
          invoice_issued?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          item_name?: string
          marketing_campaign_id?: string | null
          notes?: string | null
          partner_id?: string | null
          pay_method?: string
          payment_status?: string
          pix_code?: string | null
          receipt_issued?: boolean | null
          status?: string
          total?: number
          type?: string
          unit_price?: number
          updated_at?: string
          user_id?: string | null
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_payments: {
        Row: {
          amount: number
          booking_id: string | null
          collaborator_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          collaborator_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          collaborator_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_payments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          cadastur: string | null
          cnh: string | null
          created_at: string
          document: string
          email: string | null
          id: string
          name: string
          observation: string | null
          payment_type: string
          payment_value: number
          phone: string | null
          pix_key: string | null
          pix_type: string | null
          status: string
          type: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cadastur?: string | null
          cnh?: string | null
          created_at?: string
          document: string
          email?: string | null
          id?: string
          name: string
          observation?: string | null
          payment_type: string
          payment_value?: number
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cadastur?: string | null
          cnh?: string | null
          created_at?: string
          document?: string
          email?: string | null
          id?: string
          name?: string
          observation?: string | null
          payment_type?: string
          payment_value?: number
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          anexo_url: string | null
          booking_id: string | null
          categoria: string
          collaborator_id: string | null
          created_at: string
          descricao: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          partner_id: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          anexo_url?: string | null
          booking_id?: string | null
          categoria?: string
          collaborator_id?: string | null
          created_at?: string
          descricao: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          anexo_url?: string | null
          booking_id?: string | null
          categoria?: string
          collaborator_id?: string | null
          created_at?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          anexo_url: string | null
          booking_id: string | null
          categoria: string
          cliente: string | null
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          recebido_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          anexo_url?: string | null
          booking_id?: string | null
          categoria?: string
          cliente?: string | null
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          recebido_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          anexo_url?: string | null
          booking_id?: string | null
          categoria?: string
          cliente?: string | null
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          recebido_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          category: string | null
          created_at: string
          customer_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          customer_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          customer_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          country: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          passport: string | null
          phone: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          passport?: string | null
          phone?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          passport?: string | null
          phone?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dependents: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          customer_id: string
          id: string
          name: string
          relationship: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          customer_id: string
          id?: string
          name: string
          relationship: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          name?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          audience: string | null
          bounces: number
          clicks: number
          created_at: string
          delivered: number
          id: string
          message: string | null
          name: string
          read_count: number
          scheduled_at: string | null
          sent: number
          status: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          bounces?: number
          clicks?: number
          created_at?: string
          delivered?: number
          id?: string
          message?: string | null
          name: string
          read_count?: number
          scheduled_at?: string | null
          sent?: number
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          bounces?: number
          clicks?: number
          created_at?: string
          delivered?: number
          id?: string
          message?: string | null
          name?: string
          read_count?: number
          scheduled_at?: string | null
          sent?: number
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          converted_customer_id: string | null
          created_at: string
          email: string | null
          id: string
          interest: string | null
          last_contact: string | null
          name: string
          phone: string | null
          score: number
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          last_contact?: string | null
          name: string
          phone?: string | null
          score?: number
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          last_contact?: string | null
          name?: string
          phone?: string | null
          score?: number
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      package_tours: {
        Row: {
          created_at: string
          id: string
          package_id: string | null
          sort_order: number
          tour_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          package_id?: string | null
          sort_order?: number
          tour_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string | null
          sort_order?: number
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_tours_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_tours_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean | null
          created_at: string
          days: number
          description: string | null
          discount_price: number | null
          highlights: string[] | null
          id: string
          name: string
          nights: number | null
          original_price: number | null
          slug: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          days?: number
          description?: string | null
          discount_price?: number | null
          highlights?: string[] | null
          id?: string
          name: string
          nights?: number | null
          original_price?: number | null
          slug: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          days?: number
          description?: string | null
          discount_price?: number | null
          highlights?: string[] | null
          id?: string
          name?: string
          nights?: number | null
          original_price?: number | null
          slug?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partner_types: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          active: boolean
          address: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          bank_pix_key: string | null
          cadastur: string | null
          cnh: string | null
          cnh_validade: string | null
          commission_rate: number | null
          contact_name: string | null
          cpf_cnpj: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          phone: string | null
          remuneration_type: string | null
          remuneration_value: number | null
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix_key?: string | null
          cadastur?: string | null
          cnh?: string | null
          cnh_validade?: string | null
          commission_rate?: number | null
          contact_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          remuneration_type?: string | null
          remuneration_value?: number | null
          tags?: string[] | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix_key?: string | null
          cadastur?: string | null
          cnh?: string | null
          cnh_validade?: string | null
          commission_rate?: number | null
          contact_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          remuneration_type?: string | null
          remuneration_value?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      remarketing_rules: {
        Row: {
          active: boolean
          channel: string
          conversions: number
          created_at: string
          delay: string
          id: string
          message: string
          trigger_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel?: string
          conversions?: number
          created_at?: string
          delay?: string
          id?: string
          message: string
          trigger_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel?: string
          conversions?: number
          created_at?: string
          delay?: string
          id?: string
          message?: string
          trigger_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author: string
          avatar: string | null
          booking_id: string | null
          comment: string | null
          country: string | null
          created_at: string
          customer_id: string | null
          id: string
          rating: number
          tour_id: string | null
        }
        Insert: {
          author: string
          avatar?: string | null
          booking_id?: string | null
          comment?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating: number
          tour_id?: string | null
        }
        Update: {
          author?: string
          avatar?: string | null
          booking_id?: string | null
          comment?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating?: number
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_audit_items: {
        Row: {
          audit_id: string
          category: string
          compliant: boolean
          created_at: string
          id: string
          item_name: string
          observation: string | null
        }
        Insert: {
          audit_id: string
          category: string
          compliant?: boolean
          created_at?: string
          id?: string
          item_name: string
          observation?: string | null
        }
        Update: {
          audit_id?: string
          category?: string
          compliant?: boolean
          created_at?: string
          id?: string
          item_name?: string
          observation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "sgs_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_audits: {
        Row: {
          audit_code: string
          auditor: string
          auditor_id: string | null
          created_at: string
          date: string
          id: string
          improvement_plan: string | null
          observations: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          audit_code: string
          auditor: string
          auditor_id?: string | null
          created_at?: string
          date?: string
          id?: string
          improvement_plan?: string | null
          observations?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          audit_code?: string
          auditor?: string
          auditor_id?: string | null
          created_at?: string
          date?: string
          id?: string
          improvement_plan?: string | null
          observations?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_audits_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_briefings: {
        Row: {
          booking_id: string | null
          completed: boolean
          created_at: string
          date: string
          emergency_orientation: boolean
          group_distance: boolean
          guide_name: string
          id: string
          lagoon_behavior: boolean
          language: string
          notes: string | null
          safety_rules: boolean
          tour_id: string | null
          tour_risks: boolean
        }
        Insert: {
          booking_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          emergency_orientation?: boolean
          group_distance?: boolean
          guide_name: string
          id?: string
          lagoon_behavior?: boolean
          language?: string
          notes?: string | null
          safety_rules?: boolean
          tour_id?: string | null
          tour_risks?: boolean
        }
        Update: {
          booking_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          emergency_orientation?: boolean
          group_distance?: boolean
          guide_name?: string
          id?: string
          lagoon_behavior?: boolean
          language?: string
          notes?: string | null
          safety_rules?: boolean
          tour_id?: string | null
          tour_risks?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sgs_briefings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_briefings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_checklist_items: {
        Row: {
          categoria: string
          checklist_id: string
          conforme: boolean | null
          created_at: string
          id: string
          item_nome: string
          observacao: string | null
        }
        Insert: {
          categoria?: string
          checklist_id: string
          conforme?: boolean | null
          created_at?: string
          id?: string
          item_nome: string
          observacao?: string | null
        }
        Update: {
          categoria?: string
          checklist_id?: string
          conforme?: boolean | null
          created_at?: string
          id?: string
          item_nome?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "sgs_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_checklists: {
        Row: {
          booking_id: string | null
          condutor_id: string | null
          created_at: string
          created_by: string | null
          data: string
          id: string
          observacoes: string | null
          responsavel: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          booking_id?: string | null
          condutor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          booking_id?: string | null
          condutor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sgs_checklists_condutor"
            columns: ["condutor_id"]
            isOneToOne: false
            referencedRelation: "sgs_condutores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sgs_checklists_veiculo"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "sgs_veiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_checklists_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_checklists_condutor_id_fkey"
            columns: ["condutor_id"]
            isOneToOne: false
            referencedRelation: "sgs_condutores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_checklists_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "sgs_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_condutores: {
        Row: {
          assinatura_url: string | null
          cnh_categoria: string | null
          cnh_numero: string | null
          cnh_validade: string | null
          cpf: string | null
          created_at: string
          email: string | null
          first_aid_expiry: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          off_road: boolean | null
          primeiros_socorros: boolean | null
          status: string
          telefone: string | null
          training_history: Json | null
          treinamentos: string[] | null
          updated_at: string
        }
        Insert: {
          assinatura_url?: string | null
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          first_aid_expiry?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          off_road?: boolean | null
          primeiros_socorros?: boolean | null
          status?: string
          telefone?: string | null
          training_history?: Json | null
          treinamentos?: string[] | null
          updated_at?: string
        }
        Update: {
          assinatura_url?: string | null
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          first_aid_expiry?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          off_road?: boolean | null
          primeiros_socorros?: boolean | null
          status?: string
          telefone?: string | null
          training_history?: Json | null
          treinamentos?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      sgs_condutores_visitantes: {
        Row: {
          cnh_categoria: string | null
          cnh_numero: string | null
          cnh_validade: string | null
          cpf: string | null
          created_at: string
          data_entrada: string
          data_saida: string | null
          destino_uc: string | null
          empresa_instituicao: string | null
          id: string
          motivo: string | null
          nome: string
          observacoes: string | null
          status: string
          updated_at: string
          veiculo_descricao: string | null
          veiculo_placa: string | null
        }
        Insert: {
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string
          data_saida?: string | null
          destino_uc?: string | null
          empresa_instituicao?: string | null
          id?: string
          motivo?: string | null
          nome: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          veiculo_descricao?: string | null
          veiculo_placa?: string | null
        }
        Update: {
          cnh_categoria?: string | null
          cnh_numero?: string | null
          cnh_validade?: string | null
          cpf?: string | null
          created_at?: string
          data_entrada?: string
          data_saida?: string | null
          destino_uc?: string | null
          empresa_instituicao?: string | null
          id?: string
          motivo?: string | null
          nome?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          veiculo_descricao?: string | null
          veiculo_placa?: string | null
        }
        Relationships: []
      }
      sgs_corrective_actions: {
        Row: {
          action_code: string
          comments: string | null
          completed_date: string | null
          created_at: string
          description: string
          due_date: string | null
          evidence: string | null
          id: string
          incident_id: string | null
          responsible: string
          risk_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          action_code: string
          comments?: string | null
          completed_date?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          incident_id?: string | null
          responsible: string
          risk_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_code?: string
          comments?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          evidence?: string | null
          id?: string
          incident_id?: string | null
          responsible?: string
          risk_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_incident"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "sgs_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_corrective_actions_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "sgs_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_empresa: {
        Row: {
          cadastur: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          icmbio_autorizacao: string | null
          icmbio_validade: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          responsavel_cargo: string | null
          responsavel_nome: string | null
          responsavel_tecnico: string | null
          telefone: string | null
          term_recommendations: string | null
          term_safety_risks: string | null
          uc_nome: string | null
          uc_tipo: string | null
          updated_at: string
        }
        Insert: {
          cadastur?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          icmbio_autorizacao?: string | null
          icmbio_validade?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          responsavel_tecnico?: string | null
          telefone?: string | null
          term_recommendations?: string | null
          term_safety_risks?: string | null
          uc_nome?: string | null
          uc_tipo?: string | null
          updated_at?: string
        }
        Update: {
          cadastur?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          icmbio_autorizacao?: string | null
          icmbio_validade?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          responsavel_tecnico?: string | null
          telefone?: string | null
          term_recommendations?: string | null
          term_safety_risks?: string | null
          uc_nome?: string | null
          uc_tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sgs_equipment: {
        Row: {
          category: string
          created_at: string
          id: string
          last_inspection: string | null
          name: string
          next_inspection: string | null
          notes: string | null
          responsible: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_inspection?: string | null
          name: string
          next_inspection?: string | null
          notes?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_inspection?: string | null
          name?: string
          next_inspection?: string | null
          notes?: string | null
          responsible?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sgs_incidents: {
        Row: {
          action_taken: string | null
          booking_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string
          guide_name: string | null
          id: string
          incident_code: string
          lessons_learned: string | null
          location: string
          people_involved: string | null
          photos: string[] | null
          pre_activated: boolean | null
          severity: string
          status: string
          tour_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          guide_name?: string | null
          id?: string
          incident_code: string
          lessons_learned?: string | null
          location: string
          people_involved?: string | null
          photos?: string[] | null
          pre_activated?: boolean | null
          severity: string
          status?: string
          tour_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          guide_name?: string | null
          id?: string
          incident_code?: string
          lessons_learned?: string | null
          location?: string
          people_involved?: string | null
          photos?: string[] | null
          pre_activated?: boolean | null
          severity?: string
          status?: string
          tour_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_incidents_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_pgsat: {
        Row: {
          conteudo_json: Json | null
          created_at: string
          data_emissao: string | null
          data_validade: string | null
          id: string
          observacoes: string | null
          pdf_url: string | null
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
          versao: string
        }
        Insert: {
          conteudo_json?: Json | null
          created_at?: string
          data_emissao?: string | null
          data_validade?: string | null
          id?: string
          observacoes?: string | null
          pdf_url?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Update: {
          conteudo_json?: Json | null
          created_at?: string
          data_emissao?: string | null
          data_validade?: string | null
          id?: string
          observacoes?: string | null
          pdf_url?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Relationships: []
      }
      sgs_procedures: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      sgs_risk_term_minors: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          is_adult: boolean | null
          responsible_name: string | null
          risk_term_id: string
          signature_data: string | null
          signed_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_adult?: boolean | null
          responsible_name?: string | null
          risk_term_id: string
          signature_data?: string | null
          signed_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_adult?: boolean | null
          responsible_name?: string | null
          risk_term_id?: string
          signature_data?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_risk_term_minors_risk_term_id_fkey"
            columns: ["risk_term_id"]
            isOneToOne: false
            referencedRelation: "sgs_risk_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_risk_terms: {
        Row: {
          accepted: boolean
          address: string | null
          allergy_details: string | null
          birth_date: string | null
          booking_id: string | null
          cancellation_policy: string | null
          city_state: string | null
          company_id: string | null
          cpf: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          has_allergy: boolean | null
          has_diabetes: boolean | null
          has_fainting_convulsions: boolean | null
          has_immobilized_part: boolean | null
          has_multiple_signers: boolean | null
          has_phobia: boolean | null
          has_special_needs: boolean | null
          health_questions: string[] | null
          id: string
          is_obese: boolean | null
          is_sedentary: boolean | null
          medication_details: string | null
          nationality: string | null
          pdf_url: string | null
          phobia_details: string | null
          phone: string | null
          recent_surgery: boolean | null
          risks_informed: string[]
          safety_controls_informed: boolean | null
          signature_data: string | null
          signed_at: string | null
          takes_medication: boolean | null
          term_date: string | null
          tour_id: string | null
          tour_name: string
          under_influence: boolean | null
          vehicle_id: string | null
        }
        Insert: {
          accepted?: boolean
          address?: string | null
          allergy_details?: string | null
          birth_date?: string | null
          booking_id?: string | null
          cancellation_policy?: string | null
          city_state?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_allergy?: boolean | null
          has_diabetes?: boolean | null
          has_fainting_convulsions?: boolean | null
          has_immobilized_part?: boolean | null
          has_multiple_signers?: boolean | null
          has_phobia?: boolean | null
          has_special_needs?: boolean | null
          health_questions?: string[] | null
          id?: string
          is_obese?: boolean | null
          is_sedentary?: boolean | null
          medication_details?: string | null
          nationality?: string | null
          pdf_url?: string | null
          phobia_details?: string | null
          phone?: string | null
          recent_surgery?: boolean | null
          risks_informed?: string[]
          safety_controls_informed?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          takes_medication?: boolean | null
          term_date?: string | null
          tour_id?: string | null
          tour_name: string
          under_influence?: boolean | null
          vehicle_id?: string | null
        }
        Update: {
          accepted?: boolean
          address?: string | null
          allergy_details?: string | null
          birth_date?: string | null
          booking_id?: string | null
          cancellation_policy?: string | null
          city_state?: string | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_allergy?: boolean | null
          has_diabetes?: boolean | null
          has_fainting_convulsions?: boolean | null
          has_immobilized_part?: boolean | null
          has_multiple_signers?: boolean | null
          has_phobia?: boolean | null
          has_special_needs?: boolean | null
          health_questions?: string[] | null
          id?: string
          is_obese?: boolean | null
          is_sedentary?: boolean | null
          medication_details?: string | null
          nationality?: string | null
          pdf_url?: string | null
          phobia_details?: string | null
          phone?: string | null
          recent_surgery?: boolean | null
          risks_informed?: string[]
          safety_controls_informed?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          takes_medication?: boolean | null
          term_date?: string | null
          tour_id?: string | null
          tour_name?: string
          under_influence?: boolean | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_risk_terms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_risk_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sgs_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_risk_terms_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_risk_terms_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sgs_risk_terms_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "sgs_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_risks: {
        Row: {
          activity: string
          control_measures: string | null
          created_at: string
          created_by: string | null
          hazard: string
          id: string
          impact: number
          probability: number
          residual_impact: number | null
          residual_probability: number | null
          residual_risk_level: number | null
          responsible: string
          risk_code: string
          risk_level: number | null
          stage: string
          status: string
          tour_id: string | null
          treatment_measures: string | null
          updated_at: string
        }
        Insert: {
          activity: string
          control_measures?: string | null
          created_at?: string
          created_by?: string | null
          hazard: string
          id?: string
          impact: number
          probability: number
          residual_impact?: number | null
          residual_probability?: number | null
          residual_risk_level?: number | null
          responsible: string
          risk_code: string
          risk_level?: number | null
          stage: string
          status?: string
          tour_id?: string | null
          treatment_measures?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string
          control_measures?: string | null
          created_at?: string
          created_by?: string | null
          hazard?: string
          id?: string
          impact?: number
          probability?: number
          residual_impact?: number | null
          residual_probability?: number | null
          residual_risk_level?: number | null
          responsible?: string
          risk_code?: string
          risk_level?: number | null
          stage?: string
          status?: string
          tour_id?: string | null
          treatment_measures?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_risks_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_rotas: {
        Row: {
          capacidade_maxima: number | null
          created_at: string
          descricao: string | null
          dificuldade: string | null
          distancia_km: number | null
          duracao_estimada: string | null
          id: string
          mapa_url: string | null
          nome: string
          observacoes: string | null
          pontos_interesse: string[] | null
          riscos_conhecidos: string[] | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          dificuldade?: string | null
          distancia_km?: number | null
          duracao_estimada?: string | null
          id?: string
          mapa_url?: string | null
          nome: string
          observacoes?: string | null
          pontos_interesse?: string[] | null
          riscos_conhecidos?: string[] | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          dificuldade?: string | null
          distancia_km?: number | null
          duracao_estimada?: string | null
          id?: string
          mapa_url?: string | null
          nome?: string
          observacoes?: string | null
          pontos_interesse?: string[] | null
          riscos_conhecidos?: string[] | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      sgs_safety_surveys: {
        Row: {
          booking_id: string | null
          comments: string | null
          created_at: string
          danger_description: string | null
          danger_situations: boolean | null
          felt_safe: number | null
          guide_explained_risks: boolean | null
          id: string
          overall_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          comments?: string | null
          created_at?: string
          danger_description?: string | null
          danger_situations?: boolean | null
          felt_safe?: number | null
          guide_explained_risks?: boolean | null
          id?: string
          overall_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          comments?: string | null
          created_at?: string
          danger_description?: string | null
          danger_situations?: boolean | null
          felt_safe?: number | null
          guide_explained_risks?: boolean | null
          id?: string
          overall_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_safety_surveys_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_staff: {
        Row: {
          active: boolean
          block_reason: string | null
          blocked: boolean
          certifications: string[] | null
          collaborator_id: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          block_reason?: string | null
          blocked?: boolean
          certifications?: string[] | null
          collaborator_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          block_reason?: string | null
          blocked?: boolean
          certifications?: string[] | null
          collaborator_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_staff_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_staff_trainings: {
        Row: {
          certificate_url: string | null
          completed_date: string
          created_at: string
          expiry_date: string | null
          id: string
          staff_id: string
          status: string
          training_name: string
          training_type: string
        }
        Insert: {
          certificate_url?: string | null
          completed_date: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          staff_id: string
          status?: string
          training_name: string
          training_type: string
        }
        Update: {
          certificate_url?: string | null
          completed_date?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          staff_id?: string
          status?: string
          training_name?: string
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_staff_trainings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "sgs_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_supplier_compliance: {
        Row: {
          block_reason: string | null
          blocked: boolean
          certification_expiry: string | null
          certifications: string[] | null
          created_at: string
          documentation_ok: boolean
          id: string
          partner_id: string | null
          status: string
          supplier_name: string
          supplier_type: string
          updated_at: string
          vehicle_inspection_date: string | null
          vehicle_inspection_ok: boolean | null
        }
        Insert: {
          block_reason?: string | null
          blocked?: boolean
          certification_expiry?: string | null
          certifications?: string[] | null
          created_at?: string
          documentation_ok?: boolean
          id?: string
          partner_id?: string | null
          status?: string
          supplier_name: string
          supplier_type: string
          updated_at?: string
          vehicle_inspection_date?: string | null
          vehicle_inspection_ok?: boolean | null
        }
        Update: {
          block_reason?: string | null
          blocked?: boolean
          certification_expiry?: string | null
          certifications?: string[] | null
          created_at?: string
          documentation_ok?: boolean
          id?: string
          partner_id?: string | null
          status?: string
          supplier_name?: string
          supplier_type?: string
          updated_at?: string
          vehicle_inspection_date?: string | null
          vehicle_inspection_ok?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sgs_supplier_compliance_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_veiculos: {
        Row: {
          ano: number | null
          capacidade: number | null
          chassi: string | null
          combustivel: string | null
          cor: string | null
          created_at: string
          foto_url: string | null
          id: string
          licenciamento_validade: string | null
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
          quilometragem: number | null
          renavam: string | null
          seguradora: string | null
          seguro_validade: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          capacidade?: number | null
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          licenciamento_validade?: string | null
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
          quilometragem?: number | null
          renavam?: string | null
          seguradora?: string | null
          seguro_validade?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          capacidade?: number | null
          chassi?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          licenciamento_validade?: string | null
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
          quilometragem?: number | null
          renavam?: string | null
          seguradora?: string | null
          seguro_validade?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tours: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          default_mode: string
          departure: string | null
          description: string | null
          difficulty: string | null
          duration: string | null
          group_size: string | null
          highlights: string[] | null
          id: string
          images: string[] | null
          includes: string[] | null
          location: string | null
          main_operator_id: string | null
          meta_description: string | null
          meta_title: string | null
          mode_collective_enabled: boolean
          mode_private_enabled: boolean
          name: string
          operator: string | null
          pix_discount: number
          price: number
          private_price: number
          rating: number | null
          reviews_count: number | null
          slug: string
          tag: string | null
          updated_at: string
          vehicle_capacity: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_mode?: string
          departure?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          group_size?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          location?: string | null
          main_operator_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mode_collective_enabled?: boolean
          mode_private_enabled?: boolean
          name: string
          operator?: string | null
          pix_discount?: number
          price: number
          private_price?: number
          rating?: number | null
          reviews_count?: number | null
          slug: string
          tag?: string | null
          updated_at?: string
          vehicle_capacity?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_mode?: string
          departure?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          group_size?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          location?: string | null
          main_operator_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mode_collective_enabled?: boolean
          mode_private_enabled?: boolean
          name?: string
          operator?: string | null
          pix_discount?: number
          price?: number
          private_price?: number
          rating?: number | null
          reviews_count?: number | null
          slug?: string
          tag?: string | null
          updated_at?: string
          vehicle_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "tours_main_operator_id_fkey"
            columns: ["main_operator_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_routes: {
        Row: {
          active: boolean
          created_at: string
          departures: string[] | null
          destination: string
          distance: string | null
          duration: string | null
          id: string
          origin: string
          pix_discount: number
          preferred_partner_id: string | null
          price: number
          seats: number | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          departures?: string[] | null
          destination: string
          distance?: string | null
          duration?: string | null
          id?: string
          origin: string
          pix_discount?: number
          preferred_partner_id?: string | null
          price: number
          seats?: number | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          departures?: string[] | null
          destination?: string
          distance?: string | null
          duration?: string | null
          id?: string
          origin?: string
          pix_discount?: number
          preferred_partner_id?: string | null
          price?: number
          seats?: number | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_routes_preferred_partner_id_fkey"
            columns: ["preferred_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_management: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
