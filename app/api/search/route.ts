import { NextResponse } from "next/server";
import { ensureCatalogLoaded, getCatalogImage } from "@/lib/catalog/store";
import { GeminiEmbeddingProvider } from "@/lib/embeddings/gemini";
import { retrieveIndexedVector } from "@/lib/qdrant/vectors";
import { toPublicSearchResponse } from "@/lib/search/public";
import { searchProducts } from "@/lib/search/search-products";
import { ImageValidationError, validateSearchImage } from "@/lib/validation/image";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseLimit(request: Request): number {
  const raw = new URL(request.url).searchParams.get("limit");
  const limit = raw ? Number(raw) : 8;
  return Number.isFinite(limit) ? limit : 8;
}

function searchErrorResponse(error: unknown): Response {
  if (error instanceof ImageValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "Search failed";
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return NextResponse.json(
      {
        error:
          "Image search is temporarily rate-limited. Try a catalog example, or retry after the daily embed quota resets.",
      },
      { status: 429 },
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request): Promise<Response> {
  let file: File | null = null;
  try {
    await ensureCatalogLoaded();
    const form = await request.formData();
    const limit = parseLimit(request);
    const catalogImageId = form.get("catalogImageId");

    if (typeof catalogImageId === "string" && catalogImageId) {
      const found = getCatalogImage(catalogImageId);
      if (!found) {
        return NextResponse.json({ error: "Unknown catalog image." }, { status: 400 });
      }
      const result = await searchProducts({
        queryVector: await retrieveIndexedVector(found.image.contentHash),
        limit,
        excludeImageIds: [found.image.imageId],
        applyRelevanceGate: false,
      });
      return NextResponse.json(toPublicSearchResponse(result));
    }

    const value = form.get("image");
    if (!(value instanceof File)) {
      return NextResponse.json(
        { error: "Upload an image or choose a catalog example." },
        { status: 400 },
      );
    }
    file = value;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validated = await validateSearchImage({
      bytes,
      mimeType: file.type || "application/octet-stream",
      byteLength: bytes.byteLength,
    });
    const result = await searchProducts({
      imageBytes: validated.bytes,
      mimeType: validated.mimeType,
      embeddingProvider: new GeminiEmbeddingProvider(),
      limit,
    });
    return NextResponse.json(toPublicSearchResponse(result));
  } catch (error) {
    return searchErrorResponse(error);
  } finally {
    file = null;
  }
}
