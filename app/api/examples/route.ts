import { NextResponse } from "next/server";
import { ensureCatalogLoaded } from "@/lib/catalog/store";
import { listExampleQueries } from "@/lib/catalog/public";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  await ensureCatalogLoaded();
  return NextResponse.json({ examples: listExampleQueries() });
}
