import { describe, expect, it } from "vitest";
import { aggregateBestPerProduct } from "@/lib/search/aggregate";
import { matchLevelFromScore } from "@/lib/search/match-level";
import { payloadFromUnknown } from "@/lib/qdrant/payload";

describe("product aggregation", () => {
  it("keeps the best score per productId", () => {
    const aggregated = aggregateBestPerProduct([
      { productId: "A", imageId: "A-lifestyle", similarityScore: 0.94 },
      { productId: "A", imageId: "A-studio", similarityScore: 0.91 },
      { productId: "B", imageId: "B-studio", similarityScore: 0.89 },
      { productId: "C", imageId: "C-lifestyle", similarityScore: 0.87 },
      { productId: "C", imageId: "C-studio", similarityScore: 0.85 },
    ]);
    expect(aggregated.map((hit) => ({ productId: hit.productId, similarityScore: hit.similarityScore }))).toEqual([
      { productId: "A", similarityScore: 0.94 },
      { productId: "B", similarityScore: 0.89 },
      { productId: "C", similarityScore: 0.87 },
    ]);
    expect(aggregated[0].matchedImageId).toBe("A-lifestyle");
  });
});

describe("qdrant payload mapping", () => {
  it("maps a point payload into search fields", () => {
    const payload = payloadFromUnknown({
      productId: "geo-p2-012910",
      imageId: "geo-p2-012910-abc",
      view: "studio",
      sku: "Y019210FL",
      itemNo: "012910",
      catalogFileName: "Geo Liting Floor & Table Lamps.pdf",
      pageNumber: 2,
      imagePath: "/tmp/x.jpg",
      embeddingModel: "gemini-embedding-2",
      contentHash: "abc",
      catalogFileId: "geo",
    });
    expect(payload.productId).toBe("geo-p2-012910");
    expect(payload.sku).toBe("Y019210FL");
    expect(payload.view).toBe("studio");
  });

  it("rejects payloads without product identity", () => {
    expect(() => payloadFromUnknown({})).toThrow(/productId or imageId/);
  });
});

describe("search response shape", () => {
  it("exposes similarityScore and uncalibrated matchLevel, not probability", () => {
    const hit = aggregateBestPerProduct([
      { productId: "A", imageId: "A1", similarityScore: 0.94 },
    ])[0];
    const body = {
      productId: hit.productId,
      similarityScore: hit.similarityScore,
      matchLevel: matchLevelFromScore(hit.similarityScore),
      matchedImageId: hit.matchedImageId,
    };
    expect(body).toEqual({
      productId: "A",
      similarityScore: 0.94,
      matchLevel: "high",
      matchedImageId: "A1",
    });
    expect(body).not.toHaveProperty("confidence");
    expect(matchLevelFromScore(0.61)).toBe("possible");
    expect(matchLevelFromScore(0.2)).toBe("low");
  });
});
