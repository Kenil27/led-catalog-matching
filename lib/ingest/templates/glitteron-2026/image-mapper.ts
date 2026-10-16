import fs from "node:fs/promises";
import path from "node:path";
import { sha256Bytes } from "@/lib/ingest/core/hash";
import { makeImageId, makeProductId } from "@/lib/ingest/core/product-id";
import type {
  CatalogProduct,
  CatalogProductImage,
  PageRender,
  ProductView,
  RawCatalogPage,
  RawEmbeddedImage,
  SpecBlock,
} from "@/lib/ingest/core/types";
import { inferGlitteronCategory } from "@/lib/ingest/templates/glitteron-2026/parser";
import { GLITTERON_RULES } from "@/lib/ingest/templates/glitteron-2026/rules";

function bboxArea(bbox: [number, number, number, number]): number {
  return Math.max(0, bbox[2] - bbox[0]) * Math.max(0, bbox[3] - bbox[1]);
}

function bboxCenter(bbox: [number, number, number, number]): { x: number; y: number } {
  return { x: (bbox[0] + bbox[2]) / 2, y: (bbox[1] + bbox[3]) / 2 };
}

export function uniqueLargestBbox(images: RawEmbeddedImage[]): RawEmbeddedImage[] {
  const best = new Map<number, RawEmbeddedImage>();
  for (const image of images) {
    const prev = best.get(image.xref);
    if (!prev || bboxArea(image.bbox) > bboxArea(prev.bbox)) {
      best.set(image.xref, image);
    }
  }
  return [...best.values()];
}

export function isKeepableGlitteronImage(image: RawEmbeddedImage, pageHeight: number): boolean {
  const minEdge = Math.min(image.width, image.height);
  if (minEdge <= GLITTERON_RULES.qrMaxEdge && image.width <= GLITTERON_RULES.qrMaxEdge) {
    return false;
  }
  if (image.bbox[1] > pageHeight * GLITTERON_RULES.footerYRatio) return false;
  if (minEdge < GLITTERON_RULES.minPixelEdge) return false;
  if (image.byteSize < GLITTERON_RULES.minBytes) return false;
  const maxEdge = Math.max(image.width, image.height);
  if (maxEdge / minEdge > GLITTERON_RULES.maxAspectRatio) return false;
  return true;
}

export function classifyGlitteronViews(images: RawEmbeddedImage[]): ProductView[] {
  if (images.length === 0) return [];
  if (images.length === 1) return ["studio"];
  const ranked = images
    .map((image, index) => ({ index, y: bboxCenter(image.bbox).y, area: bboxArea(image.bbox) }))
    .sort((a, b) => b.y - a.y || b.area - a.area);
  const views: ProductView[] = Array(images.length).fill("lifestyle");
  views[ranked[0].index] = "studio";
  return views;
}

function mimeFromExt(ext: string): string {
  return ext === "png" ? "image/png" : "image/jpeg";
}

export async function mapGlitteronPage(input: {
  page: RawCatalogPage;
  spec: SpecBlock;
  catalogStem: string;
  catalogFileId: string;
  catalogFileName: string;
  destDir: string;
  renderPage: (pageNumber: number) => Promise<PageRender>;
}): Promise<{ product: CatalogProduct; images: CatalogProductImage[]; discovered: number; rejected: number; rendered: boolean }> {
  const product: CatalogProduct = {
    productId: makeProductId({
      catalogStem: input.catalogStem,
      pageNumber: input.page.pageNumber,
      itemNo: input.spec.itemNo,
    }),
    itemNo: input.spec.itemNo,
    sku: input.spec.sku,
    skuRaw: input.spec.skuRaw,
    productName: input.spec.itemNo,
    lamp: input.spec.lamp,
    dimensions: input.spec.dimensions,
    finish: input.spec.finish,
    material: input.spec.material,
    wattage: input.spec.wattage,
    productCodes: input.spec.productCodes,
    category: inferGlitteronCategory(input.catalogFileName, input.spec.sku),
    extras: input.spec.extras,
    catalogFileId: input.catalogFileId,
    catalogFileName: input.catalogFileName,
    pageNumber: input.page.pageNumber,
  };

  const discovered = input.page.images.length;
  const keepable = uniqueLargestBbox(input.page.images).filter((image) =>
    isKeepableGlitteronImage(image, input.page.height),
  );

  if (keepable.length === 0) {
    const render = await input.renderPage(input.page.pageNumber);
    const file = await fs.readFile(render.imagePath);
    const cropHeight = Math.floor(render.height * 0.72);
    const sharp = (await import("sharp")).default;
    const cropped = await sharp(file)
      .extract({ left: 0, top: 0, width: render.width, height: cropHeight })
      .jpeg({ quality: 90 })
      .toBuffer();
    const dest = path.join(input.destDir, product.productId, "page.jpg");
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, cropped);
    const hash = sha256Bytes(cropped);
    return {
      product,
      images: [
        {
          imageId: makeImageId(product.productId, hash),
          productId: product.productId,
          view: "page",
          imagePath: dest,
          mimeType: "image/jpeg",
          contentHash: hash,
          pageNumber: input.page.pageNumber,
          width: render.width,
          height: cropHeight,
        },
      ],
      discovered,
      rejected: discovered,
      rendered: true,
    };
  }

  const views = classifyGlitteronViews(keepable);
  const images: CatalogProductImage[] = [];
  for (const [index, raw] of keepable.entries()) {
    const bytes = await fs.readFile(raw.path);
    const dest = path.join(
      input.destDir,
      product.productId,
      `${views[index]}-${raw.xref}.${raw.ext === "png" ? "png" : "jpg"}`,
    );
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, bytes);
    const hash = sha256Bytes(bytes);
    images.push({
      imageId: makeImageId(product.productId, hash),
      productId: product.productId,
      view: views[index] ?? "studio",
      imagePath: dest,
      mimeType: mimeFromExt(raw.ext),
      contentHash: hash,
      pageNumber: input.page.pageNumber,
      width: raw.width,
      height: raw.height,
    });
  }

  return {
    product,
    images,
    discovered,
    rejected: discovered - keepable.length,
    rendered: false,
  };
}
