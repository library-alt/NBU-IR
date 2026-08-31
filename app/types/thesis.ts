// types/thesis.ts
export type Lang = 'th' | 'en' | 'ch';

export interface Thesis {
  id: string | number;
  title_th: string;
  title_en?: string;
  author: string;
  publish_year: string;
  education_level: string;
  major: string;
  resource_type: string;
  abstract_th?: string;
  abstract_en?: string;
  advisor_1?: string;
  advisor_2?: string;
  advisor_3?: string;
  tdc_url?: string;
  drive_url?: string;
  keywords?: string;
  view_count?: number;
  download_count?: number;
  similarity?: number;
}

export interface SearchQuery {
  text: string;
  operator: string;
  field: string;
}