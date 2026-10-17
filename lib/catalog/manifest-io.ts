import fs from "node:fs/promises";
import path from "node:path";
import { buildManifestFromProducts } from "@/lib/catalog/manifest-build";
import type { CatalogManifest } from "@/lib/catalog/manifest-types";
import { manifestPath } from "@/lib/catalog/manifest-store";
import type { CatalogRecord } from "@/lib/catalog/store";
import { appConfig } from "@/lib/config";

export async function readManifestFile(): Promise<CatalogManifest | undefined> {
  try {
    const raw = await fs.readFile(manifestPath(), "utf8");
    return JSON.parse(raw) as CatalogManifest;
  } catch {
    return undefined;
  }
}

export async function writeManifestFile(manifest: CatalogManifest): Promise<string> {
  const dest = manifestPath();
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, `${JSON.stringify(manifest, null, 2)}\n`);
  return dest;
}

export async function bootstrapManifestFromCatalogJson(options?: {
  mergeExisting?: boolean;
  ingestedAt?: string;
}): Promise<{ manifest: CatalogManifest; path: string }> {
  const catalogFile = path.join(appConfig.extractedDir, "catalog.json");
  const raw = JSON.parse(await fs.readFile(catalogFile, "utf8")) as { products?: CatalogRecord[] };
  const products = raw.products ?? [];
  if (products.length === 0) {
    throw new Error(`No products in ${catalogFile}. Run npm run ingest:catalog first.`);
  }

  const previous = options?.mergeExisting ? await readManifestFile() : undefined;
  const manifest = buildManifestFromProducts(products, {
    previous: previous?.catalogs,
    ingestedAt: options?.ingestedAt,
  });
  const written = await writeManifestFile(manifest);
  return { manifest, path: written };
}
