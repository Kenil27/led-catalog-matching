import { resolveCatalogTemplate } from "@/lib/ingest/core/template-registry";
import type { CatalogProduct, CatalogProductImage } from "@/lib/ingest/core/types";
import type { CatalogManifest, CatalogManifestEntry } from "@/lib/catalog/manifest-types";

export type CatalogProductLike = Pick<
  CatalogProduct,
  "catalogFileId" | "catalogFileName" | "productId"
> & {
  images?: Pick<CatalogProductImage, "imageId">[];
};

function displayNameFromFileName(catalogFileName: string): string {
  return catalogFileName.replace(/\.pdf$/i, "").trim();
}

function templateIdForFileName(catalogFileName: string): string {
  return resolveCatalogTemplate(catalogFileName).id;
}

export function buildManifestEntriesFromProducts(
  products: CatalogProductLike[],
  options?: {
    defaultStatus?: CatalogManifestEntry["status"];
    ingestedAt?: string;
    previous?: CatalogManifestEntry[];
  },
): CatalogManifestEntry[] {
  const defaultStatus = options?.defaultStatus ?? "live";
  const ingestedAt = options?.ingestedAt ?? new Date().toISOString();
  const previousById = new Map(
    (options?.previous ?? []).map((entry) => [entry.catalogFileId, entry]),
  );

  const byCatalog = new Map<string, CatalogProductLike[]>();
  for (const product of products) {
    const list = byCatalog.get(product.catalogFileId) ?? [];
    list.push(product);
    byCatalog.set(product.catalogFileId, list);
  }

  const entries: CatalogManifestEntry[] = [];
  for (const [catalogFileId, group] of [...byCatalog.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const sample = group[0];
    const catalogFileName = sample.catalogFileName;
    const prior = previousById.get(catalogFileId);
    let imageCount = 0;
    for (const product of group) {
      imageCount += product.images?.length ?? 0;
    }
    entries.push({
      catalogFileId,
      catalogFileName,
      displayName: prior?.displayName ?? displayNameFromFileName(catalogFileName),
      templateId: prior?.templateId ?? templateIdForFileName(catalogFileName),
      status: prior?.status ?? defaultStatus,
      ingestedAt: prior?.ingestedAt ?? ingestedAt,
      productCount: group.length,
      imageCount,
      notes: prior?.notes,
    });
  }
  return entries;
}

export function buildManifestFromProducts(
  products: CatalogProductLike[],
  options?: Parameters<typeof buildManifestEntriesFromProducts>[1],
): CatalogManifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    catalogs: buildManifestEntriesFromProducts(products, options),
  };
}
