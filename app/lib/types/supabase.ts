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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: []
      }
      alert_log: {
        Row: {
          id: string
          new_band: string
          old_band: string
          score: number
          sent_at: string
          tracker_slug: string
          user_id: string | null
        }
        Insert: {
          id?: string
          new_band: string
          old_band: string
          score: number
          sent_at?: string
          tracker_slug: string
          user_id?: string | null
        }
        Update: {
          id?: string
          new_band?: string
          old_band?: string
          score?: number
          sent_at?: string
          tracker_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_sends: {
        Row: {
          band_from: string
          band_to: string
          id: string
          interpretation: string | null
          sent_at: string
          tracker_slug: string
          user_id: string
        }
        Insert: {
          band_from: string
          band_to: string
          id?: string
          interpretation?: string | null
          sent_at?: string
          tracker_slug: string
          user_id: string
        }
        Update: {
          band_from?: string
          band_to?: string
          id?: string
          interpretation?: string | null
          sent_at?: string
          tracker_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_sends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_buffer: {
        Row: {
          archive_story: Json | null
          conditions: Json | null
          created_at: string
          date: string
          html_content: string | null
          id: string
          lead_sentence: string | null
          needs_review: boolean
          stories: Json | null
          story_count: number | null
          subject_line: string | null
          tracker_data: Json | null
          updated_at: string
        }
        Insert: {
          archive_story?: Json | null
          conditions?: Json | null
          created_at?: string
          date: string
          html_content?: string | null
          id?: string
          lead_sentence?: string | null
          needs_review?: boolean
          stories?: Json | null
          story_count?: number | null
          subject_line?: string | null
          tracker_data?: Json | null
          updated_at?: string
        }
        Update: {
          archive_story?: Json | null
          conditions?: Json | null
          created_at?: string
          date?: string
          html_content?: string | null
          id?: string
          lead_sentence?: string | null
          needs_review?: boolean
          stories?: Json | null
          story_count?: number | null
          subject_line?: string | null
          tracker_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      brief_pulse_history: {
        Row: {
          featured_at: string | null
          tracker_slug: string | null
          user_id: string | null
        }
        Insert: {
          featured_at?: string | null
          tracker_slug?: string | null
          user_id?: string | null
        }
        Update: {
          featured_at?: string | null
          tracker_slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_pulse_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_quality_log: {
        Row: {
          created_at: string
          date: string
          failed_count: number
          id: string
          overall_quality: string
          raw_feedback: string | null
        }
        Insert: {
          created_at?: string
          date: string
          failed_count?: number
          id?: string
          overall_quality: string
          raw_feedback?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          failed_count?: number
          id?: string
          overall_quality?: string
          raw_feedback?: string | null
        }
        Relationships: []
      }
      brief_reply_logs: {
        Row: {
          answer: string
          id: string
          question: string
          responded_at: string | null
          sources_count: number | null
          user_email: string
        }
        Insert: {
          answer: string
          id?: string
          question: string
          responded_at?: string | null
          sources_count?: number | null
          user_email: string
        }
        Update: {
          answer?: string
          id?: string
          question?: string
          responded_at?: string | null
          sources_count?: number | null
          user_email?: string
        }
        Relationships: []
      }
      brief_sends: {
        Row: {
          brief_date: string | null
          email: string
          id: string
          send_type: string | null
          sent_at: string | null
          story_count: number | null
          tracker_slug: string | null
          user_id: string | null
        }
        Insert: {
          brief_date?: string | null
          email: string
          id?: string
          send_type?: string | null
          sent_at?: string | null
          story_count?: number | null
          tracker_slug?: string | null
          user_id?: string | null
        }
        Update: {
          brief_date?: string | null
          email?: string
          id?: string
          send_type?: string | null
          sent_at?: string | null
          story_count?: number | null
          tracker_slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_sends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_subscriptions: {
        Row: {
          calendar_token: string | null
          created_at: string | null
          filters: Json | null
          id: string
          last_accessed: string | null
          user_email: string
        }
        Insert: {
          calendar_token?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_accessed?: string | null
          user_email: string
        }
        Update: {
          calendar_token?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_accessed?: string | null
          user_email?: string
        }
        Relationships: []
      }
      cron_log: {
        Row: {
          agent_name: string
          created_at: string
          errors: string | null
          events_created: number
          id: string
          run_at: string
          stories_processed: number
        }
        Insert: {
          agent_name: string
          created_at?: string
          errors?: string | null
          events_created?: number
          id?: string
          run_at?: string
          stories_processed?: number
        }
        Update: {
          agent_name?: string
          created_at?: string
          errors?: string | null
          events_created?: number
          id?: string
          run_at?: string
          stories_processed?: number
        }
        Relationships: []
      }
      daily_signals: {
        Row: {
          authored_by: string | null
          created_at: string | null
          id: string
          meaning_text: string
          meeting_note: string | null
          signal_date: string
          signal_text: string
        }
        Insert: {
          authored_by?: string | null
          created_at?: string | null
          id?: string
          meaning_text: string
          meeting_note?: string | null
          signal_date: string
          signal_text: string
        }
        Update: {
          authored_by?: string | null
          created_at?: string | null
          id?: string
          meaning_text?: string
          meeting_note?: string | null
          signal_date?: string
          signal_text?: string
        }
        Relationships: []
      }
      divergences: {
        Row: {
          detected_at: string | null
          dismissed_at: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          retired_at: string | null
          score: number
          source_a_claim: string | null
          source_a_date: string | null
          source_a_name: string | null
          source_a_type: string | null
          source_a_url: string | null
          source_b_claim: string | null
          source_b_date: string | null
          source_b_name: string | null
          source_b_type: string | null
          source_b_url: string | null
          story_id_a: string | null
          story_id_b: string | null
          tracker_tag: string
          why_it_matters: string | null
        }
        Insert: {
          detected_at?: string | null
          dismissed_at?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          retired_at?: string | null
          score: number
          source_a_claim?: string | null
          source_a_date?: string | null
          source_a_name?: string | null
          source_a_type?: string | null
          source_a_url?: string | null
          source_b_claim?: string | null
          source_b_date?: string | null
          source_b_name?: string | null
          source_b_type?: string | null
          source_b_url?: string | null
          story_id_a?: string | null
          story_id_b?: string | null
          tracker_tag: string
          why_it_matters?: string | null
        }
        Update: {
          detected_at?: string | null
          dismissed_at?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          retired_at?: string | null
          score?: number
          source_a_claim?: string | null
          source_a_date?: string | null
          source_a_name?: string | null
          source_a_type?: string | null
          source_a_url?: string | null
          source_b_claim?: string | null
          source_b_date?: string | null
          source_b_name?: string | null
          source_b_type?: string | null
          source_b_url?: string | null
          story_id_a?: string | null
          story_id_b?: string | null
          tracker_tag?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_id: string
          embedding: string
          id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_id: string
          embedding: string
          id?: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_id?: string
          embedding?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          file_name: string | null
          file_url: string
          id: string
          is_primary_source: boolean | null
          processed_at: string | null
          source_domain: string
          source_url: string
          status: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          is_primary_source?: boolean | null
          processed_at?: string | null
          source_domain: string
          source_url: string
          status?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          is_primary_source?: boolean | null
          processed_at?: string | null
          source_domain?: string
          source_url?: string
          status?: string | null
        }
        Relationships: []
      }
      document_views: {
        Row: {
          document_id: string | null
          id: string
          viewed_at: string | null
          viewed_by: string | null
        }
        Insert: {
          document_id?: string | null
          id?: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Update: {
          document_id?: string | null
          id?: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contributor_confirmed: boolean | null
          created_at: string | null
          document_type: string | null
          embedding: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          is_primary_source: boolean | null
          is_public: boolean | null
          published_date: string | null
          region_tags: string[] | null
          source_organisation: string | null
          status: string | null
          submitted_by: string | null
          title: string
          topic_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contributor_confirmed?: boolean | null
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_primary_source?: boolean | null
          is_public?: boolean | null
          published_date?: string | null
          region_tags?: string[] | null
          source_organisation?: string | null
          status?: string | null
          submitted_by?: string | null
          title: string
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contributor_confirmed?: boolean | null
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_primary_source?: boolean | null
          is_public?: boolean | null
          published_date?: string | null
          region_tags?: string[] | null
          source_organisation?: string | null
          status?: string | null
          submitted_by?: string | null
          title?: string
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_by: string | null
          description: string | null
          embedding: string | null
          entity_type: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          mention_count: number | null
          metadata: Json | null
          name: string
          parent_entity_id: string | null
          tracker_tag: string | null
        }
        Insert: {
          created_by?: string | null
          description?: string | null
          embedding?: string | null
          entity_type?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          mention_count?: number | null
          metadata?: Json | null
          name: string
          parent_entity_id?: string | null
          tracker_tag?: string | null
        }
        Update: {
          created_by?: string | null
          description?: string | null
          embedding?: string | null
          entity_type?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          mention_count?: number | null
          metadata?: Json | null
          name?: string
          parent_entity_id?: string | null
          tracker_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      entity_aliases: {
        Row: {
          alias_text: string
          alias_type: string | null
          entity_id: string
          id: string
        }
        Insert: {
          alias_text: string
          alias_type?: string | null
          entity_id: string
          id?: string
        }
        Update: {
          alias_text?: string
          alias_type?: string | null
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_aliases_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_aliases_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      entity_mentions: {
        Row: {
          confidence: number | null
          context: string | null
          entity_id: string | null
          id: string
          match_method: string | null
          match_score: number | null
          mentioned_at: string | null
          significance: number | null
          story_id: string | null
        }
        Insert: {
          confidence?: number | null
          context?: string | null
          entity_id?: string | null
          id?: string
          match_method?: string | null
          match_score?: number | null
          mentioned_at?: string | null
          significance?: number | null
          story_id?: string | null
        }
        Update: {
          confidence?: number | null
          context?: string | null
          entity_id?: string | null
          id?: string
          match_method?: string | null
          match_score?: number | null
          mentioned_at?: string | null
          significance?: number | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_mentions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "entity_mentions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "entity_mentions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_review_queue: {
        Row: {
          created_at: string
          id: string
          matched_entity_id: string | null
          matched_name: string | null
          proposed_name: string
          proposed_type: string | null
          resolution: string | null
          resolved_at: string | null
          similarity_score: number | null
          source_context: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          matched_entity_id?: string | null
          matched_name?: string | null
          proposed_name: string
          proposed_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          similarity_score?: number | null
          source_context?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          matched_entity_id?: string | null
          matched_name?: string | null
          proposed_name?: string
          proposed_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          similarity_score?: number | null
          source_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_review_queue_matched_entity_id_fkey"
            columns: ["matched_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_review_queue_matched_entity_id_fkey"
            columns: ["matched_entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      entity_starter_sets: {
        Row: {
          display_order: number
          entity_id: string
          id: string
          job_type: string
        }
        Insert: {
          display_order?: number
          entity_id: string
          id?: string
          job_type: string
        }
        Update: {
          display_order?: number
          entity_id?: string
          id?: string
          job_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_starter_sets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_starter_sets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      expected_decisions: {
        Row: {
          actual_outcome: string | null
          audience_tags: string[] | null
          decision_description: string
          decision_type: string
          event_id: string | null
          expected_outcome: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          significance: string
        }
        Insert: {
          actual_outcome?: string | null
          audience_tags?: string[] | null
          decision_description: string
          decision_type: string
          event_id?: string | null
          expected_outcome?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          significance: string
        }
        Update: {
          actual_outcome?: string | null
          audience_tags?: string[] | null
          decision_description?: string
          decision_type?: string
          event_id?: string | null
          expected_outcome?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          significance?: string
        }
        Relationships: [
          {
            foreignKeyName: "expected_decisions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "governance_events"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_bodies: {
        Row: {
          abbreviation: string
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          scrape_frequency: string
          scrape_url: string
          sector: string
          website: string
        }
        Insert: {
          abbreviation: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          scrape_frequency: string
          scrape_url: string
          sector: string
          website: string
        }
        Update: {
          abbreviation?: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          scrape_frequency?: string
          scrape_url?: string
          sector?: string
          website?: string
        }
        Relationships: []
      }
      governance_events: {
        Row: {
          agenda_url: string | null
          body_id: string | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          is_virtual: boolean | null
          key_decisions: string[] | null
          location: string | null
          next_meeting_date: string | null
          outcome_summary: string | null
          outcome_url: string | null
          registration_deadline: string | null
          registration_url: string | null
          significance: string | null
          significance_reason: string | null
          source_id: string | null
          starts_at: string
          title: string
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          agenda_url?: string | null
          body_id?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          event_type: string
          id?: string
          is_virtual?: boolean | null
          key_decisions?: string[] | null
          location?: string | null
          next_meeting_date?: string | null
          outcome_summary?: string | null
          outcome_url?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          significance?: string | null
          significance_reason?: string | null
          source_id?: string | null
          starts_at: string
          title: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          agenda_url?: string | null
          body_id?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_virtual?: boolean | null
          key_decisions?: string[] | null
          location?: string | null
          next_meeting_date?: string | null
          outcome_summary?: string | null
          outcome_url?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          significance?: string | null
          significance_reason?: string | null
          source_id?: string | null
          starts_at?: string
          title?: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_events_body_id_fkey"
            columns: ["body_id"]
            isOneToOne: false
            referencedRelation: "governance_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      isa_contractors: {
        Row: {
          company_name: string
          contract_area: string | null
          contract_date: string | null
          contract_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          source_url: string | null
          sponsoring_state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contract_area?: string | null
          contract_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          source_url?: string | null
          sponsoring_state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contract_area?: string | null
          contract_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          source_url?: string | null
          sponsoring_state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      iuu_carding_status: {
        Row: {
          card_type: string
          country: string
          id: string
          issued_date: string | null
          reason: string | null
          trade_impact: string | null
          updated_at: string | null
        }
        Insert: {
          card_type: string
          country: string
          id?: string
          issued_date?: string | null
          reason?: string | null
          trade_impact?: string | null
          updated_at?: string | null
        }
        Update: {
          card_type?: string
          country?: string
          id?: string
          issued_date?: string | null
          reason?: string | null
          trade_impact?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lp_portfolios: {
        Row: {
          active: boolean | null
          briefing_type: string | null
          created_at: string | null
          entity_id: string | null
          fund_name: string
          id: string
          notes: string | null
          relationship: string | null
        }
        Insert: {
          active?: boolean | null
          briefing_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          fund_name: string
          id?: string
          notes?: string | null
          relationship?: string | null
        }
        Update: {
          active?: boolean | null
          briefing_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          fund_name?: string
          id?: string
          notes?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lp_portfolios_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lp_portfolios_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      morning_brief_queue: {
        Row: {
          attempts: number
          brief_type: string | null
          created_at: string | null
          error_message: string | null
          html_content: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          story_count: number | null
          subject_line: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          brief_type?: string | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          story_count?: number | null
          subject_line?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          brief_type?: string | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          story_count?: number | null
          subject_line?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "morning_brief_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      project_auto_entries: {
        Row: {
          accepted: boolean
          auto_inserted: boolean
          content: string | null
          dismissed: boolean
          entry_type: string
          id: string
          inserted_at: string
          matched_entity_id: string | null
          project_id: string
          reviewed: boolean
          story_id: string | null
        }
        Insert: {
          accepted?: boolean
          auto_inserted?: boolean
          content?: string | null
          dismissed?: boolean
          entry_type: string
          id?: string
          inserted_at?: string
          matched_entity_id?: string | null
          project_id: string
          reviewed?: boolean
          story_id?: string | null
        }
        Update: {
          accepted?: boolean
          auto_inserted?: boolean
          content?: string | null
          dismissed?: boolean
          entry_type?: string
          id?: string
          inserted_at?: string
          matched_entity_id?: string | null
          project_id?: string
          reviewed?: boolean
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_auto_entries_matched_entity_id_fkey"
            columns: ["matched_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_auto_entries_matched_entity_id_fkey"
            columns: ["matched_entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "project_auto_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_auto_entries_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "project_auto_entries_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          community_status: string | null
          community_submitted: boolean | null
          content: Json | null
          content_text: string | null
          created_at: string
          file_url: string | null
          id: string
          page_count: number | null
          project_id: string | null
          project_name: string | null
          publisher: string | null
          source_domain: string | null
          source_url: string | null
          source_verified: boolean | null
          submission_relevance: string[] | null
          submission_relevance_free: string | null
          submission_type: string | null
          submitted_by_display: string | null
          submitted_by_role: string | null
          submitted_by_user_id: string | null
          summary: string | null
          tags: string[]
          title: string
          tracker_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_status?: string | null
          community_submitted?: boolean | null
          content?: Json | null
          content_text?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          page_count?: number | null
          project_id?: string | null
          project_name?: string | null
          publisher?: string | null
          source_domain?: string | null
          source_url?: string | null
          source_verified?: boolean | null
          submission_relevance?: string[] | null
          submission_relevance_free?: string | null
          submission_type?: string | null
          submitted_by_display?: string | null
          submitted_by_role?: string | null
          submitted_by_user_id?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          tracker_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_status?: string | null
          community_submitted?: boolean | null
          content?: Json | null
          content_text?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          page_count?: number | null
          project_id?: string | null
          project_name?: string | null
          publisher?: string | null
          source_domain?: string | null
          source_url?: string | null
          source_verified?: boolean | null
          submission_relevance?: string[] | null
          submission_relevance_free?: string | null
          submission_type?: string | null
          submitted_by_display?: string | null
          submitted_by_role?: string | null
          submitted_by_user_id?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          tracker_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_drafts: {
        Row: {
          content: string
          created_at: string
          format: string | null
          id: string
          project_id: string
          title: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          format?: string | null
          id?: string
          project_id: string
          title?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          format?: string | null
          id?: string
          project_id?: string
          title?: string | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_entities: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "project_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          last_viewed_at: string | null
          name: string
          narrative_summary: string | null
          narrative_updated_at: string | null
          project_type: string | null
          topic_tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          name: string
          narrative_summary?: string | null
          narrative_updated_at?: string | null
          project_type?: string | null
          topic_tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          name?: string
          narrative_summary?: string | null
          narrative_updated_at?: string | null
          project_type?: string | null
          topic_tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psma_stats: {
        Row: {
          id: string
          party_count: number
          scraped_at: string | null
        }
        Insert: {
          id?: string
          party_count: number
          scraped_at?: string | null
        }
        Update: {
          id?: string
          party_count?: number
          scraped_at?: string | null
        }
        Relationships: []
      }
      saved_stories: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          project_name: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          project_name: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          project_name?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_stories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "saved_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          documents_found: number | null
          documents_new: number | null
          error_message: string | null
          id: string
          ran_at: string | null
          source: string
          status: string
        }
        Insert: {
          documents_found?: number | null
          documents_new?: number | null
          error_message?: string | null
          id?: string
          ran_at?: string | null
          source: string
          status: string
        }
        Update: {
          documents_found?: number | null
          documents_new?: number | null
          error_message?: string | null
          id?: string
          ran_at?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      scraped_sources: {
        Row: {
          content_hash: string
          document_title: string | null
          id: string
          ingested_at: string | null
          published_date: string | null
          raw_html: string | null
          source_name: string
          source_type: string
          url: string
        }
        Insert: {
          content_hash: string
          document_title?: string | null
          id?: string
          ingested_at?: string | null
          published_date?: string | null
          raw_html?: string | null
          source_name: string
          source_type: string
          url: string
        }
        Update: {
          content_hash?: string
          document_title?: string | null
          id?: string
          ingested_at?: string | null
          published_date?: string | null
          raw_html?: string | null
          source_name?: string
          source_type?: string
          url?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: []
      }
      signal_events: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          created_at: string | null
          expires_at: string | null
          headline: string
          id: string
          importance: number
          metadata: Json | null
          signal_type: string
          source_event_id: string | null
          source_story_id: string | null
          tracker_slug: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          created_at?: string | null
          expires_at?: string | null
          headline: string
          id?: string
          importance: number
          metadata?: Json | null
          signal_type: string
          source_event_id?: string | null
          source_story_id?: string | null
          tracker_slug: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          created_at?: string | null
          expires_at?: string | null
          headline?: string
          id?: string
          importance?: number
          metadata?: Json | null
          signal_type?: string
          source_event_id?: string | null
          source_story_id?: string | null
          tracker_slug?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          alert_type: string | null
          confidence_flags: string[] | null
          confidence_score: number | null
          controversy_label: string | null
          controversy_reason: string | null
          controversy_score: number | null
          cross_tracker_flags: string[]
          description: string | null
          document_type: string | null
          entities_extracted: boolean | null
          fetched_at: string | null
          full_summary: string | null
          id: string
          is_featured: boolean
          is_pro: boolean | null
          issuing_body: string | null
          link: string
          overridden_at: string | null
          overridden_by: string | null
          published_at: string | null
          short_summary: string | null
          significance_score: number
          source_name: string | null
          source_tier: string
          source_type: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          summary_generated_at: string | null
          title: string
          topic: string | null
        }
        Insert: {
          alert_type?: string | null
          confidence_flags?: string[] | null
          confidence_score?: number | null
          controversy_label?: string | null
          controversy_reason?: string | null
          controversy_score?: number | null
          cross_tracker_flags?: string[]
          description?: string | null
          document_type?: string | null
          entities_extracted?: boolean | null
          fetched_at?: string | null
          full_summary?: string | null
          id?: string
          is_featured?: boolean
          is_pro?: boolean | null
          issuing_body?: string | null
          link: string
          overridden_at?: string | null
          overridden_by?: string | null
          published_at?: string | null
          short_summary?: string | null
          significance_score?: number
          source_name?: string | null
          source_tier?: string
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          summary_generated_at?: string | null
          title: string
          topic?: string | null
        }
        Update: {
          alert_type?: string | null
          confidence_flags?: string[] | null
          confidence_score?: number | null
          controversy_label?: string | null
          controversy_reason?: string | null
          controversy_score?: number | null
          cross_tracker_flags?: string[]
          description?: string | null
          document_type?: string | null
          entities_extracted?: boolean | null
          fetched_at?: string | null
          full_summary?: string | null
          id?: string
          is_featured?: boolean
          is_pro?: boolean | null
          issuing_body?: string | null
          link?: string
          overridden_at?: string | null
          overridden_by?: string | null
          published_at?: string | null
          short_summary?: string | null
          significance_score?: number
          source_name?: string | null
          source_tier?: string
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          summary_generated_at?: string | null
          title?: string
          topic?: string | null
        }
        Relationships: []
      }
      stories_quarantine: {
        Row: {
          created_at: string | null
          haiku_raw_response: string | null
          haiku_verdict: string | null
          id: string
          published_at: string | null
          raw_content: string | null
          rejection_reason: string | null
          source_name: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          haiku_raw_response?: string | null
          haiku_verdict?: string | null
          id?: string
          published_at?: string | null
          raw_content?: string | null
          rejection_reason?: string | null
          source_name?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          haiku_raw_response?: string | null
          haiku_verdict?: string | null
          id?: string
          published_at?: string | null
          raw_content?: string | null
          rejection_reason?: string | null
          source_name?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      story_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          date_issued: string | null
          document_type: string | null
          embedding: string | null
          id: string
          issuing_body: string | null
          source_url: string | null
          story_id: string | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          date_issued?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: string
          issuing_body?: string | null
          source_url?: string | null
          story_id?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          date_issued?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: string
          issuing_body?: string | null
          source_url?: string | null
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_chunks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "story_chunks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          email: string
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          email: string
          id?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          email?: string
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          alerts_value: string | null
          biggest_pain: string | null
          brief_value: number | null
          calendar_value: string | null
          contradiction_value: string | null
          created_at: string | null
          current_sources: string[] | null
          entity_alerts_value: number | null
          feed_value: number | null
          hardest_to_track: string[] | null
          id: string
          linkedin_value: string | null
          meeting_prep_value: number | null
          missing: string | null
          price: string | null
          procurement: string | null
          report_value: string | null
          role: string | null
          role_other: string | null
          time_spent: string | null
          tracker_value: number | null
          workspace_value: number | null
        }
        Insert: {
          alerts_value?: string | null
          biggest_pain?: string | null
          brief_value?: number | null
          calendar_value?: string | null
          contradiction_value?: string | null
          created_at?: string | null
          current_sources?: string[] | null
          entity_alerts_value?: number | null
          feed_value?: number | null
          hardest_to_track?: string[] | null
          id?: string
          linkedin_value?: string | null
          meeting_prep_value?: number | null
          missing?: string | null
          price?: string | null
          procurement?: string | null
          report_value?: string | null
          role?: string | null
          role_other?: string | null
          time_spent?: string | null
          tracker_value?: number | null
          workspace_value?: number | null
        }
        Update: {
          alerts_value?: string | null
          biggest_pain?: string | null
          brief_value?: number | null
          calendar_value?: string | null
          contradiction_value?: string | null
          created_at?: string | null
          current_sources?: string[] | null
          entity_alerts_value?: number | null
          feed_value?: number | null
          hardest_to_track?: string[] | null
          id?: string
          linkedin_value?: string | null
          meeting_prep_value?: number | null
          missing?: string | null
          price?: string | null
          procurement?: string | null
          report_value?: string | null
          role?: string | null
          role_other?: string | null
          time_spent?: string | null
          tracker_value?: number | null
          workspace_value?: number | null
        }
        Relationships: []
      }
      survey_responses_v2: {
        Row: {
          biggest_pain: string | null
          contact_directory_value: string | null
          created_at: string | null
          current_sources: string[] | null
          email_provided: string | null
          entity_tracking_open: string | null
          entity_tracking_value: string | null
          existing_tools: string[] | null
          existing_tools_other: string | null
          hardest_to_track: string[] | null
          id: string
          is_priority_lead: boolean | null
          missing_coverage: string | null
          output_format: string | null
          procurement: string | null
          role: string | null
          role_other: string | null
          team_size: string | null
          time_spent: string | null
          val_ai_drafting: number | null
          val_commitment_tracker: number | null
          val_contradiction: number | null
          val_daily_brief: number | null
          val_embed_widget: number | null
          val_entity_alerts: number | null
          val_live_feed: number | null
          val_meeting_prep: number | null
          val_regulatory_tracker: number | null
          val_risk_reports: number | null
          val_workspace: number | null
          wants_early_access: boolean | null
          wants_founding_member: boolean | null
          wants_updates: boolean | null
          willingness_to_pay: string | null
        }
        Insert: {
          biggest_pain?: string | null
          contact_directory_value?: string | null
          created_at?: string | null
          current_sources?: string[] | null
          email_provided?: string | null
          entity_tracking_open?: string | null
          entity_tracking_value?: string | null
          existing_tools?: string[] | null
          existing_tools_other?: string | null
          hardest_to_track?: string[] | null
          id?: string
          is_priority_lead?: boolean | null
          missing_coverage?: string | null
          output_format?: string | null
          procurement?: string | null
          role?: string | null
          role_other?: string | null
          team_size?: string | null
          time_spent?: string | null
          val_ai_drafting?: number | null
          val_commitment_tracker?: number | null
          val_contradiction?: number | null
          val_daily_brief?: number | null
          val_embed_widget?: number | null
          val_entity_alerts?: number | null
          val_live_feed?: number | null
          val_meeting_prep?: number | null
          val_regulatory_tracker?: number | null
          val_risk_reports?: number | null
          val_workspace?: number | null
          wants_early_access?: boolean | null
          wants_founding_member?: boolean | null
          wants_updates?: boolean | null
          willingness_to_pay?: string | null
        }
        Update: {
          biggest_pain?: string | null
          contact_directory_value?: string | null
          created_at?: string | null
          current_sources?: string[] | null
          email_provided?: string | null
          entity_tracking_open?: string | null
          entity_tracking_value?: string | null
          existing_tools?: string[] | null
          existing_tools_other?: string | null
          hardest_to_track?: string[] | null
          id?: string
          is_priority_lead?: boolean | null
          missing_coverage?: string | null
          output_format?: string | null
          procurement?: string | null
          role?: string | null
          role_other?: string | null
          team_size?: string | null
          time_spent?: string | null
          val_ai_drafting?: number | null
          val_commitment_tracker?: number | null
          val_contradiction?: number | null
          val_daily_brief?: number | null
          val_embed_widget?: number | null
          val_entity_alerts?: number | null
          val_live_feed?: number | null
          val_meeting_prep?: number | null
          val_regulatory_tracker?: number | null
          val_risk_reports?: number | null
          val_workspace?: number | null
          wants_early_access?: boolean | null
          wants_founding_member?: boolean | null
          wants_updates?: boolean | null
          willingness_to_pay?: string | null
        }
        Relationships: []
      }
      thread_evidence: {
        Row: {
          added_at: string
          added_by: string
          confidence: string
          evidence_note: string | null
          id: string
          reviewed: boolean
          story_id: string
          thread_id: number
        }
        Insert: {
          added_at?: string
          added_by?: string
          confidence?: string
          evidence_note?: string | null
          id?: string
          reviewed?: boolean
          story_id: string
          thread_id: number
        }
        Update: {
          added_at?: string
          added_by?: string
          confidence?: string
          evidence_note?: string | null
          id?: string
          reviewed?: boolean
          story_id?: string
          thread_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "thread_evidence_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["story_id"]
          },
          {
            foreignKeyName: "thread_evidence_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_evidence_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_status_log: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_status: string
          note: string | null
          previous_status: string | null
          thread_id: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_status: string
          note?: string | null
          previous_status?: string | null
          thread_id: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_status?: string
          note?: string | null
          previous_status?: string | null
          thread_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "thread_status_log_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          audience: string | null
          category: string
          connects_to: string | null
          created_at: string
          horizon: string
          hypothesis: string
          id: number
          resolution_condition: string
          resolved_at: string | null
          status: string
          thread_number: number
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          category: string
          connects_to?: string | null
          created_at?: string
          horizon?: string
          hypothesis: string
          id?: never
          resolution_condition: string
          resolved_at?: string | null
          status?: string
          thread_number: number
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          category?: string
          connects_to?: string | null
          created_at?: string
          horizon?: string
          hypothesis?: string
          id?: never
          resolution_condition?: string
          resolved_at?: string | null
          status?: string
          thread_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracker_events: {
        Row: {
          confidence_flags: string[] | null
          confidence_score: number | null
          created_at: string
          event_date: string
          event_type: string
          id: string
          significance: string | null
          source_name: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          title: string
          tracker_slug: string
        }
        Insert: {
          confidence_flags?: string[] | null
          confidence_score?: number | null
          created_at?: string
          event_date: string
          event_type?: string
          id?: string
          significance?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          tracker_slug: string
        }
        Update: {
          confidence_flags?: string[] | null
          confidence_score?: number | null
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          significance?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          tracker_slug?: string
        }
        Relationships: []
      }
      tracker_page_views: {
        Row: {
          id: string
          tracker_slug: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          tracker_slug: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          tracker_slug?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      tracker_status: {
        Row: {
          id: string
          next_event_date: string | null
          next_event_location: string | null
          next_event_name: string | null
          next_event_source_url: string | null
          stage_description: string | null
          stage_name: string | null
          stage_number: number | null
          stage_source_label: string | null
          stage_source_url: string | null
          stage_verified_at: string | null
          tracker_slug: string
          trajectory: string | null
          trajectory_reason: string | null
          trajectory_source_label: string | null
          trajectory_source_url: string | null
          trajectory_verified_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          next_event_date?: string | null
          next_event_location?: string | null
          next_event_name?: string | null
          next_event_source_url?: string | null
          stage_description?: string | null
          stage_name?: string | null
          stage_number?: number | null
          stage_source_label?: string | null
          stage_source_url?: string | null
          stage_verified_at?: string | null
          tracker_slug: string
          trajectory?: string | null
          trajectory_reason?: string | null
          trajectory_source_label?: string | null
          trajectory_source_url?: string | null
          trajectory_verified_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          next_event_date?: string | null
          next_event_location?: string | null
          next_event_name?: string | null
          next_event_source_url?: string | null
          stage_description?: string | null
          stage_name?: string | null
          stage_number?: number | null
          stage_source_label?: string | null
          stage_source_url?: string | null
          stage_verified_at?: string | null
          tracker_slug?: string
          trajectory?: string | null
          trajectory_reason?: string | null
          trajectory_source_label?: string | null
          trajectory_source_url?: string | null
          trajectory_verified_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      treaty_ratifications: {
        Row: {
          changed_from: string | null
          country_name: string
          id: string
          notes: string | null
          recorded_at: string | null
          status: string
          status_date: string | null
          treaty_name: string
        }
        Insert: {
          changed_from?: string | null
          country_name: string
          id?: string
          notes?: string | null
          recorded_at?: string | null
          status: string
          status_date?: string | null
          treaty_name: string
        }
        Update: {
          changed_from?: string | null
          country_name?: string
          id?: string
          notes?: string | null
          recorded_at?: string | null
          status?: string
          status_date?: string | null
          treaty_name?: string
        }
        Relationships: []
      }
      trial_signups: {
        Row: {
          email: string
          id: string
          signed_up_at: string | null
          status: string | null
          topics: string[] | null
        }
        Insert: {
          email: string
          id?: string
          signed_up_at?: string | null
          status?: string | null
          topics?: string[] | null
        }
        Update: {
          email?: string
          id?: string
          signed_up_at?: string | null
          status?: string | null
          topics?: string[] | null
        }
        Relationships: []
      }
      user_alert_preferences: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          tracker_slug: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          tracker_slug: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          tracker_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alert_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alert_subscriptions: {
        Row: {
          created_at: string
          id: string
          tracker_slug: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          tracker_slug: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          tracker_slug?: string
          user_email?: string
        }
        Relationships: []
      }
      user_entities: {
        Row: {
          added_at: string | null
          alert_config: Json | null
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          alert_config?: Json | null
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          alert_config?: Json | null
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "lp_briefing"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "user_entities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          brief_time: string | null
          contributor_tier: string | null
          created_at: string | null
          day5_modal_shown: boolean
          documents_contributed: number | null
          email: string
          expiry_email_sent: boolean
          first_login_completed: boolean
          first_name: string | null
          has_dismissed_day5_modal: boolean
          id: string
          is_admin: boolean | null
          job_type: string | null
          last_brief_sent: string | null
          last_dashboard_view: string | null
          last_seen_at: string | null
          onboarded_at: string | null
          onboarding_completed: boolean | null
          role: string | null
          sector: string | null
          show_name_on_contributions: boolean | null
          streak_days: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tier: string | null
          timezone: string | null
          topics: Json | null
          trial_ends_at: string | null
          unsubscribe_token: string | null
          welcome_seen_at: string | null
        }
        Insert: {
          brief_time?: string | null
          contributor_tier?: string | null
          created_at?: string | null
          day5_modal_shown?: boolean
          documents_contributed?: number | null
          email: string
          expiry_email_sent?: boolean
          first_login_completed?: boolean
          first_name?: string | null
          has_dismissed_day5_modal?: boolean
          id?: string
          is_admin?: boolean | null
          job_type?: string | null
          last_brief_sent?: string | null
          last_dashboard_view?: string | null
          last_seen_at?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          sector?: string | null
          show_name_on_contributions?: boolean | null
          streak_days?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tier?: string | null
          timezone?: string | null
          topics?: Json | null
          trial_ends_at?: string | null
          unsubscribe_token?: string | null
          welcome_seen_at?: string | null
        }
        Update: {
          brief_time?: string | null
          contributor_tier?: string | null
          created_at?: string | null
          day5_modal_shown?: boolean
          documents_contributed?: number | null
          email?: string
          expiry_email_sent?: boolean
          first_login_completed?: boolean
          first_name?: string | null
          has_dismissed_day5_modal?: boolean
          id?: string
          is_admin?: boolean | null
          job_type?: string | null
          last_brief_sent?: string | null
          last_dashboard_view?: string | null
          last_seen_at?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          sector?: string | null
          show_name_on_contributions?: boolean | null
          streak_days?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tier?: string | null
          timezone?: string | null
          topics?: Json | null
          trial_ends_at?: string | null
          unsubscribe_token?: string | null
          welcome_seen_at?: string | null
        }
        Relationships: []
      }
      velocity_scores: {
        Row: {
          calculated_at: string | null
          id: string
          interpretation: string | null
          momentum_direction: string | null
          previous_score: number | null
          score: number
          score_recency: number | null
          score_signals: number | null
          score_volume: number | null
          story_count_30d: number | null
          tracker_slug: string
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          interpretation?: string | null
          momentum_direction?: string | null
          previous_score?: number | null
          score: number
          score_recency?: number | null
          score_signals?: number | null
          score_volume?: number | null
          story_count_30d?: number | null
          tracker_slug: string
        }
        Update: {
          calculated_at?: string | null
          id?: string
          interpretation?: string | null
          momentum_direction?: string | null
          previous_score?: number | null
          score?: number
          score_recency?: number | null
          score_signals?: number | null
          score_volume?: number | null
          story_count_30d?: number | null
          tracker_slug?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lp_briefing: {
        Row: {
          alert_type: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          fund_name: string | null
          mention_context: string | null
          mentioned_at: string | null
          published_at: string | null
          relationship: string | null
          short_summary: string | null
          source_name: string | null
          story_description: string | null
          story_id: string | null
          story_link: string | null
          story_title: string | null
          topic: string | null
          total_mentions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_entity_count: {
        Args: { entity_id: string }
        Returns: undefined
      }
      match_document_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          similarity: number
        }[]
      }
      match_documents: {
        Args: { match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          similarity: number
          story_id: string
        }[]
      }
      match_entities_by_alias: {
        Args: {
          match_limit?: number
          match_threshold?: number
          search_text: string
        }
        Returns: {
          entity_type: string
          id: string
          name: string
          similarity: number
        }[]
      }
      match_entities_by_name: {
        Args: {
          match_limit?: number
          match_threshold?: number
          search_text: string
        }
        Returns: {
          entity_type: string
          id: string
          name: string
          similarity: number
        }[]
      }
      match_entities_in_text: {
        Args: { story_summary?: string; story_title: string }
        Returns: {
          entity_id: string
          entity_name: string
          entity_type: string
          matched_on: string
        }[]
      }
      match_entity_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          entity_type: string
          id: string
          name: string
          similarity: number
        }[]
      }
      match_library_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          document_type: string
          file_url: string
          published_date: string
          similarity: number
          source_organisation: string
          title: string
        }[]
      }
      match_primary_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          similarity: number
        }[]
      }
      match_story_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          date_issued: string
          document_type: string
          issuing_body: string
          similarity: number
          source_url: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      touch_project_viewed: { Args: { p_project_id: string }; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
