import { createHash } from "node:crypto";

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function hashKey(contentHash: string, embeddingModel: string): string {
  return `${contentHash}:${embeddingModel}`;
}

export function partitionByHash<T extends { contentHash: string }>(
  items: T[],
  indexedKeys: Set<string>,
  embeddingModel: string,
): { toEmbed: T[]; skipped: T[] } {
  const toEmbed: T[] = [];
  const skipped: T[] = [];
  for (const item of items) {
    if (indexedKeys.has(hashKey(item.contentHash, embeddingModel))) {
      skipped.push(item);
    } else {
      toEmbed.push(item);
    }
  }
  return { toEmbed, skipped };
}
