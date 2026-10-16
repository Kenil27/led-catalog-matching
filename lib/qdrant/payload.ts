import type { CatalogProduct, CatalogProductImage, ProductView } from "@/lib/ingest/core/types";

export type ProductImagePayload = {
  productId: string;
  imageId: string;
  view: ProductView;
  sku?: string;
  itemNo?: string;
  productName?: string;
  lamp?: string;
  dimensions?: string;
  finish?: string;
  material?: string;
  wattage?: string;
  listPrice?: string;
  productCodes?: string[];
  category?: string;
  extras?: string[];
  catalogFileId: string;
  catalogFileName: string;
  pageNumber: number;
  imagePath: string;
  embeddingModel: string;
  contentHash: string;
};

export function toPointPayload(
  product: CatalogProduct,
  image: CatalogProductImage,
  embeddingModel: string,
): ProductImagePayload {
  return {
    productId: product.productId,
    imageId: image.imageId,
    view: image.view,
    sku: product.sku,
    itemNo: product.itemNo,
    productName: product.productName,
    lamp: product.lamp,
    dimensions: product.dimensions,
    finish: product.finish,
    material: product.material,
    wattage: product.wattage,
    listPrice: product.listPrice,
    productCodes: product.productCodes,
    category: product.category,
    extras: product.extras,
    catalogFileId: product.catalogFileId,
    catalogFileName: product.catalogFileName,
    pageNumber: product.pageNumber,
    imagePath: image.imagePath,
    embeddingModel,
    contentHash: image.contentHash,
  };
}

export function payloadFromUnknown(payload: Record<string, unknown> | null | undefined): ProductImagePayload {
  if (!payload) {
    throw new Error("Qdrant point is missing payload.");
  }
  const productId = String(payload.productId ?? "");
  const imageId = String(payload.imageId ?? "");
  if (!productId || !imageId) {
    throw new Error("Qdrant payload is missing productId or imageId.");
  }
  return {
    productId,
    imageId,
    view: (payload.view as ProductImagePayload["view"]) ?? "studio",
    sku: payload.sku ? String(payload.sku) : undefined,
    itemNo: payload.itemNo ? String(payload.itemNo) : undefined,
    productName: payload.productName ? String(payload.productName) : undefined,
    lamp: payload.lamp ? String(payload.lamp) : undefined,
    dimensions: payload.dimensions ? String(payload.dimensions) : undefined,
    finish: payload.finish ? String(payload.finish) : undefined,
    material: payload.material ? String(payload.material) : undefined,
    wattage: payload.wattage ? String(payload.wattage) : undefined,
    listPrice: payload.listPrice ? String(payload.listPrice) : undefined,
    productCodes: Array.isArray(payload.productCodes) ? payload.productCodes.map(String) : undefined,
    category: payload.category ? String(payload.category) : undefined,
    extras: Array.isArray(payload.extras) ? payload.extras.map(String) : undefined,
    catalogFileId: String(payload.catalogFileId ?? ""),
    catalogFileName: String(payload.catalogFileName ?? ""),
    pageNumber: Number(payload.pageNumber ?? 0),
    imagePath: String(payload.imagePath ?? ""),
    embeddingModel: String(payload.embeddingModel ?? ""),
    contentHash: String(payload.contentHash ?? ""),
  };
}
