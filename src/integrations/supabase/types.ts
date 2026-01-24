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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      game_rooms: {
        Row: {
          board: Json
          created_at: string
          current_player: number
          guest_id: string | null
          host_id: string
          id: string
          is_draw: boolean
          last_move: Json | null
          room_code: string
          scores: Json
          status: string
          updated_at: string
          winner: number | null
          winning_cells: Json | null
        }
        Insert: {
          board?: Json
          created_at?: string
          current_player?: number
          guest_id?: string | null
          host_id: string
          id?: string
          is_draw?: boolean
          last_move?: Json | null
          room_code: string
          scores?: Json
          status?: string
          updated_at?: string
          winner?: number | null
          winning_cells?: Json | null
        }
        Update: {
          board?: Json
          created_at?: string
          current_player?: number
          guest_id?: string | null
          host_id?: string
          id?: string
          is_draw?: boolean
          last_move?: Json | null
          room_code?: string
          scores?: Json
          status?: string
          updated_at?: string
          winner?: number | null
          winning_cells?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_game_room: {
        Args: { p_room_code: string }
        Returns: {
          board: Json
          created_at: string
          current_player: number
          guest_id: string | null
          host_id: string
          id: string
          is_draw: boolean
          last_move: Json | null
          room_code: string
          scores: Json
          status: string
          updated_at: string
          winner: number | null
          winning_cells: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "game_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      make_move: {
        Args: { p_column: number; p_room_id: string }
        Returns: {
          board: Json
          created_at: string
          current_player: number
          guest_id: string | null
          host_id: string
          id: string
          is_draw: boolean
          last_move: Json | null
          room_code: string
          scores: Json
          status: string
          updated_at: string
          winner: number | null
          winning_cells: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "game_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_game: {
        Args: { p_room_id: string }
        Returns: {
          board: Json
          created_at: string
          current_player: number
          guest_id: string | null
          host_id: string
          id: string
          is_draw: boolean
          last_move: Json | null
          room_code: string
          scores: Json
          status: string
          updated_at: string
          winner: number | null
          winning_cells: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "game_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_scores: {
        Args: { p_room_id: string }
        Returns: {
          board: Json
          created_at: string
          current_player: number
          guest_id: string | null
          host_id: string
          id: string
          is_draw: boolean
          last_move: Json | null
          room_code: string
          scores: Json
          status: string
          updated_at: string
          winner: number | null
          winning_cells: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "game_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
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
  public: {
    Enums: {},
  },
} as const
