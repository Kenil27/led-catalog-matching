import { describe, expect, it } from "vitest";
import { assetKeyFromImagePath, publicAssetUrl } from "@/lib/catalog/asset-path";

describe("asset paths", () => {
  it("strips data/extracted prefix", () => {
    expect(
      assetKeyFromImagePath("data/extracted/products/foo-p1-a/studio-1.jpg"),
    ).toBe("products/foo-p1-a/studio-1.jpg");
  });

  it("joins base URL", () => {
    expect(publicAssetUrl("https://cdn.example/led", "products/a.jpg")).toBe(
      "https://cdn.example/led/products/a.jpg",
    );
  });
});
