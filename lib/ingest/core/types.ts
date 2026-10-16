export type ProductView = "lifestyle" | "studio" | "page";
export type ProductCategory = "floor" | "table" | "ceiling" | "chandelier" | "unknown";

export type SpecBlock = {
  itemNo: string;
  sku?: string;
  skuRaw?: string;
  lamp?: string;
  dimensions?: string;
  finish?: string;
  material?: string;
  wattage?: string;
  listPrice?: string;
  productCodes?: string[];
  extras: string[];
  bbox: [number, number, number, number];
};

export type RawTextLine = {
  text: string;
  bbox: [number, number, number, number];
};

export type RawEmbeddedImage = {
  xref: number;
  bbox: [number, number, number, number];
  width: number;
  height: number;
  byteSize: number;
  ext: string;
  path: string;
};

export type RawCatalogPage = {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  lines: RawTextLine[];
  images: RawEmbeddedImage[];
};

export type RawCatalogExtract = {
  pdfPath: string;
  fileName: string;
  pageCount: number;
  pages: RawCatalogPage[];
};

export type CatalogProduct = {
  productId: string;
  itemNo: string;
  sku?: string;
  skuRaw?: string;
  productName?: string;
  lamp?: string;
  dimensions?: string;
  finish?: string;
  material?: string;
  wattage?: string;
  listPrice?: string;
  productCodes?: string[];
  category: ProductCategory;
  extras: string[];
  catalogFileId: string;
  catalogFileName: string;
  pageNumber: number;
};

export type CatalogProductImage = {
  imageId: string;
  productId: string;
  view: ProductView;
  imagePath: string;
  mimeType: string;
  contentHash: string;
  pageNumber: number;
  width: number;
  height: number;
};

export type NormalizedCatalog = {
  products: CatalogProduct[];
  images: CatalogProductImage[];
  stats: IngestExtractStats;
};

export type IngestExtractStats = {
  totalPages: number;
  imagesDiscovered: number;
  imagesRejected: number;
  productsDiscovered: number;
  productImagesMapped: number;
  pagesRendered: number;
};

export type CatalogTemplate = {
  id: string;
  matches(fileName: string): boolean;
  normalize(extract: RawCatalogExtract, options: TemplateNormalizeOptions): Promise<NormalizedCatalog>;
};

export type TemplateNormalizeOptions = {
  catalogFileId: string;
  catalogFileName: string;
  catalogStem: string;
  extractedDir: string;
  renderPage: (pageNumber: number) => Promise<PageRender>;
};

export type PageRender = {
  pageNumber: number;
  imagePath: string;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
};

export type IngestRunStats = IngestExtractStats & {
  embeddingsGenerated: number;
  duplicatesSkipped: number;
  failures: number;
};
