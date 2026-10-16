import { QdrantClient } from "@qdrant/js-client-rest";
import { appConfig } from "@/lib/config";

let client: QdrantClient | undefined;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: appConfig.qdrantUrl,
      apiKey: appConfig.qdrantApiKey,
    });
  }
  return client;
}

export async function ensureCollection(vectorSize: number): Promise<void> {
  const qdrant = getQdrantClient();
  const name = appConfig.qdrantCollection;
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((collection) => collection.name === name);
  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
    return;
  }
  const info = await qdrant.getCollection(name);
  const size =
    info.config?.params?.vectors &&
    typeof info.config.params.vectors === "object" &&
    "size" in info.config.params.vectors
      ? Number(info.config.params.vectors.size)
      : undefined;
  if (size !== undefined && size !== vectorSize) {
    throw new Error(
      `Qdrant collection "${name}" has vector size ${size}, but the embedding is ${vectorSize}. Recreate the collection or use a new name.`,
    );
  }
}

export async function listedIndexedHashKeys(embeddingModel: string): Promise<Set<string>> {
  const qdrant = getQdrantClient();
  const keys = new Set<string>();
  let offset: string | number | Record<string, unknown> | null | undefined = undefined;
  do {
    const page = await qdrant.scroll(appConfig.qdrantCollection, {
      limit: 100,
      offset,
      with_payload: true,
      with_vector: false,
    });
    for (const point of page.points) {
      const payload = point.payload ?? {};
      const hash = typeof payload.contentHash === "string" ? payload.contentHash : undefined;
      const model = typeof payload.embeddingModel === "string" ? payload.embeddingModel : embeddingModel;
      if (hash) keys.add(`${hash}:${model}`);
    }
    offset = page.next_page_offset as typeof offset;
  } while (offset);
  return keys;
}
