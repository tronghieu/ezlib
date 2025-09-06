export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      author_follows: {
        Row: {
          author_id: string
          followed_at: string | null
          id: string
          notification_preferences: Json | null
          user_id: string
        }
        Insert: {
          author_id: string
          followed_at?: string | null
          id?: string
          notification_preferences?: Json | null
          user_id: string
        }
        Update: {
          author_id?: string
          followed_at?: string | null
          id?: string
          notification_preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_follows_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          biography: string | null
          canonical_name: string
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          social_stats: Json | null
          updated_at: string | null
        }
        Insert: {
          biography?: string | null
          canonical_name: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          social_stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          biography?: string | null
          canonical_name?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          social_stats?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      book_contributors: {
        Row: {
          author_id: string
          book_edition_id: string | null
          created_at: string | null
          credit_text: string | null
          general_book_id: string
          id: string
          role: string
          sort_order: number | null
        }
        Insert: {
          author_id: string
          book_edition_id?: string | null
          created_at?: string | null
          credit_text?: string | null
          general_book_id: string
          id?: string
          role: string
          sort_order?: number | null
        }
        Update: {
          author_id?: string
          book_edition_id?: string | null
          created_at?: string | null
          credit_text?: string | null
          general_book_id?: string
          id?: string
          role?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_contributors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_contributors_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_display_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "book_contributors_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_contributors_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_search_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "book_contributors_general_book_id_fkey"
            columns: ["general_book_id"]
            isOneToOne: false
            referencedRelation: "general_books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_copies: {
        Row: {
          availability: Json
          available_copies: number
          barcode: string | null
          book_edition_id: string
          condition_info: Json
          copy_number: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          library_id: string
          location: Json
          status: string
          total_copies: number
          updated_at: string | null
        }
        Insert: {
          availability?: Json
          available_copies?: number
          barcode?: string | null
          book_edition_id: string
          condition_info?: Json
          copy_number: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          library_id: string
          location?: Json
          status?: string
          total_copies?: number
          updated_at?: string | null
        }
        Update: {
          availability?: Json
          available_copies?: number
          barcode?: string | null
          book_edition_id?: string
          condition_info?: Json
          copy_number?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          library_id?: string
          location?: Json
          status?: string
          total_copies?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_copies_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_display_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "book_copies_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_copies_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_search_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "book_copies_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_book_copies_deleted_by"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      book_editions: {
        Row: {
          country: string | null
          created_at: string | null
          edition_metadata: Json | null
          general_book_id: string
          id: string
          isbn_13: string | null
          language: string
          social_stats: Json | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          edition_metadata?: Json | null
          general_book_id: string
          id?: string
          isbn_13?: string | null
          language: string
          social_stats?: Json | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          edition_metadata?: Json | null
          general_book_id?: string
          id?: string
          isbn_13?: string | null
          language?: string
          social_stats?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_editions_general_book_id_fkey"
            columns: ["general_book_id"]
            isOneToOne: false
            referencedRelation: "general_books"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowing_transactions: {
        Row: {
          book_copy_id: string
          created_at: string | null
          due_date: string | null
          fees: Json
          id: string
          library_id: string
          member_id: string
          notes: string | null
          return_date: string | null
          staff_id: string | null
          status: string
          transaction_date: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          book_copy_id: string
          created_at?: string | null
          due_date?: string | null
          fees?: Json
          id?: string
          library_id: string
          member_id: string
          notes?: string | null
          return_date?: string | null
          staff_id?: string | null
          status?: string
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Update: {
          book_copy_id?: string
          created_at?: string | null
          due_date?: string | null
          fees?: Json
          id?: string
          library_id?: string
          member_id?: string
          notes?: string | null
          return_date?: string | null
          staff_id?: string | null
          status?: string
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowing_transactions_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_transactions_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_display_view"
            referencedColumns: ["book_copy_id"]
          },
          {
            foreignKeyName: "borrowing_transactions_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_search_view"
            referencedColumns: ["book_copy_id"]
          },
          {
            foreignKeyName: "borrowing_transactions_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "library_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_books: {
        Row: {
          added_at: string | null
          book_copy_id: string
          collection_id: string
          id: string
        }
        Insert: {
          added_at?: string | null
          book_copy_id: string
          collection_id: string
          id?: string
        }
        Update: {
          added_at?: string | null
          book_copy_id?: string
          collection_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_books_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_books_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_display_view"
            referencedColumns: ["book_copy_id"]
          },
          {
            foreignKeyName: "collection_books_book_copy_id_fkey"
            columns: ["book_copy_id"]
            isOneToOne: false
            referencedRelation: "book_search_view"
            referencedColumns: ["book_copy_id"]
          },
          {
            foreignKeyName: "collection_books_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          library_id: string
          name: string
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          library_id: string
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          library_id?: string
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      general_books: {
        Row: {
          canonical_title: string
          created_at: string | null
          first_publication_year: number | null
          global_stats: Json | null
          id: string
          subjects: string[] | null
          updated_at: string | null
        }
        Insert: {
          canonical_title: string
          created_at?: string | null
          first_publication_year?: number | null
          global_stats?: Json | null
          id?: string
          subjects?: string[] | null
          updated_at?: string | null
        }
        Update: {
          canonical_title?: string
          created_at?: string | null
          first_publication_year?: number | null
          global_stats?: Json | null
          id?: string
          subjects?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_responses: {
        Row: {
          created_library_member_id: string | null
          created_library_staff_id: string | null
          id: string
          invitation_id: string
          ip_address: unknown | null
          notes: string | null
          responder_user_id: string | null
          response_date: string | null
          response_type: string
          user_agent: string | null
        }
        Insert: {
          created_library_member_id?: string | null
          created_library_staff_id?: string | null
          id?: string
          invitation_id: string
          ip_address?: unknown | null
          notes?: string | null
          responder_user_id?: string | null
          response_date?: string | null
          response_type: string
          user_agent?: string | null
        }
        Update: {
          created_library_member_id?: string | null
          created_library_staff_id?: string | null
          id?: string
          invitation_id?: string
          ip_address?: unknown | null
          notes?: string | null
          responder_user_id?: string | null
          response_date?: string | null
          response_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_responses_created_library_member_id_fkey"
            columns: ["created_library_member_id"]
            isOneToOne: false
            referencedRelation: "library_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_responses_created_library_staff_id_fkey"
            columns: ["created_library_staff_id"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_type: string
          inviter_id: string
          library_id: string
          metadata: Json | null
          permissions: Json | null
          personal_message: string | null
          role: string
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_type: string
          inviter_id: string
          library_id: string
          metadata?: Json | null
          permissions?: Json | null
          personal_message?: string | null
          role: string
          status?: string
          token?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_type?: string
          inviter_id?: string
          library_id?: string
          metadata?: Json | null
          permissions?: Json | null
          personal_message?: string | null
          role?: string
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      libraries: {
        Row: {
          address: Json
          code: string
          contact_info: Json
          created_at: string | null
          id: string
          name: string
          settings: Json
          stats: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: Json
          code: string
          contact_info?: Json
          created_at?: string | null
          id?: string
          name: string
          settings?: Json
          stats?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: Json
          code?: string
          contact_info?: Json
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json
          stats?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      library_members: {
        Row: {
          borrowing_stats: Json
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          library_id: string
          member_id: string
          membership_info: Json
          personal_info: Json
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          borrowing_stats?: Json
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          library_id: string
          member_id: string
          membership_info?: Json
          personal_info?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          borrowing_stats?: Json
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          library_id?: string
          member_id?: string
          membership_info?: Json
          personal_info?: Json
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_library_members_deleted_by"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_members_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      library_staff: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          employment_info: Json
          id: string
          is_deleted: boolean
          library_id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employment_info?: Json
          id?: string
          is_deleted?: boolean
          library_id: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employment_info?: Json
          id?: string
          is_deleted?: boolean
          library_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_library_staff_deleted_by"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_staff_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          book_edition_id: string
          content: string
          created_at: string | null
          general_book_id: string
          id: string
          language: string
          rating: number
          reviewer_id: string
          social_metrics: Json | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          book_edition_id: string
          content: string
          created_at?: string | null
          general_book_id: string
          id?: string
          language?: string
          rating: number
          reviewer_id: string
          social_metrics?: Json | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          book_edition_id?: string
          content?: string
          created_at?: string | null
          general_book_id?: string
          id?: string
          language?: string
          rating?: number
          reviewer_id?: string
          social_metrics?: Json | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_display_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "reviews_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_search_view"
            referencedColumns: ["book_edition_id"]
          },
          {
            foreignKeyName: "reviews_general_book_id_fkey"
            columns: ["general_book_id"]
            isOneToOne: false
            referencedRelation: "general_books"
            referencedColumns: ["id"]
          },
        ]
      }
      social_follows: {
        Row: {
          followed_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          followed_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          followed_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      transaction_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          member_id: string | null
          notes: string | null
          staff_id: string | null
          timestamp: string | null
          transaction_id: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          member_id?: string | null
          notes?: string | null
          staff_id?: string | null
          timestamp?: string | null
          transaction_id: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          staff_id?: string | null
          timestamp?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "library_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_events_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "library_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "borrowing_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          interface: Json
          notifications: Json
          privacy: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          interface?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interface?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          location: Json | null
          reading_stats: Json | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          location?: Json | null
          reading_stats?: Json | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          location?: Json | null
          reading_stats?: Json | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      book_display_view: {
        Row: {
          authors_display: string | null
          availability_status: string | null
          available_copies: number | null
          book_copy_id: string | null
          book_edition_id: string | null
          copy_created_at: string | null
          copy_number: string | null
          copy_status: string | null
          copy_updated_at: string | null
          country: string | null
          edition_metadata: Json | null
          isbn_13: string | null
          language: string | null
          library_id: string | null
          social_stats: Json | null
          subtitle: string | null
          title: string | null
          total_copies: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_copies_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      book_search_view: {
        Row: {
          authors_display: string | null
          authors_search: string | null
          availability_status: string | null
          available_copies: number | null
          book_copy_id: string | null
          book_edition_id: string | null
          copy_created_at: string | null
          copy_number: string | null
          copy_status: string | null
          copy_updated_at: string | null
          country: string | null
          edition_metadata: Json | null
          isbn_13: string | null
          isbn_search: string | null
          language: string | null
          library_id: string | null
          search_vector: unknown | null
          social_stats: Json | null
          subtitle: string | null
          title: string | null
          title_search: string | null
          total_copies: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_copies_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      library_book_summary_view: {
        Row: {
          available_titles: number | null
          fully_borrowed_titles: number | null
          library_id: string | null
          recent_additions: number | null
          total_available_copies: number | null
          total_book_copies: number | null
          total_borrowed_copies: number | null
          total_physical_copies: number | null
          unique_titles: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_copies_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decline_invitation: {
        Args: {
          declining_user_id?: string
          invitation_token: string
          response_notes?: string
        }
        Returns: boolean
      }
      get_book_authors: {
        Args: { book_edition_id_param: string }
        Returns: string
      }
      get_user_library_ids: {
        Args: { target_user_id?: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { library_id_param: string; target_user_id?: string }
        Returns: string
      }
      process_invitation_acceptance: {
        Args: {
          accepting_user_id: string
          invitation_token: string
          response_notes?: string
        }
        Returns: Json
      }
      restore_soft_deleted: {
        Args: { library_id: string; record_id: string; table_name: string }
        Returns: boolean
      }
      search_books_by_library: {
        Args: {
          library_id_param: string
          limit_param?: number
          search_term: string
        }
        Returns: {
          book_copy_id: string
          relevance_score: number
        }[]
      }
      user_has_catalog_access: {
        Args: { target_user_id?: string }
        Returns: boolean
      }
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

