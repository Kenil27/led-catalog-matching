import { afterEach, describe, expect, it } from "vitest";
import { resetCatalogCacheForTests, seedCatalogCacheForTests } from "@/lib/catalog/store";
import { MATCH_LEVEL_LABEL } from "@/lib/search/labels";
import { toPublicSearchResponse } from "@/lib/search/public";
import type { SearchResponse } from "@/lib/search/search-products";

describe("public search response", () => {
  afterEach(() => resetCatalogCacheForTests());

  it("replaces filesystem imagePath with a media URL", () => {
    seedCatalogCacheForTests([
      {
        productId: "p1",
        itemNo: "x",
        category: "floor",
        extras: [],
        catalogFileId: "x",
        catalogFileName: "x.pdf",
        pageNumber: 1,
        images: [
          {
            imageId: "img-1",
            view: "studio",
            imagePath: "data/extracted/products/p1/a.jpg",
            contentHash: "aaa",
          },
        ],
      },
    ]);
    const response = {
      results: [
        {
          productId: "p1",
          similarityScore: 0.81,
          matchLevel: "high",
          matchedImageId: "img-1",
          imagePath: "/tmp/extracted/p1.jpg",
          catalogFileName: "Ceiling Lights 2026.pdf",
          pageNumber: 1,
        },
      ],
      meta: {
        embeddingModel: "gemini-embedding-2",
        vectorSize: 768,
        latencyMs: 1,
        imageHitsConsidered: 1,
        matchLevelNote: "note",
      },
    } as SearchResponse;

    const publicResponse = toPublicSearchResponse(response);
    expect(publicResponse.results[0]).not.toHaveProperty("imagePath");
    expect(publicResponse.results[0].imageUrl).toBe("/api/media/img-1");
    expect(MATCH_LEVEL_LABEL.high).toBe("Close match");
  });
});
