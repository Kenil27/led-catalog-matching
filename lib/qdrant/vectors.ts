import { appConfig } from "@/lib/config";
import { pointIdFromContentHash } from "@/lib/ingest/core/product-id";
import { getQdrantClient } from "@/lib/qdrant/collection";

function asFlatVector(vector: unknown): number[] | undefined {
  if (!Array.isArray(vector)) return undefined;
  if (vector.every((value) => typeof value === "number")) return vector;
  return undefined;
}

export async function retrieveIndexedVector(contentHash: string): Promise<number[]> {
  const points = await getQdrantClient().retrieve(appConfig.qdrantCollection, {
    ids: [pointIdFromContentHash(contentHash)],
    with_vector: true,
  });
  const vector = asFlatVector(points[0]?.vector);
  if (vector) return vector;
  throw new Error(`No indexed vector for hash ${contentHash.slice(0, 12)}`);
}
