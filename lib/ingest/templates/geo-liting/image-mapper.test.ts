import { describe, expect, it } from "vitest";
import {
  assignImagesToSpecBlocks,
  assignSpreadHalves,
  classifyViews,
  isFullSpreadImage,
  isKeepableImage,
} from "@/lib/ingest/templates/geo-liting/image-mapper";
import type { RawEmbeddedImage, SpecBlock } from "@/lib/ingest/core/types";

function image(
  overrides: Partial<RawEmbeddedImage> & Pick<RawEmbeddedImage, "xref" | "bbox">,
): RawEmbeddedImage {
  return {
    width: 1800,
    height: 2400,
    byteSize: 800_000,
    ext: "jpeg",
    path: "/tmp/x.jpg",
    ...overrides,
  };
}

const leftSpec: SpecBlock = {
  itemNo: "A",
  extras: [],
  bbox: [100, 400, 300, 700],
};
const rightSpec: SpecBlock = {
  itemNo: "B",
  extras: [],
  bbox: [800, 400, 1100, 700],
};

describe("geo liting image mapping", () => {
  it("rejects icons and thin tiles", () => {
    expect(
      isKeepableImage(image({ xref: 1, bbox: [0, 0, 10, 10], width: 64, height: 64, byteSize: 2000 })),
    ).toBe(false);
    expect(
      isKeepableImage(image({ xref: 2, bbox: [0, 0, 10, 10], width: 18, height: 1788, byteSize: 80_000 })),
    ).toBe(false);
    expect(isKeepableImage(image({ xref: 3, bbox: [0, 0, 648, 864] }))).toBe(true);
  });

  it("assigns a single-product spread to that product", () => {
    const images = [
      image({ xref: 4, bbox: [0, 0, 648, 864] }),
      image({ xref: 6, bbox: [648, 0, 1296, 864] }),
    ];
    const assigned = assignImagesToSpecBlocks(images, [leftSpec]);
    expect(assigned.get(0)).toHaveLength(2);
  });

  it("maps left/right images to left/right spec blocks", () => {
    const left = image({ xref: 1, bbox: [0, 0, 648, 864] });
    const right = image({ xref: 2, bbox: [648, 0, 1296, 864] });
    const assigned = assignImagesToSpecBlocks([left, right], [leftSpec, rightSpec]);
    expect(assigned.get(0)?.[0].xref).toBe(1);
    expect(assigned.get(1)?.[0].xref).toBe(2);
  });

  it("labels the leftmost of two images as lifestyle", () => {
    const images = [
      image({ xref: 4, bbox: [0, 0, 648, 864] }),
      image({ xref: 6, bbox: [648, 0, 1296, 864] }),
    ];
    expect(classifyViews(images, 1296)).toEqual(["lifestyle", "studio"]);
  });

  it("detects a full-bleed spread and maps halves to left/right specs", () => {
    const spread = image({ xref: 216, bbox: [0, 0, 1296, 864], width: 1723, height: 1164 });
    expect(isFullSpreadImage(spread, 1296, 864)).toBe(true);
    expect(isFullSpreadImage(image({ xref: 4, bbox: [0, 0, 648, 864] }), 1296, 864)).toBe(false);
    const assignment = assignSpreadHalves([leftSpec, rightSpec], 1296);
    expect(assignment).toEqual({ left: 0, right: 1 });
  });
});
