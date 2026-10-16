import type { ProductCategory, ProductView } from "@/lib/ingest/core/types";

export type PublicCatalogImage = {
  imageId: string;
  view: ProductView;
  url: string;
};

export type PublicProduct = {
  productId: string;
  itemNo: string;
  sku?: string;
  productName: string;
  lamp?: string;
  dimensions?: string;
  finish?: string;
  material?: string;
  wattage?: string;
  productCodes?: string[];
  category: ProductCategory;
  extras: string[];
  catalogFileName: string;
  pageNumber: number;
  images: PublicCatalogImage[];
};

export type PublicExampleQuery = {
  imageId: string;
  imageUrl: string;
  productName: string;
  category: ProductCategory;
  catalogFileName: string;
};
