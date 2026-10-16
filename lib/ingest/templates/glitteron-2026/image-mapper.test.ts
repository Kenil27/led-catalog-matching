import { describe, expect, it } from "vitest";
import {
  classifyGlitteronViews,
  isKeepableGlitteronImage,
  uniqueLargestBbox,
} from "@/lib/ingest/templates/glitteron-2026/image-mapper";
import type { RawEmbeddedImage } from "@/lib/ingest/core/types";

function image(overrides: Partial<RawEmbeddedImage> & Pick<RawEmbeddedImage, "xref" | "bbox">): RawEmbeddedImage {
  return {
    width: 900,
    height: 700,
    byteSize: 80_000,
    ext: "jpeg",
    path: "/tmp/x.jpg",
    ...overrides,
  };
}

describe("glitteron image mapping", () => {
  it("drops QR codes and keeps product photos", () => {
    expect(
      isKeepableGlitteronImage(image({ xref: 1, bbox: [422, 694, 490, 761], width: 200, height: 200 }), 842),
    ).toBe(false);
    expect(
      isKeepableGlitteronImage(image({ xref: 2, bbox: [102, 343, 493, 603], width: 1076, height: 717 }), 842),
    ).toBe(true);
  });

  it("keeps the larger bbox when a xref is placed twice", () => {
    const unique = uniqueLargestBbox([
      image({ xref: 2988, bbox: [268, 182, 522, 352] }),
      image({ xref: 2988, bbox: [4, 0, 707, 506] }),
    ]);
    expect(unique).toHaveLength(1);
    expect(unique[0].bbox[2]).toBe(707);
  });

  it("labels the lowest photo as studio", () => {
    const images = [
      image({ xref: 1, bbox: [90, 78, 300, 350] }),
      image({ xref: 2, bbox: [102, 343, 493, 603] }),
    ];
    expect(classifyGlitteronViews(images)).toEqual(["lifestyle", "studio"]);
  });
});
