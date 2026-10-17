import { NextResponse } from "next/server";
import {
  ensureManifestLoaded,
  getCatalogManifest,
  toPublicCatalogManifest,
} from "@/lib/catalog/manifest-store";

export const runtime = "nodejs";

/** Live catalogs only (Phase 1). Admin views come in a later phase. */
export async function GET(): Promise<Response> {
  try {
    await ensureManifestLoaded();
    const manifest = getCatalogManifest();
    return NextResponse.json(toPublicCatalogManifest(manifest));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load catalog manifest.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
