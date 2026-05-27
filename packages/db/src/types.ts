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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          payload: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          depth: number
          display_order: number
          icon_url: string | null
          id: string
          is_active: boolean
          is_leaf: boolean
          listing_count: number
          name: string
          name_i18n: Json
          parent_id: string | null
          slug: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Insert: {
          created_at?: string
          depth?: number
          display_order?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          is_leaf?: boolean
          listing_count?: number
          name: string
          name_i18n?: Json
          parent_id?: string | null
          slug: string
          vertical: Database["public"]["Enums"]["vertical"]
        }
        Update: {
          created_at?: string
          depth?: number
          display_order?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          is_leaf?: boolean
          listing_count?: number
          name?: string
          name_i18n?: Json
          parent_id?: string | null
          slug?: string
          vertical?: Database["public"]["Enums"]["vertical"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          category_id: string
          data_type: string
          display_order: number
          id: string
          is_filterable: boolean
          is_required: boolean
          is_searchable: boolean
          key: string
          label: string
          label_i18n: Json | null
          options: Json | null
        }
        Insert: {
          category_id: string
          data_type: string
          display_order?: number
          id?: string
          is_filterable?: boolean
          is_required?: boolean
          is_searchable?: boolean
          key: string
          label: string
          label_i18n?: Json | null
          options?: Json | null
        }
        Update: {
          category_id?: string
          data_type?: string
          display_order?: number
          id?: string
          is_filterable?: boolean
          is_required?: boolean
          is_searchable?: boolean
          key?: string
          label?: string
          label_i18n?: Json | null
          options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country: string
          created_at: string
          id: string
          is_tier: number | null
          location: unknown
          name: string
          population: number | null
          slug: string
          state: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          is_tier?: number | null
          location?: unknown
          name: string
          population?: number | null
          slug: string
          state: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_tier?: number | null
          location?: unknown
          name?: string
          population?: number | null
          slug?: string
          state?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_archived: boolean
          buyer_id: string
          buyer_unread: number
          created_at: string
          id: string
          is_blocked: boolean
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: string | null
          seller_archived: boolean
          seller_id: string
          seller_unread: number
        }
        Insert: {
          buyer_archived?: boolean
          buyer_id: string
          buyer_unread?: number
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          seller_archived?: boolean
          seller_id: string
          seller_unread?: number
        }
        Update: {
          buyer_archived?: boolean
          buyer_id?: string
          buyer_unread?: number
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          seller_archived?: boolean
          seller_id?: string
          seller_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      fraud_signals: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          score: number | null
          signal: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          score?: number | null
          signal: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          score?: number | null
          signal?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          cover_text: string | null
          employer_note: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          status_updated_at: string
          voice_cv_url: string | null
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          cover_text?: string | null
          employer_note?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          voice_cv_url?: string | null
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          cover_text?: string | null
          employer_note?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          voice_cv_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          apply_url: string | null
          education_min: string | null
          experience_years_max: number | null
          experience_years_min: number | null
          is_urgent: boolean
          is_walkin: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          listing_id: string
          openings: number
          salary_max: number | null
          salary_min: number | null
          salary_period: Database["public"]["Enums"]["salary_period"] | null
          skills: string[]
          walkin_address: string | null
          walkin_dates: unknown
          work_mode: Database["public"]["Enums"]["work_mode"]
        }
        Insert: {
          application_deadline?: string | null
          apply_url?: string | null
          education_min?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          is_urgent?: boolean
          is_walkin?: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          listing_id: string
          openings?: number
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: Database["public"]["Enums"]["salary_period"] | null
          skills?: string[]
          walkin_address?: string | null
          walkin_dates?: unknown
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Update: {
          application_deadline?: string | null
          apply_url?: string | null
          education_min?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          is_urgent?: boolean
          is_walkin?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          listing_id?: string
          openings?: number
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: Database["public"]["Enums"]["salary_period"] | null
          skills?: string[]
          walkin_address?: string | null
          walkin_dates?: unknown
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          reference_hash: string | null
          reference_masked: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          type: Database["public"]["Enums"]["kyc_type"]
          user_id: string
          vendor: string | null
          vendor_request_id: string | null
          verification_data: Json | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reference_hash?: string | null
          reference_masked?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          type: Database["public"]["Enums"]["kyc_type"]
          user_id: string
          vendor?: string | null
          vendor_request_id?: string | null
          verification_data?: Json | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reference_hash?: string | null
          reference_masked?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          type?: Database["public"]["Enums"]["kyc_type"]
          user_id?: string
          vendor?: string | null
          vendor_request_id?: string | null
          verification_data?: Json | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          reason: string
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["ledger_entry_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["ledger_entry_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["ledger_entry_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_attributes: {
        Row: {
          attrs: Json
          listing_id: string
          updated_at: string
        }
        Insert: {
          attrs?: Json
          listing_id: string
          updated_at?: string
        }
        Update: {
          attrs?: Json
          listing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_attributes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          blurhash: string | null
          created_at: string
          duration_sec: number | null
          height: number | null
          id: string
          listing_id: string
          sort_order: number
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
          width: number | null
        }
        Insert: {
          blurhash?: string | null
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          listing_id: string
          sort_order?: number
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          url: string
          width?: number | null
        }
        Update: {
          blurhash?: string | null
          created_at?: string
          duration_sec?: number | null
          height?: number | null
          id?: string
          listing_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          id: string
          ip_hash: string | null
          listing_id: string
          user_agent: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          listing_id: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_hash?: string | null
          listing_id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          boost_score: number
          category_id: string
          city_id: string | null
          condition: Database["public"]["Enums"]["listing_condition"] | null
          contact_count: number
          created_at: string
          currency: string
          description: string | null
          expires_at: string | null
          featured_until: string | null
          id: string
          is_featured: boolean
          language: string
          locality_id: string | null
          location: unknown
          metadata: Json
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          posted_at: string | null
          price: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          removed_at: string | null
          removed_reason: string | null
          save_count: number
          search_vector: unknown
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical"]
          view_count: number
        }
        Insert: {
          address?: string | null
          boost_score?: number
          category_id: string
          city_id?: string | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          contact_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          language?: string
          locality_id?: string | null
          location?: unknown
          metadata?: Json
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          posted_at?: string | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          removed_at?: string | null
          removed_reason?: string | null
          save_count?: number
          search_vector?: unknown
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          vertical: Database["public"]["Enums"]["vertical"]
          view_count?: number
        }
        Update: {
          address?: string | null
          boost_score?: number
          category_id?: string
          city_id?: string | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          contact_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          language?: string
          locality_id?: string | null
          location?: unknown
          metadata?: Json
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          posted_at?: string | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          removed_at?: string | null
          removed_reason?: string | null
          save_count?: number
          search_vector?: unknown
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical"]
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      localities: {
        Row: {
          city_id: string
          created_at: string
          id: string
          kind: string | null
          location: unknown
          name: string
          pin_code: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          kind?: string | null
          location?: unknown
          name: string
          pin_code?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          kind?: string | null
          location?: unknown
          name?: string
          pin_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "localities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          metadata: Json | null
          size_bytes: number | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Insert: {
          id?: string
          message_id: string
          metadata?: Json | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Update: {
          id?: string
          message_id?: string
          metadata?: Json | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          payload: Json | null
          read_at: string | null
          sender_id: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sender_id: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sender_id?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string | null
          reason: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          reason?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          delivered_via: string[] | null
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          delivered_via?: string[] | null
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          delivered_via?: string[] | null
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
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
      orders: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          razorpay_order_id: string | null
          reference_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          tax_amount: number
          total_amount: number | null
          type: Database["public"]["Enums"]["order_type"]
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          razorpay_order_id?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tax_amount?: number
          total_amount?: number | null
          type: Database["public"]["Enums"]["order_type"]
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          razorpay_order_id?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tax_amount?: number
          total_amount?: number | null
          type?: Database["public"]["Enums"]["order_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          captured_at: string | null
          created_at: string
          failure_reason: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          razorpay_payment_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          captured_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          razorpay_payment_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          captured_at?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          razorpay_payment_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          business_name: string | null
          city_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          gstin: string | null
          handle: string | null
          id: string
          is_banned: boolean
          is_business: boolean
          kyc_tier: Database["public"]["Enums"]["kyc_tier"]
          last_active_at: string | null
          listings_count: number
          locality_id: string | null
          phone_e164: string | null
          preferred_lang: string
          rating_avg: number | null
          rating_count: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          business_name?: string | null
          city_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gstin?: string | null
          handle?: string | null
          id: string
          is_banned?: boolean
          is_business?: boolean
          kyc_tier?: Database["public"]["Enums"]["kyc_tier"]
          last_active_at?: string | null
          listings_count?: number
          locality_id?: string | null
          phone_e164?: string | null
          preferred_lang?: string
          rating_avg?: number | null
          rating_count?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          business_name?: string | null
          city_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gstin?: string | null
          handle?: string | null
          id?: string
          is_banned?: boolean
          is_business?: boolean
          kyc_tier?: Database["public"]["Enums"]["kyc_tier"]
          last_active_at?: string | null
          listings_count?: number
          locality_id?: string | null
          phone_e164?: string | null
          preferred_lang?: string
          rating_avg?: number | null
          rating_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          app_version: string | null
          device_id: string
          id: string
          last_seen: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          device_id: string
          id?: string
          last_seen?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          device_id?: string
          id?: string
          last_seen?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          education: Json
          expected_period: Database["public"]["Enums"]["salary_period"] | null
          expected_salary: number | null
          experience: Json
          headline: string | null
          last_updated_at: string
          open_to_work: boolean
          resume_url: string | null
          skills: string[]
          summary: string | null
          user_id: string
          voice_cv_url: string | null
        }
        Insert: {
          education?: Json
          expected_period?: Database["public"]["Enums"]["salary_period"] | null
          expected_salary?: number | null
          experience?: Json
          headline?: string | null
          last_updated_at?: string
          open_to_work?: boolean
          resume_url?: string | null
          skills?: string[]
          summary?: string | null
          user_id: string
          voice_cv_url?: string | null
        }
        Update: {
          education?: Json
          expected_period?: Database["public"]["Enums"]["salary_period"] | null
          expected_salary?: number | null
          experience?: Json
          headline?: string | null
          last_updated_at?: string
          open_to_work?: boolean
          resume_url?: string | null
          skills?: string[]
          summary?: string | null
          user_id?: string
          voice_cv_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string | null
          created_at: string
          id: string
          is_verified: boolean
          listing_id: string | null
          photos: string[] | null
          rating: number
          reply_at: string | null
          reply_body: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          listing_id?: string | null
          photos?: string[] | null
          rating: number
          reply_at?: string | null
          reply_body?: string | null
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          listing_id?: string | null
          photos?: string[] | null
          rating?: number
          reply_at?: string | null
          reply_body?: string | null
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          listing_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          listing_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          listing_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_notified_at: string | null
          name: string | null
          notify_email: boolean
          notify_push: boolean
          query_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name?: string | null
          notify_email?: boolean
          notify_push?: boolean
          query_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name?: string | null
          notify_email?: boolean
          notify_push?: boolean
          query_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          address: string | null
          cancellation_reason: string | null
          created_at: string
          customer_id: string
          duration_minutes: number | null
          final_price: number | null
          id: string
          location: unknown
          notes: string | null
          provider_id: string
          quoted_price: number | null
          scheduled_at: string | null
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          cancellation_reason?: string | null
          created_at?: string
          customer_id: string
          duration_minutes?: number | null
          final_price?: number | null
          id?: string
          location?: unknown
          notes?: string | null
          provider_id: string
          quoted_price?: number | null
          scheduled_at?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          cancellation_reason?: string | null
          created_at?: string
          customer_id?: string
          duration_minutes?: number | null
          final_price?: number | null
          id?: string
          location?: unknown
          notes?: string | null
          provider_id?: string
          quoted_price?: number | null
          scheduled_at?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      services: {
        Row: {
          availability: Json
          insurance_covered: boolean
          is_verified_pro: boolean
          listing_id: string
          rate_max: number | null
          rate_min: number | null
          response_time_hours: number | null
          service_price_type: Database["public"]["Enums"]["service_price_type"]
          service_radius_km: number | null
          years_experience: number | null
        }
        Insert: {
          availability?: Json
          insurance_covered?: boolean
          is_verified_pro?: boolean
          listing_id: string
          rate_max?: number | null
          rate_min?: number | null
          response_time_hours?: number | null
          service_price_type?: Database["public"]["Enums"]["service_price_type"]
          service_radius_km?: number | null
          years_experience?: number | null
        }
        Update: {
          availability?: Json
          insurance_covered?: boolean
          is_verified_pro?: boolean
          listing_id?: string
          rate_max?: number | null
          rate_min?: number | null
          response_time_hours?: number | null
          service_price_type?: Database["public"]["Enums"]["service_price_type"]
          service_radius_km?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          ends_at: string
          id: string
          plan: string
          razorpay_subscription_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          plan: string
          razorpay_subscription_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          plan?: string
          razorpay_subscription_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      search_listings: {
        Args: {
          cat_id?: string
          lat?: number
          lim?: number
          lng?: number
          max_price?: number
          min_price?: number
          off?: number
          q?: string
          radius_km?: number
          vert?: Database["public"]["Enums"]["vertical"]
        }
        Returns: {
          address: string | null
          boost_score: number
          category_id: string
          city_id: string | null
          condition: Database["public"]["Enums"]["listing_condition"] | null
          contact_count: number
          created_at: string
          currency: string
          description: string | null
          expires_at: string | null
          featured_until: string | null
          id: string
          is_featured: boolean
          language: string
          locality_id: string | null
          location: unknown
          metadata: Json
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          posted_at: string | null
          price: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          removed_at: string | null
          removed_reason: string | null
          save_count: number
          search_vector: unknown
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical"]
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      uuidv7: { Args: never; Returns: string }
    }
    Enums: {
      application_status:
        | "applied"
        | "viewed"
        | "shortlisted"
        | "interview"
        | "offered"
        | "rejected"
        | "withdrawn"
        | "hired"
      booking_status:
        | "requested"
        | "quoted"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "gig"
        | "internship"
        | "volunteer"
      kyc_status: "pending" | "verified" | "failed" | "expired"
      kyc_tier: "tier0" | "tier1" | "tier2" | "tier3"
      kyc_type:
        | "phone"
        | "email"
        | "pan"
        | "aadhaar_masked"
        | "digilocker"
        | "gstin"
        | "bank_account"
      ledger_entry_type: "credit" | "debit"
      listing_condition: "new" | "like_new" | "good" | "fair" | "for_parts"
      listing_status:
        | "draft"
        | "pending_review"
        | "active"
        | "paused"
        | "sold"
        | "expired"
        | "removed"
      media_type:
        | "image"
        | "video"
        | "audio"
        | "document"
        | "floorplan"
        | "panorama_360"
      message_type:
        | "text"
        | "image"
        | "voice"
        | "video"
        | "offer"
        | "location"
        | "system"
      moderation_action_type:
        | "warn"
        | "hide"
        | "remove"
        | "suspend"
        | "ban"
        | "restore"
      moderation_status:
        | "clean"
        | "flagged"
        | "under_review"
        | "approved"
        | "rejected"
      notification_type:
        | "message"
        | "listing"
        | "application"
        | "booking"
        | "payment"
        | "system"
        | "marketing"
      order_status: "created" | "paid" | "failed" | "refunded" | "cancelled"
      order_type:
        | "featured_listing"
        | "boost"
        | "subscription"
        | "escrow"
        | "lead_pack"
      payment_method:
        | "upi"
        | "card"
        | "netbanking"
        | "wallet"
        | "emi"
        | "bank_transfer"
      payment_status:
        | "initiated"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "disputed"
      price_type: "fixed" | "negotiable" | "free" | "on_request"
      report_status: "open" | "triaged" | "actioned" | "dismissed"
      report_target_type:
        | "listing"
        | "user"
        | "message"
        | "review"
        | "service"
        | "job"
      salary_period:
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "per_task"
      service_price_type: "hourly" | "flat" | "per_visit" | "quote"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      vertical: "goods" | "jobs" | "services" | "real_estate"
      work_mode: "onsite" | "remote" | "hybrid"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      application_status: [
        "applied",
        "viewed",
        "shortlisted",
        "interview",
        "offered",
        "rejected",
        "withdrawn",
        "hired",
      ],
      booking_status: [
        "requested",
        "quoted",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "gig",
        "internship",
        "volunteer",
      ],
      kyc_status: ["pending", "verified", "failed", "expired"],
      kyc_tier: ["tier0", "tier1", "tier2", "tier3"],
      kyc_type: [
        "phone",
        "email",
        "pan",
        "aadhaar_masked",
        "digilocker",
        "gstin",
        "bank_account",
      ],
      ledger_entry_type: ["credit", "debit"],
      listing_condition: ["new", "like_new", "good", "fair", "for_parts"],
      listing_status: [
        "draft",
        "pending_review",
        "active",
        "paused",
        "sold",
        "expired",
        "removed",
      ],
      media_type: [
        "image",
        "video",
        "audio",
        "document",
        "floorplan",
        "panorama_360",
      ],
      message_type: [
        "text",
        "image",
        "voice",
        "video",
        "offer",
        "location",
        "system",
      ],
      moderation_action_type: [
        "warn",
        "hide",
        "remove",
        "suspend",
        "ban",
        "restore",
      ],
      moderation_status: [
        "clean",
        "flagged",
        "under_review",
        "approved",
        "rejected",
      ],
      notification_type: [
        "message",
        "listing",
        "application",
        "booking",
        "payment",
        "system",
        "marketing",
      ],
      order_status: ["created", "paid", "failed", "refunded", "cancelled"],
      order_type: [
        "featured_listing",
        "boost",
        "subscription",
        "escrow",
        "lead_pack",
      ],
      payment_method: [
        "upi",
        "card",
        "netbanking",
        "wallet",
        "emi",
        "bank_transfer",
      ],
      payment_status: [
        "initiated",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "disputed",
      ],
      price_type: ["fixed", "negotiable", "free", "on_request"],
      report_status: ["open", "triaged", "actioned", "dismissed"],
      report_target_type: [
        "listing",
        "user",
        "message",
        "review",
        "service",
        "job",
      ],
      salary_period: [
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "per_task",
      ],
      service_price_type: ["hourly", "flat", "per_visit", "quote"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      vertical: ["goods", "jobs", "services", "real_estate"],
      work_mode: ["onsite", "remote", "hybrid"],
    },
  },
} as const

