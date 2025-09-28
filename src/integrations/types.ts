export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          servings: number;
          instructions: string | null;
          prep_time: number | null;
          cook_time: number | null;
          category: string | null;
          cost_per_serving: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          servings: number;
          instructions?: string | null;
          prep_time?: number | null;
          cook_time?: number | null;
          category?: string | null;
          cost_per_serving?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          servings?: number;
          instructions?: string | null;
          prep_time?: number | null;
          cook_time?: number | null;
          category?: string | null;
          cost_per_serving?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          unit: string;
          cost_per_unit: number;
          category: string | null;
          storage_location: string | null;
          minimum_stock: number | null;
          current_stock: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          cost_per_unit: number;
          category?: string | null;
          storage_location?: string | null;
          minimum_stock?: number | null;
          current_stock?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: string;
          cost_per_unit?: number;
          category?: string | null;
          storage_location?: string | null;
          minimum_stock?: number | null;
          current_stock?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient_id?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          event_date: string;
          guest_count: number;
          event_type: string | null;
          status: string;
          venue: string | null;
          contact_person: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          total_cost: number | null;
          profit_margin: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          event_date: string;
          guest_count: number;
          event_type?: string | null;
          status?: string;
          venue?: string | null;
          contact_person?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          total_cost?: number | null;
          profit_margin?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          event_date?: string;
          guest_count?: number;
          event_type?: string | null;
          status?: string;
          venue?: string | null;
          contact_person?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          total_cost?: number | null;
          profit_margin?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      menus: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          menu_type: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          menu_type?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          menu_type?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      menu_recipes: {
        Row: {
          id: string;
          menu_id: string;
          recipe_id: string;
          servings_multiplier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          recipe_id: string;
          servings_multiplier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          recipe_id?: string;
          servings_multiplier?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
