// TypeScript interfaces for admin pages to improve type safety

export interface LocalClass {
  id: string;
  token?: string;
  local_number?: string;
  sort_order?: number | null;
  label_en?: string;
  label_ja?: string;
  description?: string;
  parent_id?: string;
  preferred_classification_id?: string;
}

export interface Classification {
  id: string;
  scheme: string;
  uri: string;
  label?: string;
  label_ja?: string;
  kind?: string;
}

export interface LocalClassHierarchy {
  ancestor_id: string;
  descendant_id: string;
  depth: number;
}

export interface ObjectItem {
  id: string;
  token?: string;
  local_number?: string;
  title?: string;
  title_ja?: string;
  primary_local_class_id?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Media visibility types
export type MediaVisibility = 'public' | 'private';
export type MediaFileType = 'image' | 'pdf';

export interface Media {
  id: string;
  token?: string;
  local_number?: string;
  object_id?: string;
  kind?: string;
  uri: string;
  file_type: MediaFileType;
  file_size?: number;
  original_filename?: string;
  storage_path?: string;
  bucket?: string;
  visibility: MediaVisibility;
  copyright_owner?: string;
  rights_note?: string;
  license_id?: string;
  license?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Chakai types
export type ChakaiVisibility = 'open' | 'members' | 'closed';

export interface Chakai {
  id: string;
  token?: string;
  local_number?: string;
  name_en?: string;
  name_ja?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location_id?: string;
  visibility: ChakaiVisibility;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChakaiAttendee {
  id: string;
  chakai_id: string;
  user_id?: string;
  email?: string;
  full_name_en?: string;
  full_name_ja?: string;
  role: 'attendee' | 'organizer';
  created_at?: string;
}

export interface ChakaiMedia {
  id: string;
  chakai_id: string;
  token?: string;
  local_number?: string;
  title?: string;
  title_ja?: string;
  file_type: MediaFileType;
  file_size?: number;
  original_filename?: string;
  storage_path: string;
  bucket: string;
  visibility: MediaVisibility;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}