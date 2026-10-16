import { parseSpecBlocks } from "@/lib/ingest/templates/geo-liting/parser";
import { mapGeoLitingPage } from "@/lib/ingest/templates/geo-liting/image-mapper";
import { GEO_LITING_FILE_PATTERN } from "@/lib/ingest/templates/geo-liting/rules";
import type {
  CatalogProduct,
  CatalogProductImage,
  CatalogTemplate,
  NormalizedCatalog,
} from "@/lib/ingest/core/types";

export const geoLitingTemplate: CatalogTemplate = {
  id: "geo-liting",
  matches(fileName: string) {
    return GEO_LITING_FILE_PATTERN.test(fileName);
  },
  async normalize(extract, options): Promise<NormalizedCatalog> {
    const products: CatalogProduct[] = [];
    const images: CatalogProductImage[] = [];
    let imagesDiscovered = 0;
    let imagesRejected = 0;
    let pagesRendered = 0;

    for (const page of extract.pages) {
      imagesDiscovered += page.images.length;
      const specBlocks = parseSpecBlocks(page.lines, page.text);
      const mapped = await mapGeoLitingPage({
        page,
        specBlocks,
        catalogStem: options.catalogStem,
        catalogFileId: options.catalogFileId,
        catalogFileName: options.catalogFileName,
        destDir: options.extractedDir,
        renderPage: options.renderPage,
      });
      products.push(...mapped.products);
      images.push(...mapped.images);
      imagesRejected += mapped.rejected;
      if (mapped.rendered) pagesRendered += 1;
    }

    return {
      products,
      images,
      stats: {
        totalPages: extract.pageCount,
        imagesDiscovered,
        imagesRejected,
        productsDiscovered: products.length,
        productImagesMapped: images.length,
        pagesRendered,
      },
    };
  },
};
