import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { NextResponse } from "next/server";
import { blobCatalogPathname, readBlobBytes, usesPrivateBlobCatalog } from "@/lib/catalog/blob-storage";
import {
  catalogMediaUrl,
  ensureCatalogLoaded,
  getCatalogImage,
  imageAssetKey,
  resolveCatalogMediaPath,
  usesRemoteCatalogAssets,
} from "@/lib/catalog/store";

export const runtime = "nodejs";

function mediaType(filePath: string): string {
  return extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ imageId: string }> },
): Promise<Response> {
  await ensureCatalogLoaded();
  const { imageId } = await context.params;
  const decoded = decodeURIComponent(imageId);
  const found = getCatalogImage(decoded);
  if (!found) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  if (usesRemoteCatalogAssets()) {
    return NextResponse.redirect(catalogMediaUrl(decoded), 307);
  }

  const filePath = resolveCatalogMediaPath(found.image.imagePath);
  if (filePath) {
    const bytes = await readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": mediaType(filePath),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  if (usesPrivateBlobCatalog()) {
    try {
      const pathname = blobCatalogPathname(imageAssetKey(found.image));
      const { bytes, contentType } = await readBlobBytes(pathname);
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Image not found" }, { status: 404 });
}
