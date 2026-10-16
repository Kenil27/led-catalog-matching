import type { CatalogProduct, CatalogProductImage, CatalogTemplate, NormalizedCatalog } from "@/lib/ingest/core/types";
import { mapGlitteronPage } from "@/lib/ingest/templates/glitteron-2026/image-mapper";
import { parseGlitteronSpec } from "@/lib/ingest/templates/glitteron-2026/parser";
import { GLITTERON_FILE_PATTERN } from "@/lib/ingest/templates/glitteron-2026/rules";

export const glitteron2026Template: CatalogTemplate = {
  id: "glitteron-2026",
  matches(fileName: string) {
    return GLITTERON_FILE_PATTERN.test(fileName);
  },
  async normalize(extract, options): Promise<NormalizedCatalog> {
    const products: CatalogProduct[] = [];
    const images: CatalogProductImage[] = [];
    let imagesDiscovered = 0;
    let imagesRejected = 0;
    let pagesRendered = 0;

    for (const page of extract.pages) {
      imagesDiscovered += page.images.length;
      const spec = parseGlitteronSpec(page.lines, page.text);
      if (!spec) {
        imagesRejected += page.images.length;
        continue;
      }
      const mapped = await mapGlitteronPage({
        page,
        spec,
        catalogStem: options.catalogStem,
        catalogFileId: options.catalogFileId,
        catalogFileName: options.catalogFileName,
        destDir: options.extractedDir,
        renderPage: options.renderPage,
      });
      products.push(mapped.product);
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
