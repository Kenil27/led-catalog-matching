import { afterEach, describe, expect, it } from "vitest";
import { toPublicProduct } from "@/lib/catalog/public";
import type { CatalogRecord } from "@/lib/catalog/store";
import { resetCatalogCacheForTests, seedCatalogCacheForTests } from "@/lib/catalog/store";

describe("public product", () => {
  afterEach(() => resetCatalogCacheForTests());

  it("omits list price and filesystem paths", () => {
    const record = {
      productId: "p1",
      itemNo: "LM8302",
      sku: "CLD9AAAGL",
      listPrice: "240000",
      category: "ceiling",
      extras: [],
      catalogFileId: "ceiling",
      catalogFileName: "Ceiling Lights 2026.pdf",
      pageNumber: 20,
      images: [
        {
          imageId: "img-1",
          view: "studio",
          imagePath: "/secret/extracted/products/p1/studio.jpg",
          contentHash: "aaa",
        },
      ],
    } as CatalogRecord;

    seedCatalogCacheForTests([record]);
    const publicProduct = toPublicProduct(record);
    expect(publicProduct).not.toHaveProperty("listPrice");
    expect(JSON.stringify(publicProduct)).not.toContain("/secret/");
    expect(publicProduct.images[0].url).toBe("/api/media/img-1");
  });
});
