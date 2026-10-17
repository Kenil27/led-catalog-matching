import { describe, expect, it } from "vitest";
import { buildManifestFromProducts } from "@/lib/catalog/manifest-build";

describe("buildManifestFromProducts", () => {
  it("groups products by catalogFileId and counts images", () => {
    const manifest = buildManifestFromProducts(
      [
        {
          catalogFileId: "ceiling-lights-2026",
          catalogFileName: "Ceiling Lights 2026.pdf",
          productId: "a",
          images: [{ imageId: "i1" }, { imageId: "i2" }],
        },
        {
          catalogFileId: "ceiling-lights-2026",
          catalogFileName: "Ceiling Lights 2026.pdf",
          productId: "b",
          images: [{ imageId: "i3" }],
        },
        {
          catalogFileId: "geo-liting-floor-table-lamps",
          catalogFileName: "Geo Liting Floor & Table Lamps.pdf",
          productId: "c",
          images: [{ imageId: "i4" }],
        },
      ],
      { ingestedAt: "2026-01-01T00:00:00.000Z" },
    );
    expect(manifest.version).toBe(1);
    expect(manifest.catalogs).toHaveLength(2);
    const ceiling = manifest.catalogs.find((c) => c.catalogFileId === "ceiling-lights-2026");
    expect(ceiling?.productCount).toBe(2);
    expect(ceiling?.imageCount).toBe(3);
    expect(ceiling?.templateId).toBe("glitteron-2026");
    expect(ceiling?.displayName).toBe("Ceiling Lights 2026");
    expect(ceiling?.status).toBe("live");
  });

  it("merges prior entry fields", () => {
    const manifest = buildManifestFromProducts(
      [
        {
          catalogFileId: "ceiling-lights-2026",
          catalogFileName: "Ceiling Lights 2026.pdf",
          productId: "a",
          images: [{ imageId: "i1" }],
        },
      ],
      {
        previous: [
          {
            catalogFileId: "ceiling-lights-2026",
            catalogFileName: "Ceiling Lights 2026.pdf",
            displayName: "Ceiling 2026 (GlitterOn)",
            templateId: "glitteron-2026",
            status: "disabled",
            ingestedAt: "2025-06-01T00:00:00.000Z",
            productCount: 0,
            imageCount: 0,
            notes: "hold",
          },
        ],
      },
    );
    expect(manifest.catalogs[0].displayName).toBe("Ceiling 2026 (GlitterOn)");
    expect(manifest.catalogs[0].status).toBe("disabled");
    expect(manifest.catalogs[0].notes).toBe("hold");
    expect(manifest.catalogs[0].productCount).toBe(1);
  });
});
