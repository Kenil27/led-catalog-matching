import {
  catalogMediaUrl,
  getCatalogProduct,
  loadCatalog,
  type CatalogRecord,
} from "@/lib/catalog/store";
import type { PublicExampleQuery, PublicProduct } from "@/lib/catalog/public-types";

export type { PublicCatalogImage, PublicExampleQuery, PublicProduct } from "@/lib/catalog/public-types";

export function toPublicProduct(record: CatalogRecord): PublicProduct {
  return {
    productId: record.productId,
    itemNo: record.itemNo,
    sku: record.sku,
    productName: record.productName ?? record.itemNo,
    lamp: record.lamp,
    dimensions: record.dimensions,
    finish: record.finish,
    material: record.material,
    wattage: record.wattage,
    productCodes: record.productCodes,
    category: record.category,
    extras: record.extras,
    catalogFileName: record.catalogFileName,
    pageNumber: record.pageNumber,
    images: record.images.map((image) => ({
      imageId: image.imageId,
      view: image.view,
      url: catalogMediaUrl(image.imageId),
    })),
  };
}

export function getPublicProduct(productId: string): PublicProduct | undefined {
  const record = getCatalogProduct(productId);
  return record ? toPublicProduct(record) : undefined;
}

export function listExampleQueries(limit = 5): PublicExampleQuery[] {
  const byCatalog = new Map<string, CatalogRecord[]>();
  for (const record of loadCatalog()) {
    const list = byCatalog.get(record.catalogFileName) ?? [];
    list.push(record);
    byCatalog.set(record.catalogFileName, list);
  }

  const examples: PublicExampleQuery[] = [];
  for (const group of byCatalog.values()) {
    const product =
      group.find((item) => item.images.some((image) => image.view === "lifestyle")) ?? group[0];
    const image =
      product?.images.find((item) => item.view === "lifestyle") ?? product?.images[0];
    if (!product || !image) continue;
    examples.push({
      imageId: image.imageId,
      imageUrl: catalogMediaUrl(image.imageId),
      productName: product.productName ?? product.itemNo,
      category: product.category,
      catalogFileName: product.catalogFileName,
    });
    if (examples.length >= limit) break;
  }
  return examples;
}
