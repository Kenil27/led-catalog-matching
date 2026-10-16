import { geoLitingTemplate } from "@/lib/ingest/templates/geo-liting";
import { glitteron2026Template } from "@/lib/ingest/templates/glitteron-2026";
import type { CatalogTemplate } from "@/lib/ingest/core/types";

const TEMPLATES: CatalogTemplate[] = [geoLitingTemplate, glitteron2026Template];

export function resolveCatalogTemplate(fileName: string): CatalogTemplate {
  const match = TEMPLATES.find((template) => template.matches(fileName));
  if (!match) {
    throw new Error(
      `No ingest template registered for "${fileName}". Supported: Geo Liting floor/table, GlitterOn 2026 ceiling/chandelier/floor.`,
    );
  }
  return match;
}
