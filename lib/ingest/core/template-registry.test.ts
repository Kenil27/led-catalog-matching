import { describe, expect, it } from "vitest";
import { resolveCatalogTemplate } from "@/lib/ingest/core/template-registry";

describe("template registry", () => {
  it("selects the Geo Liting template by file name", () => {
    expect(resolveCatalogTemplate("Geo Liting Floor & Table Lamps.pdf").id).toBe("geo-liting");
  });

  it("selects the GlitterOn 2026 template by file name", () => {
    expect(resolveCatalogTemplate("Ceiling Lights 2026.pdf").id).toBe("glitteron-2026");
    expect(resolveCatalogTemplate("Chandelier Lights Luxe 2026.pdf").id).toBe("glitteron-2026");
    expect(resolveCatalogTemplate("Floor Lamp 2026.pdf").id).toBe("glitteron-2026");
  });

  it("does not silently parse unknown catalogs", () => {
    expect(() => resolveCatalogTemplate("2026-downlights.pdf")).toThrow(/No ingest template/);
  });
});
