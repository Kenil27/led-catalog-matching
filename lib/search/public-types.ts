import type { MatchLevel } from "@/lib/search/match-level";

export type PublicSearchResult = {
  productId: string;
  sku?: string;
  itemNo?: string;
  productName?: string;
  lamp?: string;
  dimensions?: string;
  finish?: string;
  material?: string;
  wattage?: string;
  category?: string;
  similarityScore: number;
  matchLevel: MatchLevel;
  matchedImageId: string;
  view?: string;
  imageUrl: string;
  catalogFileName: string;
  pageNumber: number;
};

export type PublicSearchResponse = {
  results: PublicSearchResult[];
  meta: {
    embeddingModel: string;
    vectorSize: number;
    latencyMs: number;
    imageHitsConsidered: number;
    matchLevelNote: string;
  };
};
