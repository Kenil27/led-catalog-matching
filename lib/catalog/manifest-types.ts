/** Registry of ingested PDF catalogs (Phase 1). Products stay in catalog.json. */

export type CatalogManifestStatus = "live" | "disabled" | "draft";

export type CatalogManifestEntry = {
  catalogFileId: string;
  catalogFileName: string;
  displayName: string;
  templateId: string;
  status: CatalogManifestStatus;
  /** ISO-8601 when this catalog was last successfully ingested. */
  ingestedAt: string;
  productCount: number;
  imageCount: number;
  notes?: string;
};

export type CatalogManifest = {
  version: 1;
  updatedAt: string;
  catalogs: CatalogManifestEntry[];
};

export type PublicCatalogManifestEntry = Omit<CatalogManifestEntry, "notes">;

export type PublicCatalogManifest = {
  version: 1;
  updatedAt: string;
  catalogs: PublicCatalogManifestEntry[];
};
