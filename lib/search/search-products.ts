import { ensureCatalogLoaded, getCatalogProduct } from "@/lib/catalog/store";
import { appConfig } from "@/lib/config";
import type { EmbeddingProvider } from "@/lib/embeddings/types";
import { getQdrantClient } from "@/lib/qdrant/collection";
import { payloadFromUnknown } from "@/lib/qdrant/payload";
import { aggregateBestPerProduct } from "@/lib/search/aggregate";
import { matchLevelFromScore, type MatchLevel } from "@/lib/search/match-level";

export type SearchProductResult = {
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
  imagePath: string;
  catalogFileName: string;
  pageNumber: number;
};

export type SearchResponse = {
  results: SearchProductResult[];
  meta: {
    embeddingModel: string;
    vectorSize: number;
    latencyMs: number;
    imageHitsConsidered: number;
    matchLevelNote: string;
  };
};

export async function searchProducts(input: {
  imageBytes?: Uint8Array;
  mimeType?: string;
  queryVector?: number[];
  embeddingProvider?: EmbeddingProvider;
  limit?: number;
  excludeImageIds?: string[];
}): Promise<SearchResponse> {
  await ensureCatalogLoaded();
  const started = Date.now();
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  const vector =
    input.queryVector ??
    (input.imageBytes && input.embeddingProvider
      ? await input.embeddingProvider.embedImage({
          bytes: input.imageBytes,
          mimeType: input.mimeType ?? "image/jpeg",
        })
      : undefined);
  if (!vector) {
    throw new Error("searchProducts requires queryVector or imageBytes + embeddingProvider.");
  }
  const qdrant = getQdrantClient();
  const response = await qdrant.query(appConfig.qdrantCollection, {
    query: vector,
    limit: Math.max(limit * 4, 20),
    with_payload: true,
  });

  const exclude = new Set(input.excludeImageIds ?? []);
  const hits = response.points.flatMap((point) => {
    const payload = payloadFromUnknown(
      (point.payload ?? undefined) as Record<string, unknown> | undefined,
    );
    if (exclude.has(payload.imageId)) return [];
    return [
      {
        ...payload,
        similarityScore: point.score ?? 0,
      },
    ];
  });

  const aggregated = aggregateBestPerProduct(hits).slice(0, limit);
  return {
    results: aggregated.map((hit) => {
      const record = getCatalogProduct(hit.productId);
      return {
        productId: hit.productId,
        sku: record?.sku ?? hit.sku,
        itemNo: record?.itemNo ?? hit.itemNo,
        productName: record?.productName ?? hit.productName ?? hit.itemNo,
        lamp: record?.lamp ?? hit.lamp,
        dimensions: record?.dimensions ?? hit.dimensions,
        finish: record?.finish ?? hit.finish,
        material: record?.material ?? hit.material,
        wattage: record?.wattage,
        category: record?.category ?? hit.category,
        similarityScore: hit.similarityScore,
        matchLevel: matchLevelFromScore(hit.similarityScore),
        matchedImageId: hit.matchedImageId,
        view: hit.view,
        imagePath: record?.images.find((image) => image.imageId === hit.matchedImageId)?.imagePath ?? hit.imagePath,
        catalogFileName: record?.catalogFileName ?? hit.catalogFileName,
        pageNumber: record?.pageNumber ?? hit.pageNumber,
      };
    }),
    meta: {
      embeddingModel: input.embeddingProvider?.modelId ?? appConfig.embeddingModel,
      vectorSize: vector.length,
      latencyMs: Date.now() - started,
      imageHitsConsidered: hits.length,
      matchLevelNote:
        "matchLevel is an uncalibrated Phase 1 retrieval bucket (high>=0.75, possible>=0.60, else low), not a probability.",
    },
  };
}
