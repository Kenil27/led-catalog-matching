import { describe, expect, it } from "vitest";
import {
  detectExtras,
  inferCategory,
  parseSku,
  parseSpecBlocks,
} from "@/lib/ingest/templates/geo-liting/parser";
import type { RawTextLine } from "@/lib/ingest/core/types";

function lines(texts: string[]): RawTextLine[] {
  return texts.map((text, index) => ({
    text,
    bbox: [10, index * 12, 200, index * 12 + 10],
  }));
}

describe("SKU parsing", () => {
  it("splits glued SKU and list price", () => {
    expect(parseSku("Y50LTFL220000")).toEqual({
      sku: "Y50LTFL",
      listPrice: "220000",
      skuRaw: "Y50LTFL220000",
    });
    expect(parseSku("Y97700TB40000")).toEqual({
      sku: "Y97700TB",
      listPrice: "40000",
      skuRaw: "Y97700TB40000",
    });
    expect(parseSku("Z3204FL76000")).toEqual({
      sku: "Z3204FL",
      listPrice: "76000",
      skuRaw: "Z3204FL76000",
    });
  });

  it("keeps a standalone SKU", () => {
    expect(parseSku("Y019210FL")).toEqual({
      sku: "Y019210FL",
      skuRaw: "Y019210FL",
    });
  });
});

describe("spec blocks", () => {
  it("parses a single Geo Liting spec block", () => {
    const blocks = parseSpecBlocks(
      lines([
        "Item No : 012910",
        "Lamp : Led",
        "Size : D350MM X H1220MM",
        "Finish : Brown",
        "Material : Metal + Pla",
        "240000",
        "SKU : Y019210FL",
      ]),
      "",
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      itemNo: "012910",
      lamp: "Led",
      dimensions: "D350MM X H1220MM",
      finish: "Brown",
      material: "Metal + Pla",
      listPrice: "240000",
      sku: "Y019210FL",
    });
  });

  it("parses two products on one page", () => {
    const blocks = parseSpecBlocks(
      lines([
        "Item No : 093",
        "SKU : Y390FL280000",
        "Item No : 091",
        "SKU : Y190FL280000",
      ]),
      "Wirless Charger USB",
    );
    expect(blocks.map((block) => block.itemNo)).toEqual(["093", "091"]);
    expect(blocks[0].sku).toBe("Y390FL");
    expect(blocks[0].listPrice).toBe("280000");
    expect(blocks[0].extras).toEqual(["usb", "wirelessCharger"]);
  });
});

describe("category and extras", () => {
  it("infers floor vs table from SKU suffix", () => {
    expect(inferCategory("Y019210FL")).toBe("floor");
    expect(inferCategory("Y97700TB")).toBe("table");
    expect(inferCategory("Y50LTFL")).toBe("floor");
    expect(inferCategory(undefined)).toBe("unknown");
  });

  it("detects USB/wireless extras", () => {
    expect(detectExtras("Wirless Charger")).toEqual(["wirelessCharger"]);
    expect(detectExtras("USB")).toEqual(["usb"]);
  });
});
