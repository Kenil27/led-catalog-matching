import { describe, expect, it } from "vitest";
import {
  catalogStemFromFileName,
  makeImageId,
  makeProductId,
  pointIdFromContentHash,
  slugPart,
} from "@/lib/ingest/core/product-id";

describe("product id", () => {
  it("slugs item numbers", () => {
    expect(slugPart("0046-T GR")).toBe("0046-t-gr");
  });

  it("uses catalog + page + itemNo, not SKU", () => {
    expect(
      makeProductId({
        catalogStem: catalogStemFromFileName("Geo Liting Floor & Table Lamps.pdf"),
        pageNumber: 2,
        itemNo: "012910",
      }),
    ).toBe("geo-liting-floor-table-lamps-p2-012910");
  });

  it("keeps colliding SKUs as distinct products", () => {
    const a = makeProductId({ catalogStem: "geo", pageNumber: 29, itemNo: "3150-WH" });
    const b = makeProductId({ catalogStem: "geo", pageNumber: 34, itemNo: "4032-F" });
    expect(a).not.toBe(b);
  });

  it("derives a UUID-shaped point id from the content hash", () => {
    const id = pointIdFromContentHash("a".repeat(64));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(makeImageId("prod", "abcdef1234567890")).toBe("prod-abcdef123456");
  });
});
