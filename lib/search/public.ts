import { catalogMediaUrl } from "@/lib/catalog/store";
import type { PublicSearchResponse } from "@/lib/search/public-types";
import type { SearchResponse } from "@/lib/search/search-products";

export type { PublicSearchResponse, PublicSearchResult } from "@/lib/search/public-types";

export function toPublicSearchResponse(response: SearchResponse): PublicSearchResponse {
  return {
    results: response.results.map((result) => ({
      productId: result.productId,
      sku: result.sku,
      itemNo: result.itemNo,
      productName: result.productName,
      lamp: result.lamp,
      dimensions: result.dimensions,
      finish: result.finish,
      material: result.material,
      wattage: result.wattage,
      category: result.category,
      similarityScore: result.similarityScore,
      matchLevel: result.matchLevel,
      matchedImageId: result.matchedImageId,
      view: result.view,
      catalogFileName: result.catalogFileName,
      pageNumber: result.pageNumber,
      imageUrl: catalogMediaUrl(result.matchedImageId),
    })),
    meta: response.meta,
  };
}
