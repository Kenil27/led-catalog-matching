import type { RawTextLine, SpecBlock } from "@/lib/ingest/core/types";

const ITEM_NO_RE = /^item\s*no\s*:?\s*(.+)$/i;
const LAMP_RE = /^lamp\s*:?\s*(.+)$/i;
const SIZE_RE = /^size\s*:?\s*(.+)$/i;
const FINISH_RE = /^finish\s*:?\s*(.+)$/i;
const MATERIAL_RE = /^material\s*:?\s*(.+)$/i;
const SKU_RE = /^sku\s*:?\s*(.+)$/i;
const PRICE_LINE_RE = /^\d{4,7}$/;
const GLUED_SKU_RE = /^([A-Z0-9-]+?(?:LTFL|FL|TB))(\d{4,})$/i;

export type ParsedSku = {
  sku: string;
  listPrice?: string;
  skuRaw: string;
};

export function parseSku(raw: string): ParsedSku {
  const skuRaw = raw.trim();
  const glued = skuRaw.match(GLUED_SKU_RE);
  if (glued) {
    return {
      sku: glued[1].toUpperCase(),
      listPrice: glued[2],
      skuRaw,
    };
  }
  return { sku: skuRaw.toUpperCase(), skuRaw };
}

export function inferCategory(sku: string | undefined): "floor" | "table" | "unknown" {
  if (!sku) return "unknown";
  const upper = sku.toUpperCase();
  if (upper.endsWith("TB")) return "table";
  if (upper.endsWith("FL")) return "floor";
  return "unknown";
}

export function detectExtras(text: string): string[] {
  const extras: string[] = [];
  if (/\bUSB\b/i.test(text)) extras.push("usb");
  if (/wirl?ess/i.test(text)) extras.push("wirelessCharger");
  return extras;
}

function unionBbox(lines: RawTextLine[]): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const line of lines) {
    x0 = Math.min(x0, line.bbox[0]);
    y0 = Math.min(y0, line.bbox[1]);
    x1 = Math.max(x1, line.bbox[2]);
    y1 = Math.max(y1, line.bbox[3]);
  }
  if (!Number.isFinite(x0)) return [0, 0, 0, 0];
  return [x0, y0, x1, y1];
}

function applyLabeledLine(block: SpecBlock, text: string): boolean {
  let match = text.match(ITEM_NO_RE);
  if (match) {
    block.itemNo = match[1].trim();
    return true;
  }
  match = text.match(LAMP_RE);
  if (match) {
    block.lamp = match[1].trim();
    return true;
  }
  match = text.match(SIZE_RE);
  if (match) {
    block.dimensions = match[1].trim();
    return true;
  }
  match = text.match(FINISH_RE);
  if (match) {
    block.finish = match[1].trim();
    return true;
  }
  match = text.match(MATERIAL_RE);
  if (match) {
    block.material = match[1].trim();
    return true;
  }
  match = text.match(SKU_RE);
  if (match) {
    const parsed = parseSku(match[1]);
    block.sku = parsed.sku;
    block.skuRaw = parsed.skuRaw;
    if (parsed.listPrice) block.listPrice = parsed.listPrice;
    return true;
  }
  if (PRICE_LINE_RE.test(text.trim())) {
    if (!block.listPrice) block.listPrice = text.trim();
    return true;
  }
  return false;
}

export function parseSpecBlocks(lines: RawTextLine[], pageText: string): SpecBlock[] {
  const extras = detectExtras(pageText);
  const blocks: SpecBlock[] = [];
  let current: { spec: SpecBlock; lines: RawTextLine[] } | undefined;

  const flush = () => {
    if (!current?.spec.itemNo) {
      current = undefined;
      return;
    }
    current.spec.bbox = unionBbox(current.lines);
    current.spec.extras = extras;
    blocks.push(current.spec);
    current = undefined;
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;
    if (ITEM_NO_RE.test(text)) {
      flush();
      current = {
        spec: {
          itemNo: "",
          extras: [],
          bbox: line.bbox,
        },
        lines: [line],
      };
      applyLabeledLine(current.spec, text);
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
    applyLabeledLine(current.spec, text);
  }
  flush();
  return blocks;
}
