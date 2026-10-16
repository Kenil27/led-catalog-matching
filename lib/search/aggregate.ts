export type ScoredImageHit = {
  productId: string;
  imageId: string;
  similarityScore: number;
  [key: string]: unknown;
};

export type AggregatedProductHit<T extends ScoredImageHit = ScoredImageHit> = T & {
  matchedImageId: string;
};

export function aggregateBestPerProduct<T extends ScoredImageHit>(hits: T[]): AggregatedProductHit<T>[] {
  const best = new Map<string, AggregatedProductHit<T>>();
  for (const hit of hits) {
    const current = best.get(hit.productId);
    if (!current || hit.similarityScore > current.similarityScore) {
      best.set(hit.productId, {
        ...hit,
        matchedImageId: hit.imageId,
      });
    }
  }
  return [...best.values()].sort((a, b) => b.similarityScore - a.similarityScore);
}
