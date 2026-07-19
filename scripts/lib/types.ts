export interface MasterEquipmentRecord {
  manufacturer: string;
  model: string;
  series: string | null;
  category: string;
  category_raw: string | null;
  description: string | null;
  bullet_points: string[];
  image_url: string | null;
  manufacturer_website_url: string | null;
  av_iq_product_id?: string;
  source_url: string;
  source: string;
  status: 'pending_review' | 'approved' | 'rejected';
  scraped_at: string;
}

export interface ScrapeRunSummary {
  discovered: number;
  fetched: number;
  parsed: number;
  upserted: number;
  skipped: number;
  errors: number;
}
