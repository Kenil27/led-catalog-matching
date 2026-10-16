import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { usesPrivateBlobCatalog } from "@/lib/catalog/blob-storage";
import { ensureCatalogLoaded, loadCatalog, usesRemoteCatalogAssets } from "@/lib/catalog/store";
import { getQdrantClient } from "@/lib/qdrant/collection";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    await ensureCatalogLoaded();
    const products = loadCatalog().length;
    const qdrant = getQdrantClient();
    const collections = await qdrant.getCollections();
    const hasCollection = collections.collections.some(
      (item) => item.name === appConfig.qdrantCollection,
    );
    return NextResponse.json({
      ok: products > 0 && hasCollection,
      products,
      catalogSource: appConfig.catalogJsonUrl ?? (usesPrivateBlobCatalog() ? "blob-private" : "local"),
      remoteAssets: usesRemoteCatalogAssets() || usesPrivateBlobCatalog(),
      blobAccess: appConfig.blobStoreAccess,
      qdrantCollection: appConfig.qdrantCollection,
      qdrantReady: hasCollection,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
