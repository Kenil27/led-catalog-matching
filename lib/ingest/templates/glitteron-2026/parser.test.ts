import { describe, expect, it } from "vitest";
import { inferGlitteronCategory, parseGlitteronSpec, parseProductCodes } from "@/lib/ingest/templates/glitteron-2026/parser";
import type { RawTextLine } from "@/lib/ingest/core/types";

function lines(texts: string[]): RawTextLine[] {
  return texts.map((text, index) => ({ text, bbox: [10, index * 12, 400, index * 12 + 10] }));
}

describe("glitteron parser", () => {
  it("parses product codes and model name", () => {
    const spec = parseGlitteronSpec(
      lines([
        "Tap or Scan",
        "Size - D330/430/530mm",
        "Material - Acrylic + Metal",
        "Body Colour -White+Wooden",
        "Light Source - LED 3 in 1",
        "Wattage -21W,36W,60W",
        "Product Code : CLD9AAAGL / CLD126AAGL /CLD144AAGL",
        "LM8302",
      ]),
      "Product Code : CLD9AAAGL / CLD126AAGL /CLD144AAGL\nLM8302",
    );
    expect(spec?.itemNo).toBe("LM8302");
    expect(spec?.sku).toBe("CLD9AAAGL");
    expect(spec?.productCodes).toEqual(["CLD9AAAGL", "CLD126AAGL", "CLD144AAGL"]);
    expect(spec?.wattage).toBe("21W,36W,60W");
    expect(spec?.dimensions).toBe("D330/430/530mm");
  });

  it("parses chandelier codes", () => {
    expect(parseProductCodes("CHLD36AAAGL / CHLD45AAAGL")).toEqual(["CHLD36AAAGL", "CHLD45AAAGL"]);
  });

  it("infers category from file or SKU prefix", () => {
    expect(inferGlitteronCategory("Ceiling Lights 2026.pdf", "CLD9AAAGL")).toBe("ceiling");
    expect(inferGlitteronCategory("Chandelier Lights Luxe 2026.pdf", "CHLD226AAGL")).toBe("chandelier");
    expect(inferGlitteronCategory("Floor Lamp 2026.pdf", "FLD18AAAGL")).toBe("floor");
  });

  it("ignores index pages without a product code", () => {
    expect(parseGlitteronSpec(lines(["CEILING LIGHTS"]), "CEILING LIGHTS")).toBeUndefined();
  });

  it("prefers product code over a size-like first line", () => {
    const spec = parseGlitteronSpec(
      lines(["D520x520x70mm", "Product Code : CLD9AAAGL", "Size - D520x520x70mm"]),
      "Product Code : CLD9AAAGL\nD520x520x70mm",
    );
    expect(spec?.itemNo).toBe("CLD9AAAGL");
    expect(spec?.sku).toBe("CLD9AAAGL");
  });

  it("prefers product code over a marketing line", () => {
    const spec = parseGlitteronSpec(
      lines(["(Human Centric Bluetooth )", "Product Code : CLD375AAGL"]),
      "Product Code : CLD375AAGL\n(Human Centric Bluetooth )",
    );
    expect(spec?.itemNo).toBe("CLD375AAGL");
  });

  it("keeps model names that start with D but are not sizes", () => {
    const spec = parseGlitteronSpec(
      lines(["D654-5", "Product Code : CHLD36AAAGL"]),
      "Product Code : CHLD36AAAGL\nD654-5",
    );
    expect(spec?.itemNo).toBe("D654-5");
  });
});
