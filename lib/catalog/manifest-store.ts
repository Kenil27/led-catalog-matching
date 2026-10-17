import fs from "node:fs";
import path from "node:path";
import { blobCatalogPathname, readBlobText, usesPrivateBlobCatalog } from "@/lib/catalog/blob-storage";
import type { CatalogManifest, PublicCatalogManifest } from "@/lib/catalog/manifest-types";
import { appConfig } from "@/lib/config";

let manifestCache: CatalogManifest | undefined;
let manifestLoadPromise: Promise<void> | undefined;

export function manifestPath(): string {
  return path.join(appConfig.extractedDir, "catalogs.json");
}

export function deriveManifestUrlFromCatalogJsonUrl(catalogJsonUrl: string): string {
  if (catalogJsonUrl.endsWith("/catalog.json")) {
    return `${catalogJsonUrl.slice(0, -"/catalog.json".length)}/catalogs.json`;
  }
  return catalogJsonUrl.replace(/catalog\.json(\?.*)?$/, "catalogs.json$1");
}

function parseManifest(raw: unknown): CatalogManifest {
  const parsed = raw as CatalogManifest;
  if (parsed?.version !== 1 || !Array.isArray(parsed.catalogs)) {
    throw new Error("Invalid catalogs.json manifest (expected version 1).");
  }
  return parsed;
}

async function loadManifestFromSource(): Promise<void> {
  if (manifestCache) return;

  let source = "local";
  let raw: unknown;

  const manifestUrl =
    appConfig.catalogManifestUrl ??
    (appConfig.catalogJsonUrl
      ? deriveManifestUrlFromCatalogJsonUrl(appConfig.catalogJsonUrl)
      : undefined);

  if (manifestUrl) {
    source = manifestUrl;
    const response = await fetch(manifestUrl, { next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch catalog manifest (${response.status}): ${source}`);
    }
    raw = await response.json();
  } else if (usesPrivateBlobCatalog()) {
    source = blobCatalogPathname("catalogs.json");
    raw = JSON.parse(await readBlobText(source));
  } else {
    const dest = manifestPath();
    if (!fs.existsSync(dest)) {
      manifestCache = { version: 1, updatedAt: new Date(0).toISOString(), catalogs: [] };
      return;
    }
    raw = JSON.parse(fs.readFileSync(dest, "utf8"));
    source = dest;
  }

  manifestCache = parseManifest(raw);
}

export async function ensureManifestLoaded(): Promise<void> {
  if (manifestCache) return;
  if (!manifestLoadPromise) {
    manifestLoadPromise = loadManifestFromSource().finally(() => {
      manifestLoadPromise = undefined;
    });
  }
  await manifestLoadPromise;
}

export function getCatalogManifest(): CatalogManifest {
  if (!manifestCache) {
    throw new Error("Catalog manifest not loaded. Call ensureManifestLoaded() first.");
  }
  return manifestCache;
}

export function listLiveCatalogIds(): Set<string> {
  const manifest = getCatalogManifest();
  return new Set(
    manifest.catalogs.filter((entry) => entry.status === "live").map((entry) => entry.catalogFileId),
  );
}

export function toPublicCatalogManifest(manifest: CatalogManifest): PublicCatalogManifest {
  return {
    version: manifest.version,
    updatedAt: manifest.updatedAt,
    catalogs: manifest.catalogs
      .filter((entry) => entry.status === "live")
      .map(({ notes: _notes, ...rest }) => rest),
  };
}

/** Test-only */
export function resetManifestCacheForTests(): void {
  manifestCache = undefined;
  manifestLoadPromise = undefined;
}
