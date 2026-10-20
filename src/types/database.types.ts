export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          is_active: boolean;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointment_events: {
        Row: {
          actor_admin_id: string | null;
          appointment_id: string;
          created_at: string;
          event_type: string;
          id: string;
          metadata: NonNullable<Json>;
          new_status: Database["public"]["Enums"]["appointment_status"] | null;
          previous_status: Database["public"]["Enums"]["appointment_status"] | null;
        };
        ComputedFields: never;
        Insert: {
          actor_admin_id?: string | null;
          appointment_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: NonNullable<Json>;
          new_status?: Database["public"]["Enums"]["appointment_status"] | null;
          previous_status?: Database["public"]["Enums"]["appointment_status"] | null;
        };
        Update: {
          actor_admin_id?: string | null;
          appointment_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          new_status?: Database["public"]["Enums"]["appointment_status"] | null;
          previous_status?: Database["public"]["Enums"]["appointment_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_events_actor_admin_id_fkey";
            columns: ["actor_admin_id"];
            isOneToOne: false;
            referencedRelation: "admin_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_events_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_services: {
        Row: {
          appointment_id: string;
          buffer_after_minutes_snapshot: number;
          buffer_before_minutes_snapshot: number;
          created_at: string;
          duration_minutes_snapshot: number;
          id: string;
          position: number;
          service_id: string;
          service_name_snapshot: string;
        };
        ComputedFields: never;
        Insert: {
          appointment_id: string;
          buffer_after_minutes_snapshot?: number;
          buffer_before_minutes_snapshot?: number;
          created_at?: string;
          duration_minutes_snapshot: number;
          id?: string;
          position?: number;
          service_id: string;
          service_name_snapshot: string;
        };
        Update: {
          appointment_id?: string;
          buffer_after_minutes_snapshot?: number;
          buffer_before_minutes_snapshot?: number;
          created_at?: string;
          duration_minutes_snapshot?: number;
          id?: string;
          position?: number;
          service_id?: string;
          service_name_snapshot?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_verifications: {
        Row: {
          appointment_id: string;
          attempts: number;
          channel: Database["public"]["Enums"]["contact_method"];
          contact_value_hash: string;
          created_at: string;
          expires_at: string;
          id: string;
          is_consumed: boolean;
          max_attempts: number;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          appointment_id: string;
          attempts?: number;
          channel: Database["public"]["Enums"]["contact_method"];
          contact_value_hash: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          is_consumed?: boolean;
          max_attempts?: number;
          token_hash: string;
        };
        Update: {
          appointment_id?: string;
          attempts?: number;
          channel?: Database["public"]["Enums"]["contact_method"];
          contact_value_hash?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_consumed?: boolean;
          max_attempts?: number;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_verifications_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          appointment_end: string;
          appointment_start: string;
          blocked_end: string;
          blocked_start: string;
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          local_date: string | null;
          message: string | null;
          normalized_phone: string;
          phone_number: string;
          preferred_contact_method: Database["public"]["Enums"]["contact_method"] | null;
          private_admin_notes: string | null;
          public_reference: string;
          reserves_capacity: boolean | null;
          status: Database["public"]["Enums"]["appointment_status"];
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          appointment_end: string;
          appointment_start: string;
          blocked_end: string;
          blocked_start: string;
          created_at?: string;
          customer_name: string;
          email?: string | null;
          id?: string;
          local_date?: never;
          message?: string | null;
          normalized_phone: string;
          phone_number: string;
          preferred_contact_method?: Database["public"]["Enums"]["contact_method"] | null;
          private_admin_notes?: string | null;
          public_reference?: string;
          reserves_capacity?: never;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone: string;
          updated_at?: string;
        };
        Update: {
          appointment_end?: string;
          appointment_start?: string;
          blocked_end?: string;
          blocked_start?: string;
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          local_date?: never;
          message?: string | null;
          normalized_phone?: string;
          phone_number?: string;
          preferred_contact_method?: Database["public"]["Enums"]["contact_method"] | null;
          private_admin_notes?: string | null;
          public_reference?: string;
          reserves_capacity?: never;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_idempotency_keys: {
        Row: {
          appointment_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          idempotency_key: string;
          request_hash: string;
          response_payload: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          appointment_id: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          idempotency_key: string;
          request_hash: string;
          response_payload: NonNullable<Json>;
        };
        Update: {
          appointment_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          idempotency_key?: string;
          request_hash?: string;
          response_payload?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "booking_idempotency_keys_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      date_override_intervals: {
        Row: {
          created_at: string;
          date_override_id: string;
          end_time: string;
          id: string;
          start_time: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date_override_id: string;
          end_time: string;
          id?: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_override_id?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "date_override_intervals_date_override_id_fkey";
            columns: ["date_override_id"];
            isOneToOne: false;
            referencedRelation: "date_overrides";
            referencedColumns: ["id"];
          },
        ];
      };
      date_overrides: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_closed: boolean;
          override_date: string;
          reason: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_closed?: boolean;
          override_date: string;
          reason?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_closed?: boolean;
          override_date?: string;
          reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "date_overrides_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admin_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_logs: {
        Row: {
          appointment_id: string;
          attempt_count: number;
          channel: string;
          created_at: string;
          id: string;
          idempotency_key: string | null;
          last_error_code: string | null;
          last_error_message: string | null;
          provider_message_id: string | null;
          recipient: string;
          sent_at: string | null;
          status: string;
          template: string;
        };
        ComputedFields: never;
        Insert: {
          appointment_id: string;
          attempt_count?: number;
          channel: string;
          created_at?: string;
          id?: string;
          idempotency_key?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          provider_message_id?: string | null;
          recipient: string;
          sent_at?: string | null;
          status: string;
          template: string;
        };
        Update: {
          appointment_id?: string;
          attempt_count?: number;
          channel?: string;
          created_at?: string;
          id?: string;
          idempotency_key?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          provider_message_id?: string | null;
          recipient?: string;
          sent_at?: string | null;
          status?: string;
          template?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          buffer_after_minutes: number;
          buffer_before_minutes: number;
          created_at: string;
          description: string | null;
          display_order: number;
          duration_minutes: number;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          short_description: string | null;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          duration_minutes: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          short_description?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          duration_minutes?: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          short_description?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          booking_horizon_days: number;
          consultation_hours_text: string | null;
          created_at: string;
          id: boolean;
          min_advance_notice_minutes: number;
          public_address: string | null;
          public_email: string | null;
          public_phone: string | null;
          public_whatsapp: string | null;
          slot_interval_minutes: number;
          updated_at: string;
          whatsapp_message_template: string | null;
        };
        ComputedFields: never;
        Insert: {
          booking_horizon_days?: number;
          consultation_hours_text?: string | null;
          created_at?: string;
          id?: boolean;
          min_advance_notice_minutes?: number;
          public_address?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          public_whatsapp?: string | null;
          slot_interval_minutes?: number;
          updated_at?: string;
          whatsapp_message_template?: string | null;
        };
        Update: {
          booking_horizon_days?: number;
          consultation_hours_text?: string | null;
          created_at?: string;
          id?: boolean;
          min_advance_notice_minutes?: number;
          public_address?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          public_whatsapp?: string | null;
          slot_interval_minutes?: number;
          updated_at?: string;
          whatsapp_message_template?: string | null;
        };
        Relationships: [];
      };
      weekly_availability: {
        Row: {
          created_at: string;
          is_closed: boolean;
          updated_at: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          is_closed?: boolean;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          is_closed?: boolean;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [];
      };
      weekly_availability_intervals: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          updated_at: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_availability_intervals_weekday_fkey";
            columns: ["weekday"];
            isOneToOne: false;
            referencedRelation: "weekly_availability";
            referencedColumns: ["weekday"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      appointment_status:
        "pending" | "confirmed" | "reschedule_requested" | "declined" | "cancelled";
      contact_method: "phone" | "whatsapp" | "email";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["pending", "confirmed", "reschedule_requested", "declined", "cancelled"],
      contact_method: ["phone", "whatsapp", "email"],
    },
  },
} as const;
