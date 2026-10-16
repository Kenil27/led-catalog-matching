import { describe, expect, it } from "vitest";
import { buildCatalogRecords } from "@/lib/catalog/store";
import type { CatalogProduct, CatalogProductImage } from "@/lib/ingest/core/types";

describe("catalog store", () => {
  it("groups images under each product record", () => {
    const products: CatalogProduct[] = [
      {
        productId: "p1",
        itemNo: "LM8302",
        sku: "CLD9AAAGL",
        category: "ceiling",
        extras: [],
        catalogFileId: "ceiling",
        catalogFileName: "Ceiling Lights 2026.pdf",
        pageNumber: 20,
      },
    ];
    const images: CatalogProductImage[] = [
      {
        imageId: "p1-a",
        productId: "p1",
        view: "lifestyle",
        imagePath: "/a.jpg",
        mimeType: "image/jpeg",
        contentHash: "aaa",
        pageNumber: 20,
        width: 100,
        height: 100,
      },
      {
        imageId: "p1-b",
        productId: "p1",
        view: "studio",
        imagePath: "/b.jpg",
        mimeType: "image/jpeg",
        contentHash: "bbb",
        pageNumber: 20,
        width: 100,
        height: 100,
      },
    ];
    const records = buildCatalogRecords(products, images);
    expect(records).toHaveLength(1);
    expect(records[0].images.map((image) => image.view)).toEqual(["lifestyle", "studio"]);
  });
});

describe("catalog media path", () => {
  it("rejects paths outside the extracted directory", async () => {
    const { resolveCatalogMediaPath } = await import("@/lib/catalog/store");
    expect(resolveCatalogMediaPath("/tmp/secret.jpg")).toBeUndefined();
  });
});
