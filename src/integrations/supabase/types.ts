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
      bookings: {
        Row: {
          booking_code: string
          created_at: string
          customer_id: string
          date: string | null
          discount: number
          final_total: number
          guests: number
          id: string
          item_name: string
          notes: string | null
          pay_method: string
          payment_status: string
          pix_code: string | null
          status: string
          total: number
          type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          booking_code: string
          created_at?: string
          customer_id: string
          date?: string | null
          discount?: number
          final_total: number
          guests?: number
          id?: string
          item_name: string
          notes?: string | null
          pay_method: string
          payment_status?: string
          pix_code?: string | null
          status?: string
          total: number
          type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          booking_code?: string
          created_at?: string
          customer_id?: string
          date?: string | null
          discount?: number
          final_total?: number
          guests?: number
          id?: string
          item_name?: string
          notes?: string | null
          pay_method?: string
          payment_status?: string
          pix_code?: string | null
          status?: string
          total?: number
          type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: string
          created_at: string
          descricao: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
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
        ]
      }
      customers: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
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
        Relationships: []
      }
      partners: {
        Row: {
          active: boolean
          address: string | null
          cadastur: string | null
          cnh: string | null
          cnh_validade: string | null
          commission_rate: number | null
          contact_name: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          cadastur?: string | null
          cnh?: string | null
          cnh_validade?: string | null
          commission_rate?: number | null
          contact_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          cadastur?: string | null
          cnh?: string | null
          cnh_validade?: string | null
          commission_rate?: number | null
          contact_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
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
          comment: string | null
          country: string | null
          created_at: string
          id: string
          rating: number
          tour_id: string | null
        }
        Insert: {
          author: string
          avatar?: string | null
          comment?: string | null
          country?: string | null
          created_at?: string
          id?: string
          rating: number
          tour_id?: string | null
        }
        Update: {
          author?: string
          avatar?: string | null
          comment?: string | null
          country?: string | null
          created_at?: string
          id?: string
          rating?: number
          tour_id?: string | null
        }
        Relationships: [
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
          created_at?: string
          date?: string
          id?: string
          improvement_plan?: string | null
          observations?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      sgs_incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          date: string
          description: string
          guide_name: string | null
          id: string
          incident_code: string
          location: string
          people_involved: string | null
          photos: string[] | null
          severity: string
          status: string
          tour_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          date?: string
          description: string
          guide_name?: string | null
          id?: string
          incident_code: string
          location: string
          people_involved?: string | null
          photos?: string[] | null
          severity: string
          status?: string
          tour_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          date?: string
          description?: string
          guide_name?: string | null
          id?: string
          incident_code?: string
          location?: string
          people_involved?: string | null
          photos?: string[] | null
          severity?: string
          status?: string
          tour_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_incidents_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_risk_terms: {
        Row: {
          accepted: boolean
          booking_id: string | null
          cancellation_policy: string | null
          created_at: string
          customer_name: string
          id: string
          nationality: string | null
          pdf_url: string | null
          phone: string | null
          risks_informed: string[]
          signature_data: string | null
          signed_at: string | null
          tour_name: string
        }
        Insert: {
          accepted?: boolean
          booking_id?: string | null
          cancellation_policy?: string | null
          created_at?: string
          customer_name: string
          id?: string
          nationality?: string | null
          pdf_url?: string | null
          phone?: string | null
          risks_informed?: string[]
          signature_data?: string | null
          signed_at?: string | null
          tour_name: string
        }
        Update: {
          accepted?: boolean
          booking_id?: string | null
          cancellation_policy?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          nationality?: string | null
          pdf_url?: string | null
          phone?: string | null
          risks_informed?: string[]
          signature_data?: string | null
          signed_at?: string | null
          tour_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sgs_risk_terms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sgs_risks: {
        Row: {
          activity: string
          control_measures: string | null
          created_at: string
          hazard: string
          id: string
          impact: number
          probability: number
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
          hazard: string
          id?: string
          impact: number
          probability: number
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
          hazard?: string
          id?: string
          impact?: number
          probability?: number
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
        Relationships: []
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
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tours: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
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
          name: string
          operator: string | null
          pix_discount: number
          price: number
          rating: number | null
          reviews_count: number | null
          slug: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
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
          name: string
          operator?: string | null
          pix_discount?: number
          price: number
          rating?: number | null
          reviews_count?: number | null
          slug: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
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
          name?: string
          operator?: string | null
          pix_discount?: number
          price?: number
          rating?: number | null
          reviews_count?: number | null
          slug?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
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
          price?: number
          seats?: number | null
          updated_at?: string
          vehicle_type?: string | null
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
