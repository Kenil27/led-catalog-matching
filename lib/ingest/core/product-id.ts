export function slugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function catalogStemFromFileName(fileName: string): string {
  return slugPart(fileName.replace(/\.pdf$/i, ""));
}

export function makeProductId(input: {
  catalogStem: string;
  pageNumber: number;
  itemNo: string;
}): string {
  return `${input.catalogStem}-p${input.pageNumber}-${slugPart(input.itemNo)}`;
}

export function makeImageId(productId: string, contentHash: string): string {
  return `${productId}-${contentHash.slice(0, 12)}`;
}

export function pointIdFromContentHash(contentHash: string): string {
  const h = contentHash.padEnd(32, "0").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
