// TypeScript interfaces for admin pages to improve type safety

export interface LocalClass {
  id: string;
  token?: string;
  local_number?: string;
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