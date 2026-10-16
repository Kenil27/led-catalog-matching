import { NextResponse } from "next/server";
import { ensureCatalogLoaded } from "@/lib/catalog/store";
import { getPublicProduct } from "@/lib/catalog/public";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  await ensureCatalogLoaded();
  const { id } = await context.params;
  const product = getPublicProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}
