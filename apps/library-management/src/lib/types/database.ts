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
          followed_at: string
          id: string
          notification_preferences: Json
          user_id: string
        }
        Insert: {
          author_id: string
          followed_at?: string
          id?: string
          notification_preferences?: Json
          user_id: string
        }
        Update: {
          author_id?: string
          followed_at?: string
          id?: string
          notification_preferences?: Json
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
          created_at: string
          id: string
          metadata: Json
          name: string
          social_stats: Json
          updated_at: string
        }
        Insert: {
          biography?: string | null
          canonical_name: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          social_stats?: Json
          updated_at?: string
        }
        Update: {
          biography?: string | null
          canonical_name?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          social_stats?: Json
          updated_at?: string
        }
        Relationships: []
      }
      book_contributors: {
        Row: {
          author_id: string
          book_edition_id: string | null
          created_at: string
          credit_text: string | null
          general_book_id: string
          id: string
          role: string
          sort_order: number
        }
        Insert: {
          author_id: string
          book_edition_id?: string | null
          created_at?: string
          credit_text?: string | null
          general_book_id: string
          id?: string
          role?: string
          sort_order?: number
        }
        Update: {
          author_id?: string
          book_edition_id?: string | null
          created_at?: string
          credit_text?: string | null
          general_book_id?: string
          id?: string
          role?: string
          sort_order?: number
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
            referencedRelation: "book_editions"
            referencedColumns: ["id"]
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
      book_editions: {
        Row: {
          country: string | null
          created_at: string
          edition_metadata: Json
          general_book_id: string
          id: string
          isbn_10: string | null
          isbn_13: string | null
          language: string
          social_stats: Json
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          edition_metadata?: Json
          general_book_id: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          language?: string
          social_stats?: Json
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          edition_metadata?: Json
          general_book_id?: string
          id?: string
          isbn_10?: string | null
          isbn_13?: string | null
          language?: string
          social_stats?: Json
          subtitle?: string | null
          title?: string
          updated_at?: string
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
      general_books: {
        Row: {
          canonical_title: string
          created_at: string
          first_publication_year: number | null
          global_stats: Json
          id: string
          subjects: string[]
          updated_at: string
        }
        Insert: {
          canonical_title: string
          created_at?: string
          first_publication_year?: number | null
          global_stats?: Json
          id?: string
          subjects?: string[]
          updated_at?: string
        }
        Update: {
          canonical_title?: string
          created_at?: string
          first_publication_year?: number | null
          global_stats?: Json
          id?: string
          subjects?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_edition_id: string
          content: string
          created_at: string
          general_book_id: string
          id: string
          language: string
          rating: number
          reviewer_id: string
          social_metrics: Json
          updated_at: string
          visibility: string
        }
        Insert: {
          book_edition_id: string
          content: string
          created_at?: string
          general_book_id: string
          id?: string
          language?: string
          rating: number
          reviewer_id: string
          social_metrics?: Json
          updated_at?: string
          visibility?: string
        }
        Update: {
          book_edition_id?: string
          content?: string
          created_at?: string
          general_book_id?: string
          id?: string
          language?: string
          rating?: number
          reviewer_id?: string
          social_metrics?: Json
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_edition_id_fkey"
            columns: ["book_edition_id"]
            isOneToOne: false
            referencedRelation: "book_editions"
            referencedColumns: ["id"]
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
          followed_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          followed_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          followed_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_user_content: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_books_needing_enrichment: {
        Args: { limit_count?: number }
        Returns: {
          edition_id: string
          enrichment_status: string
          general_book_id: string
          isbn_13: string
          last_enriched_at: string
          title: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_account: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      isbn_10_to_13: {
        Args: { isbn_10: string }
        Returns: string
      }
      normalize_author_name: {
        Args: { input_name: string }
        Returns: string
      }
      test_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          actual_result: number
          expected_result: string
          status: string
          table_name: string
          test_name: string
        }[]
      }
      update_enrichment_status: {
        Args: {
          edition_id: string
          enrichment_source?: string
          new_status: string
          quality_score?: number
        }
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

