export interface ProductTarget {
  manufacturerSlug: string;
  productSlug: string;
}

export interface RawAvIqProduct {
  avIqProductId: string;
  manufacturer: string;
  model: string;
  series: string | null;
  description: string | null;
  bulletPoints: string[];
  categoryRaw: string | null;
  imageUrl: string | null;
  sourceUrl: string;
}
