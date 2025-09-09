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
    PostgrestVersion: "13.0.4"
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
          bio: string | null
          bio_ja: string | null
          created_at: string
          email: string
          full_name_en: string | null
          full_name_ja: string | null
          id: string
          password_hash: string
          profile_picture_id: string | null
          role: string
          tea_school: string | null
          tea_school_id: string | null
          tea_school_ja: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          bio_ja?: string | null
          created_at?: string
          email: string
          full_name_en?: string | null
          full_name_ja?: string | null
          id?: string
          password_hash: string
          profile_picture_id?: string | null
          role: string
          tea_school?: string | null
          tea_school_id?: string | null
          tea_school_ja?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          bio_ja?: string | null
          created_at?: string
          email?: string
          full_name_en?: string | null
          full_name_ja?: string | null
          id?: string
          password_hash?: string
          profile_picture_id?: string | null
          role?: string
          tea_school?: string | null
          tea_school_id?: string | null
          tea_school_ja?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_profile_picture_id_fkey"
            columns: ["profile_picture_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_tea_school_id_fkey"
            columns: ["tea_school_id"]
            isOneToOne: false
            referencedRelation: "tea_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      chakai: {
        Row: {
          created_at: string
          event_date: string
          id: string
          local_number: string
          location_id: string | null
          name_en: string | null
          name_ja: string | null
          notes: string | null
          start_time: string | null
          token: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          local_number: string
          location_id?: string | null
          name_en?: string | null
          name_ja?: string | null
          notes?: string | null
          start_time?: string | null
          token?: string | null
          updated_at?: string
          visibility: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          local_number?: string
          location_id?: string | null
          name_en?: string | null
          name_ja?: string | null
          notes?: string | null
          start_time?: string | null
          token?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "chakai_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      chakai_attendees: {
        Row: {
          account_id: string
          chakai_id: string
          created_at: string
        }
        Insert: {
          account_id: string
          chakai_id: string
          created_at?: string
        }
        Update: {
          account_id?: string
          chakai_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chakai_attendees_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chakai_attendees_chakai_id_fkey"
            columns: ["chakai_id"]
            isOneToOne: false
            referencedRelation: "chakai"
            referencedColumns: ["id"]
          },
        ]
      }
      chakai_items: {
        Row: {
          chakai_id: string
          created_at: string
          object_id: string
          role: string | null
        }
        Insert: {
          chakai_id: string
          created_at?: string
          object_id: string
          role?: string | null
        }
        Update: {
          chakai_id?: string
          created_at?: string
          object_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chakai_items_chakai_id_fkey"
            columns: ["chakai_id"]
            isOneToOne: false
            referencedRelation: "chakai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chakai_items_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "chakai_items_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      chakai_media_links: {
        Row: {
          chakai_id: string
          created_at: string
          media_id: string
          role: string | null
        }
        Insert: {
          chakai_id: string
          created_at?: string
          media_id: string
          role?: string | null
        }
        Update: {
          chakai_id?: string
          created_at?: string
          media_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chakai_media_links_chakai_id_fkey"
            columns: ["chakai_id"]
            isOneToOne: false
            referencedRelation: "chakai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chakai_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      classifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string
          label_ja: string | null
          scheme: string
          uri: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label: string
          label_ja?: string | null
          scheme: string
          uri: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string
          label_ja?: string | null
          scheme?: string
          uri?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          code: string
          id: string
          name: string
          summary: string | null
          uri: string
        }
        Insert: {
          code: string
          id?: string
          name: string
          summary?: string | null
          uri: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
          summary?: string | null
          uri?: string
        }
        Relationships: []
      }
      local_class_hierarchy: {
        Row: {
          ancestor_id: string
          depth: number
          descendant_id: string
        }
        Insert: {
          ancestor_id: string
          depth: number
          descendant_id: string
        }
        Update: {
          ancestor_id?: string
          depth?: number
          descendant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_class_hierarchy_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_class_hierarchy_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
          {
            foreignKeyName: "local_class_hierarchy_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_class_hierarchy_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
        ]
      }
      local_class_links: {
        Row: {
          classification_id: string
          confidence: number | null
          is_preferred: boolean | null
          local_class_id: string
          note: string | null
        }
        Insert: {
          classification_id: string
          confidence?: number | null
          is_preferred?: boolean | null
          local_class_id: string
          note?: string | null
        }
        Update: {
          classification_id?: string
          confidence?: number | null
          is_preferred?: boolean | null
          local_class_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_class_links_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_class_links_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["classification_id"]
          },
          {
            foreignKeyName: "local_class_links_local_class_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_class_links_local_class_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
        ]
      }
      local_classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label_en: string | null
          label_ja: string | null
          local_number: string | null
          parent_id: string | null
          preferred_classification_id: string | null
          sort_order: number | null
          status: string
          token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label_en?: string | null
          label_ja?: string | null
          local_number?: string | null
          parent_id?: string | null
          preferred_classification_id?: string | null
          sort_order?: number | null
          status?: string
          token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label_en?: string | null
          label_ja?: string | null
          local_number?: string | null
          parent_id?: string | null
          preferred_classification_id?: string | null
          sort_order?: number | null
          status?: string
          token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_classes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_classes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
          {
            foreignKeyName: "local_classes_preferred_classification_id_fkey"
            columns: ["preferred_classification_id"]
            isOneToOne: false
            referencedRelation: "classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_classes_preferred_classification_id_fkey"
            columns: ["preferred_classification_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["classification_id"]
          },
        ]
      }
      local_counters: {
        Row: {
          kind: string
          value: number
          year: number
        }
        Insert: {
          kind: string
          value: number
          year: number
        }
        Update: {
          kind?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      location_media_links: {
        Row: {
          created_at: string
          location_id: string
          media_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          location_id: string
          media_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          location_id?: string
          media_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_media_links_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          address_en: string | null
          address_ja: string | null
          contained_in: string | null
          contained_in_en: string | null
          contained_in_ja: string | null
          created_at: string
          google_maps_url: string | null
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          local_number: string
          name: string
          name_en: string | null
          name_ja: string | null
          token: string | null
          updated_at: string
          url: string | null
          visibility: string | null
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          address_ja?: string | null
          contained_in?: string | null
          contained_in_en?: string | null
          contained_in_ja?: string | null
          created_at?: string
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          local_number: string
          name: string
          name_en?: string | null
          name_ja?: string | null
          token?: string | null
          updated_at?: string
          url?: string | null
          visibility?: string | null
        }
        Update: {
          address?: string | null
          address_en?: string | null
          address_ja?: string | null
          contained_in?: string | null
          contained_in_en?: string | null
          contained_in_ja?: string | null
          created_at?: string
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          local_number?: string
          name?: string
          name_en?: string | null
          name_ja?: string | null
          token?: string | null
          updated_at?: string
          url?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          bucket: string | null
          copyright_owner: string | null
          created_at: string
          file_size: number | null
          file_type: string | null
          height: number | null
          id: string
          kind: string
          license: string | null
          license_id: string | null
          local_number: string | null
          object_id: string | null
          original_filename: string | null
          rights_note: string | null
          sort_order: number
          source: string | null
          storage_path: string | null
          token: string | null
          uri: string
          visibility: string | null
          width: number | null
        }
        Insert: {
          bucket?: string | null
          copyright_owner?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          kind: string
          license?: string | null
          license_id?: string | null
          local_number?: string | null
          object_id?: string | null
          original_filename?: string | null
          rights_note?: string | null
          sort_order?: number
          source?: string | null
          storage_path?: string | null
          token?: string | null
          uri: string
          visibility?: string | null
          width?: number | null
        }
        Update: {
          bucket?: string | null
          copyright_owner?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          kind?: string
          license?: string | null
          license_id?: string | null
          local_number?: string | null
          object_id?: string | null
          original_filename?: string | null
          rights_note?: string | null
          sort_order?: number
          source?: string | null
          storage_path?: string | null
          token?: string | null
          uri?: string
          visibility?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "media_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      member_tags: {
        Row: {
          account_id: string
          created_at: string
          id: string
          media_id: string
          tagged_by_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          media_id: string
          tagged_by_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          media_id?: string
          tagged_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_tags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_tags_tagged_by_id_fkey"
            columns: ["tagged_by_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      object_classifications: {
        Row: {
          classification_id: string
          object_id: string
          role: string
        }
        Insert: {
          classification_id: string
          object_id: string
          role: string
        }
        Update: {
          classification_id?: string
          object_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_classifications_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_classifications_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["classification_id"]
          },
          {
            foreignKeyName: "object_classifications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "object_classifications_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_media_links: {
        Row: {
          media_id: string
          object_id: string
          role: string | null
        }
        Insert: {
          media_id: string
          object_id: string
          role?: string | null
        }
        Update: {
          media_id?: string
          object_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_media_links_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "object_media_links_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          ark_name: string | null
          craftsman: string | null
          craftsman_ja: string | null
          created_at: string
          event_date: string | null
          id: string
          local_number: string | null
          location: string | null
          location_ja: string | null
          naan: string | null
          notes: string | null
          notes_ja: string | null
          price: number | null
          primary_local_class_id: string | null
          store: string | null
          store_ja: string | null
          title: string
          title_ja: string | null
          token: string
          updated_at: string
          url: string | null
          visibility: string
        }
        Insert: {
          ark_name?: string | null
          craftsman?: string | null
          craftsman_ja?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          local_number?: string | null
          location?: string | null
          location_ja?: string | null
          naan?: string | null
          notes?: string | null
          notes_ja?: string | null
          price?: number | null
          primary_local_class_id?: string | null
          store?: string | null
          store_ja?: string | null
          title: string
          title_ja?: string | null
          token: string
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Update: {
          ark_name?: string | null
          craftsman?: string | null
          craftsman_ja?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          local_number?: string | null
          location?: string | null
          location_ja?: string | null
          naan?: string | null
          notes?: string | null
          notes_ja?: string | null
          price?: number | null
          primary_local_class_id?: string | null
          store?: string | null
          store_ja?: string | null
          title?: string
          title_ja?: string | null
          token?: string
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "objects_primary_local_class_id_fkey"
            columns: ["primary_local_class_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_primary_local_class_id_fkey"
            columns: ["primary_local_class_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
        ]
      }
      redirects: {
        Row: {
          new_path: string
          old_path: string
        }
        Insert: {
          new_path: string
          old_path: string
        }
        Update: {
          new_path?: string
          old_path?: string
        }
        Relationships: []
      }
      tea_schools: {
        Row: {
          id: string
          name_en: string
          name_ja: string | null
        }
        Insert: {
          id?: string
          name_en: string
          name_ja?: string | null
        }
        Update: {
          id?: string
          name_en?: string
          name_ja?: string | null
        }
        Relationships: []
      }
      valuations: {
        Row: {
          amount: number
          as_of_date: string
          currency: string
          id: string
          object_id: string
          source: string | null
          source_url: string | null
          visibility: string
        }
        Insert: {
          amount: number
          as_of_date: string
          currency: string
          id?: string
          object_id: string
          source?: string | null
          source_url?: string | null
          visibility?: string
        }
        Update: {
          amount?: number
          as_of_date?: string
          currency?: string
          id?: string
          object_id?: string
          source?: string | null
          source_url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "valuations_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      local_class_object_counts_direct: {
        Row: {
          local_class_id: string | null
          object_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_primary_local_class_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_primary_local_class_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
        ]
      }
      local_class_object_counts_total: {
        Row: {
          local_class_id: string | null
          object_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "local_class_hierarchy_ancestor_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "local_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_class_hierarchy_ancestor_id_fkey"
            columns: ["local_class_id"]
            isOneToOne: false
            referencedRelation: "object_preferred_classification"
            referencedColumns: ["local_class_id"]
          },
        ]
      }
      object_preferred_classification: {
        Row: {
          classification_id: string | null
          classification_label: string | null
          classification_label_ja: string | null
          classification_scheme: string | null
          classification_uri: string | null
          local_class_id: string | null
          local_class_label_en: string | null
          local_class_label_ja: string | null
          object_id: string | null
          token: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_and_increment_counter: {
        Args: { p_kind: string; p_year: number }
        Returns: number
      }
      set_local_class_local_number: {
        Args: { class_id: number; new_local_number: string }
        Returns: undefined
      }
      swap_local_class_sort_order: {
        Args:
          | { class_id_1: string; class_id_2: string }
          | { item1_id: number; item2_id: number }
        Returns: undefined
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
