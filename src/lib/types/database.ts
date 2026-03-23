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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      works: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          cover_asset_id: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          category_id?: string | null;
          cover_asset_id?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          cover_asset_id?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_tags: {
        Row: {
          work_id: string;
          tag_id: string;
        };
        Insert: {
          work_id: string;
          tag_id: string;
        };
        Update: {
          work_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          owner_id: string;
          work_id: string;
          kind: string;
          bucket: string;
          path: string;
          mime_type: string | null;
          bytes: number | null;
          width: number | null;
          height: number | null;
          sha256: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          work_id: string;
          kind: string;
          bucket: string;
          path: string;
          mime_type?: string | null;
          bytes?: number | null;
          width?: number | null;
          height?: number | null;
          sha256?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          work_id?: string;
          kind?: string;
          bucket?: string;
          path?: string;
          mime_type?: string | null;
          bytes?: number | null;
          width?: number | null;
          height?: number | null;
          sha256?: string | null;
          created_at?: string;
        };
        Relationships: [];
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Work = Tables<"works"> & {
  category?: Tables<"categories"> | null;
  tags?: Tables<"tags">[];
  assets?: Tables<"assets">[];
  cover_url?: string | null;
};

export type Asset = Tables<"assets">;
export type Category = Tables<"categories">;
export type Tag = Tables<"tags">;
