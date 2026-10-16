import type { ProductCategory, RawTextLine, SpecBlock } from "@/lib/ingest/core/types";

const SIZE_RE = /^size\s*[-:]?\s*(.*)$/i;
const MATERIAL_RE = /^material\s*[-:]?\s*(.*)$/i;
const COLOUR_RE = /^body\s*colou?r\s*[-:]?\s*(.*)$/i;
const LIGHT_RE = /^light\s*source\s*[-:]?\s*(.*)$/i;
const WATTAGE_RE = /^wattage\s*[-:]?\s*(.*)$/i;
const CODE_RE = /^product\s*code\s*[-:]?\s*(.*)$/i;
const SKIP_RE = /^(tap or scan|features\s*[-:])/i;
const CODE_TOKEN_RE = /[A-Z]{2,}\d+[A-Z0-9]*/g;
const SIZE_LIKE_RE = /\d+\s*mm\b|\d+[x×]\d+/i;
const MARKETING_RE = /bluetooth|human centric|dimmable|tuya|smart control|tap or scan/i;

export function isGlitteronProductPage(text: string): boolean {
  return /product\s*code/i.test(text);
}

export function parseProductCodes(raw: string): string[] {
  const tokens = raw.match(CODE_TOKEN_RE) ?? [];
  return [...new Set(tokens.map((token) => token.toUpperCase()))];
}

export function inferGlitteronCategory(fileName: string, sku?: string): ProductCategory {
  if (/chandelier/i.test(fileName) || sku?.startsWith("CHLD")) return "chandelier";
  if (/ceiling/i.test(fileName) || sku?.startsWith("CLD")) return "ceiling";
  if (/floor/i.test(fileName) || sku?.startsWith("FLD")) return "floor";
  return "unknown";
}

function labeledValue(re: RegExp, lines: string[]): string | undefined {
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(re);
    if (!match) continue;
    const inline = match[1].trim();
    if (inline) return inline.replace(/\s+/g, " ");
    const next = lines[i + 1]?.trim();
    if (next && !/^(size|material|body|light|wattage|product|tap|features)/i.test(next)) {
      return next.replace(/\s+/g, " ");
    }
  }
  return undefined;
}

export function parseGlitteronSpec(lines: RawTextLine[], pageText: string): SpecBlock | undefined {
  if (!isGlitteronProductPage(pageText)) return undefined;
  const texts = lines.map((line) => line.text.trim()).filter(Boolean);
  const codeLine = texts.find((line) => CODE_RE.test(line)) ?? "";
  const codes = parseProductCodes(codeLine.replace(CODE_RE, "$1"));
  const modelLines = texts.filter((line) => {
    if (SKIP_RE.test(line)) return false;
    if (SIZE_RE.test(line) || MATERIAL_RE.test(line) || COLOUR_RE.test(line)) return false;
    if (LIGHT_RE.test(line) || WATTAGE_RE.test(line) || CODE_RE.test(line)) return false;
    return /[A-Z0-9]/.test(line) && line.length <= 40;
  });
  const named = modelLines.filter((line) => !SIZE_LIKE_RE.test(line) && !MARKETING_RE.test(line));
  const itemNo = (named[0] ?? codes[0] ?? modelLines[0] ?? "").trim();
  if (!itemNo) return undefined;

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

  return {
    itemNo,
    sku: codes[0],
    skuRaw: codes.join(" / "),
    productCodes: codes,
    dimensions: labeledValue(SIZE_RE, texts),
    material: labeledValue(MATERIAL_RE, texts),
    finish: labeledValue(COLOUR_RE, texts),
    lamp: labeledValue(LIGHT_RE, texts),
    wattage: labeledValue(WATTAGE_RE, texts),
    extras: /tuya|remote|dimmable|bluetooth/i.test(pageText) ? ["smartControl"] : [],
    bbox: Number.isFinite(x0) ? [x0, y0, x1, y1] : [0, 0, 0, 0],
  };
}
