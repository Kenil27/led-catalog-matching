import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readUnitFloat(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) return fallback;
  return parsed;
}

export function loadLocalEnvFile(): void {
  if (typeof process === "undefined") return;
  const envPath = path.join(process.cwd(), ".env");
  try {
    if (!existsSync(envPath)) return;
    for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Scripts still work if .env is absent.
  }
}

loadLocalEnvFile();

export type BlobStoreAccess = "public" | "private";

function blobStoreAccess(): BlobStoreAccess {
  const raw = (process.env.BLOB_STORE_ACCESS ?? "public").toLowerCase();
  return raw === "private" ? "private" : "public";
}

export const appConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "gemini-embedding-2",
  requestedEmbeddingDimensions: readPositiveInt(process.env.EMBEDDING_DIMENSIONS, 768),
  qdrantUrl: process.env.QDRANT_URL ?? "http://localhost:6333",
  qdrantApiKey: process.env.QDRANT_API_KEY || undefined,
  qdrantCollection: process.env.QDRANT_COLLECTION ?? "catalog_products",
  catalogPdfDir: process.env.CATALOG_PDF_DIR ?? "./data/catalogs",
  extractedDir: process.env.EXTRACTED_DIR ?? "./data/extracted",
  /** Remote catalog.json for Vercel (no local extract tree). */
  catalogJsonUrl: process.env.CATALOG_JSON_URL?.trim() || undefined,
  /** Registry of PDF catalogs (catalogs.json). Falls back to sibling of CATALOG_JSON_URL. */
  catalogManifestUrl: process.env.CATALOG_MANIFEST_URL?.trim() || undefined,
  /** Public CDN/Blob prefix, e.g. https://….blob.vercel-storage.com/led-catalog */
  catalogAssetBaseUrl: process.env.CATALOG_ASSET_BASE_URL?.replace(/\/$/, "") || undefined,
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined,
  blobPrefix: process.env.BLOB_PREFIX?.replace(/^\/+|\/+$/g, "") || "led-catalog",
  blobStoreAccess: blobStoreAccess(),
  maxUploadBytes: readPositiveInt(process.env.MAX_UPLOAD_BYTES, 10 * 1024 * 1024),
  maxUploadDimension: readPositiveInt(process.env.MAX_UPLOAD_DIMENSION, 8192),
  minUploadDimension: readPositiveInt(process.env.MIN_UPLOAD_DIMENSION, 64),
  /** Minimum top-1 cosine similarity to show catalog matches for customer uploads. */
  searchMinSimilarity: readUnitFloat(
    process.env.SEARCH_MIN_SIMILARITY,
    0.6,
  ),
};
