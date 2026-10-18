// app/types/thesis.ts

export type Lang = 'th' | 'en' | 'ch';

// ⭐️ ฟังก์ชันค้นหาใช้ตัวนี้ ห้ามลบเด็ดขาด
export interface SearchQuery {
  text: string;
  operator: string;
  field: string;
}

export interface Thesis {
  id: string | number;
  title_th: string;
  title_en?: string;
  author: string;
  publish_year?: string;
  education_level?: string;
  major?: string;
  resource_type?: string;
  abstract_th?: string;
  abstract_en?: string;
  advisor_1?: string;
  advisor_2?: string;
  advisor_3?: string;
  tdc_url?: string;
  drive_url?: string;
  keywords?: string;
  call_number?: string;
  view_count?: number;
  download_count?: number;
  similarity?: number;
  ai_summary?: string;
  has_chat?: boolean;

  // ระเบียบวิธีวิจัย
  research_type?: string;
  sample_size?: string;
  instruments?: string;
  statistics?: string;
}