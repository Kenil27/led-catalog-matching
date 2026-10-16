import fs from "node:fs";
import path from "node:path";
import { assetKeyFromImagePath, publicAssetUrl } from "@/lib/catalog/asset-path";
import { blobCatalogPathname, readBlobText, usesPrivateBlobCatalog } from "@/lib/catalog/blob-storage";
import { appConfig } from "@/lib/config";
import type { CatalogProduct, CatalogProductImage } from "@/lib/ingest/core/types";

export type CatalogImageRecord = {
  imageId: string;
  view: CatalogProductImage["view"];
  imagePath: string;
  contentHash: string;
  assetKey?: string;
};

export type CatalogRecord = CatalogProduct & {
  images: CatalogImageRecord[];
};

export type CatalogImageRef = {
  product: CatalogRecord;
  image: CatalogImageRecord;
};

type CatalogIndex = {
  source: string;
  records: CatalogRecord[];
  byId: Map<string, CatalogRecord>;
  byImageId: Map<string, CatalogImageRef>;
};

let catalogCache: CatalogIndex | undefined;
let catalogLoadPromise: Promise<void> | undefined;

function catalogPath(): string {
  return path.join(appConfig.extractedDir, "catalog.json");
}

function buildIndex(records: CatalogRecord[], source: string): CatalogIndex {
  const byId = new Map(records.map((product) => [product.productId, product]));
  const byImageId = new Map<string, CatalogImageRef>();
  for (const product of records) {
    for (const image of product.images) {
      byImageId.set(image.imageId, { product, image });
    }
  }
  return { source, records, byId, byImageId };
}

async function loadCatalogFromSource(): Promise<void> {
  if (catalogCache) return;

  let records: CatalogRecord[] = [];
  let source = "local";

  if (appConfig.catalogJsonUrl) {
    source = appConfig.catalogJsonUrl;
    const response = await fetch(appConfig.catalogJsonUrl, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch catalog (${response.status}): ${appConfig.catalogJsonUrl}`);
    }
    const parsed = (await response.json()) as { products?: CatalogRecord[] };
    records = parsed.products ?? [];
  } else if (usesPrivateBlobCatalog()) {
    source = blobCatalogPathname("catalog.json");
    const parsed = JSON.parse(await readBlobText(source)) as { products?: CatalogRecord[] };
    records = parsed.products ?? [];
  } else {
    const dest = catalogPath();
    if (!fs.existsSync(dest)) {
      catalogCache = buildIndex([], source);
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(dest, "utf8")) as { products?: CatalogRecord[] };
    records = parsed.products ?? [];
    source = dest;
  }

  catalogCache = buildIndex(records, source);
}

export async function ensureCatalogLoaded(): Promise<void> {
  if (catalogCache) return;
  if (!catalogLoadPromise) {
    catalogLoadPromise = loadCatalogFromSource().finally(() => {
      catalogLoadPromise = undefined;
    });
  }
  await catalogLoadPromise;
}

/** Test helper — reset in-memory catalog cache. */
export function resetCatalogCacheForTests(): void {
  catalogCache = undefined;
  catalogLoadPromise = undefined;
}

/** Test helper — load records without filesystem or network. */
export function seedCatalogCacheForTests(records: CatalogRecord[]): void {
  catalogCache = buildIndex(records, "test");
}

export function buildCatalogRecords(
  products: CatalogProduct[],
  images: CatalogProductImage[],
): CatalogRecord[] {
  const byProduct = new Map<string, CatalogImageRecord[]>();
  for (const image of images) {
    const list = byProduct.get(image.productId) ?? [];
    list.push({
      imageId: image.imageId,
      view: image.view,
      imagePath: image.imagePath,
      contentHash: image.contentHash,
      assetKey: assetKeyFromImagePath(image.imagePath),
    });
    byProduct.set(image.productId, list);
  }
  return products.map((product) => ({
    ...product,
    images: byProduct.get(product.productId) ?? [],
  }));
}

export async function saveCatalog(records: CatalogRecord[]): Promise<void> {
  const dest = catalogPath();
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.writeFile(dest, JSON.stringify({ products: records }, null, 2));
}

function catalogIndex(): CatalogIndex {
  if (!catalogCache) {
    throw new Error("Catalog not loaded. Call ensureCatalogLoaded() first.");
  }
  return catalogCache;
}

export function loadCatalog(): CatalogRecord[] {
  return catalogIndex().records;
}

export function getCatalogProduct(productId: string): CatalogRecord | undefined {
  return catalogIndex().byId.get(productId);
}

export function getCatalogImage(imageId: string): CatalogImageRef | undefined {
  return catalogIndex().byImageId.get(imageId);
}

export function resolveCatalogMediaPath(imagePath: string): string | undefined {
  const root = path.resolve(appConfig.extractedDir);
  const absolute = path.resolve(imagePath);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) return undefined;
  if (!fs.existsSync(absolute)) return undefined;
  return absolute;
}

export function catalogMediaUrl(imageId: string): string {
  const found = getCatalogImage(imageId);
  if (appConfig.catalogAssetBaseUrl && found) {
    const key = found.image.assetKey ?? assetKeyFromImagePath(found.image.imagePath);
    return publicAssetUrl(appConfig.catalogAssetBaseUrl, key);
  }
  return `/api/media/${encodeURIComponent(imageId)}`;
}

export function usesRemoteCatalogAssets(): boolean {
  return Boolean(appConfig.catalogAssetBaseUrl);
}

export function imageAssetKey(image: CatalogImageRecord): string {
  return image.assetKey ?? assetKeyFromImagePath(image.imagePath);
}
