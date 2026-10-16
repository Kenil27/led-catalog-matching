import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
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
import { inferCategory } from "@/lib/ingest/templates/geo-liting/parser";
import { GEO_LITING_RULES } from "@/lib/ingest/templates/geo-liting/rules";

export type MappedProductPage = {
  products: CatalogProduct[];
  images: CatalogProductImage[];
  discovered: number;
  rejected: number;
  rendered: boolean;
};

function bboxCenter(bbox: [number, number, number, number]): { x: number; y: number } {
  return { x: (bbox[0] + bbox[2]) / 2, y: (bbox[1] + bbox[3]) / 2 };
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isKeepableImage(image: RawEmbeddedImage): boolean {
  const minEdge = Math.min(image.width, image.height);
  if (minEdge < GEO_LITING_RULES.minPixelEdge) return false;
  if (image.byteSize < GEO_LITING_RULES.minBytes) return false;
  const maxEdge = Math.max(image.width, image.height);
  if (maxEdge / minEdge > GEO_LITING_RULES.maxAspectRatio) return false;
  return true;
}

export function isFullSpreadImage(
  image: RawEmbeddedImage,
  pageWidth: number,
  pageHeight: number,
): boolean {
  const w = image.bbox[2] - image.bbox[0];
  const h = image.bbox[3] - image.bbox[1];
  return w / pageWidth >= 0.85 && h / pageHeight >= 0.85 && image.byteSize >= GEO_LITING_RULES.minBytes;
}

export function assignSpreadHalves(
  specBlocks: SpecBlock[],
  pageWidth: number,
): { left: number; right: number } {
  if (specBlocks.length <= 1) return { left: 0, right: 0 };
  const nearest = (x: number) => {
    let best = 0;
    let bestD = Infinity;
    specBlocks.forEach((block, index) => {
      const d = Math.abs(bboxCenter(block.bbox).x - x);
      if (d < bestD) {
        bestD = d;
        best = index;
      }
    });
    return best;
  };
  return { left: nearest(pageWidth * 0.25), right: nearest(pageWidth * 0.75) };
}

export function assignImagesToSpecBlocks(
  images: RawEmbeddedImage[],
  specBlocks: SpecBlock[],
): Map<number, RawEmbeddedImage[]> {
  const assigned = new Map<number, RawEmbeddedImage[]>();
  for (let i = 0; i < specBlocks.length; i += 1) assigned.set(i, []);
  if (specBlocks.length === 0) return assigned;
  if (specBlocks.length === 1) {
    assigned.set(0, [...images]);
    return assigned;
  }
  for (const image of images) {
    const imageCenter = bboxCenter(image.bbox);
    let bestIndex = 0;
    let bestDistance = Infinity;
    specBlocks.forEach((block, index) => {
      const d = distance(imageCenter, bboxCenter(block.bbox));
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    assigned.get(bestIndex)?.push(image);
  }
  return assigned;
}

export function classifyViews(
  images: RawEmbeddedImage[],
  pageWidth: number,
): ProductView[] {
  if (images.length === 0) return [];
  if (images.length === 1) {
    const x = bboxCenter(images[0].bbox).x;
    return [x < pageWidth / 2 ? "lifestyle" : "studio"];
  }
  const indexed = images.map((image, index) => ({ index, x: bboxCenter(image.bbox).x }));
  indexed.sort((a, b) => a.x - b.x);
  const views: ProductView[] = Array(images.length).fill("studio");
  views[indexed[0].index] = "lifestyle";
  return views;
}

function mimeFromExt(ext: string): string {
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

async function copyHashedImage(sourcePath: string, destPath: string): Promise<{ hash: string; bytes: number }> {
  const bytes = await fs.readFile(sourcePath);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, bytes);
  return { hash: sha256Bytes(bytes), bytes: bytes.byteLength };
}

function toProduct(
  spec: SpecBlock,
  input: {
    catalogStem: string;
    catalogFileId: string;
    catalogFileName: string;
    pageNumber: number;
  },
): CatalogProduct {
  return {
    productId: makeProductId({
      catalogStem: input.catalogStem,
      pageNumber: input.pageNumber,
      itemNo: spec.itemNo,
    }),
    itemNo: spec.itemNo,
    sku: spec.sku,
    skuRaw: spec.skuRaw,
    productName: spec.itemNo,
    lamp: spec.lamp,
    dimensions: spec.dimensions,
    finish: spec.finish,
    material: spec.material,
    listPrice: spec.listPrice,
    category: inferCategory(spec.sku),
    extras: spec.extras,
    catalogFileId: input.catalogFileId,
    catalogFileName: input.catalogFileName,
    pageNumber: input.pageNumber,
  };
}

export async function mapGeoLitingPage(input: {
  page: RawCatalogPage;
  specBlocks: SpecBlock[];
  catalogStem: string;
  catalogFileId: string;
  catalogFileName: string;
  destDir: string;
  renderPage: (pageNumber: number) => Promise<PageRender>;
}): Promise<MappedProductPage> {
  const discovered = input.page.images.length;
  const keepable = input.page.images.filter(isKeepableImage);
  const rejectedEmbedded = discovered - keepable.length;
  const products = input.specBlocks.map((spec) =>
    toProduct(spec, {
      catalogStem: input.catalogStem,
      catalogFileId: input.catalogFileId,
      catalogFileName: input.catalogFileName,
      pageNumber: input.page.pageNumber,
    }),
  );

  if (products.length === 0) {
    return {
      products: [],
      images: [],
      discovered,
      rejected: discovered,
      rendered: false,
    };
  }

  const spreads = keepable.filter((image) =>
    isFullSpreadImage(image, input.page.width, input.page.height),
  );
  if (spreads.length > 0) {
    const source = [...spreads].sort((a, b) => b.byteSize - a.byteSize)[0];
    const images = await splitFullSpread({
      source,
      products,
      specBlocks: input.specBlocks,
      page: input.page,
      destDir: input.destDir,
    });
    return {
      products,
      images,
      discovered,
      rejected: discovered - 1,
      rendered: false,
    };
  }

  if (keepable.length > 0) {
    const assigned = assignImagesToSpecBlocks(keepable, input.specBlocks);
    const images: CatalogProductImage[] = [];
    for (const [specIndex, product] of products.entries()) {
      const group = assigned.get(specIndex) ?? [];
      const views = classifyViews(group, input.page.width);
      for (const [imageIndex, raw] of group.entries()) {
        const view = views[imageIndex] ?? "studio";
        const dest = path.join(
          input.destDir,
          product.productId,
          `${view}-${raw.xref}.${raw.ext === "png" ? "png" : "jpg"}`,
        );
        const { hash } = await copyHashedImage(raw.path, dest);
        images.push({
          imageId: makeImageId(product.productId, hash),
          productId: product.productId,
          view,
          imagePath: dest,
          mimeType: mimeFromExt(raw.ext),
          contentHash: hash,
          pageNumber: input.page.pageNumber,
          width: raw.width,
          height: raw.height,
        });
      }
    }
    return {
      products,
      images,
      discovered,
      rejected: rejectedEmbedded,
      rendered: false,
    };
  }

  const render = await input.renderPage(input.page.pageNumber);
  const images = await cropRenderedPage({
    render,
    products,
    specBlocks: input.specBlocks,
    page: input.page,
    destDir: input.destDir,
  });
  return {
    products,
    images,
    discovered,
    rejected: discovered,
    rendered: true,
  };
}

async function splitFullSpread(input: {
  source: RawEmbeddedImage;
  products: CatalogProduct[];
  specBlocks: SpecBlock[];
  page: RawCatalogPage;
  destDir: string;
}): Promise<CatalogProductImage[]> {
  const file = await fs.readFile(input.source.path);
  const meta = await sharp(file).metadata();
  const width = meta.width ?? input.source.width;
  const height = meta.height ?? input.source.height;
  const half = Math.floor(width / 2);
  const { left, right } = assignSpreadHalves(input.specBlocks, input.page.width);
  const parts: Array<{ specIndex: number; view: ProductView; left: number; width: number }> = [
    { specIndex: left, view: "lifestyle", left: 0, width: half },
    { specIndex: right, view: "studio", left: half, width: width - half },
  ];
  const images: CatalogProductImage[] = [];
  for (const part of parts) {
    const product = input.products[part.specIndex];
    if (!product) continue;
    const cropped = await sharp(file)
      .extract({ left: part.left, top: 0, width: part.width, height })
      .jpeg({ quality: 90 })
      .toBuffer();
    const dest = path.join(input.destDir, product.productId, `${part.view}-spread.jpg`);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, cropped);
    const hash = sha256Bytes(cropped);
    const outMeta = await sharp(cropped).metadata();
    images.push({
      imageId: makeImageId(product.productId, hash),
      productId: product.productId,
      view: part.view,
      imagePath: dest,
      mimeType: "image/jpeg",
      contentHash: hash,
      pageNumber: input.page.pageNumber,
      width: outMeta.width ?? part.width,
      height: outMeta.height ?? height,
    });
  }
  return images;
}

async function cropRenderedPage(input: {
  render: PageRender;
  products: CatalogProduct[];
  specBlocks: SpecBlock[];
  page: RawCatalogPage;
  destDir: string;
}): Promise<CatalogProductImage[]> {
  const scaleX = input.render.width / input.page.width;
  const scaleY = input.render.height / input.page.height;
  const images: CatalogProductImage[] = [];
  const file = await fs.readFile(input.render.imagePath);

  for (const [index, product] of input.products.entries()) {
    const spec = input.specBlocks[index];
    const center = bboxCenter(spec.bbox);
    const left = center.x < input.page.width / 2;
    const cropLeft = left ? 0 : Math.floor(input.render.width / 2);
    const cropWidth = Math.ceil(input.render.width / 2);
    const cropped = await sharp(file)
      .extract({
        left: cropLeft,
        top: 0,
        width: Math.min(cropWidth, input.render.width - cropLeft),
        height: input.render.height,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    const dest = path.join(input.destDir, product.productId, "page.jpg");
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, cropped);
    const hash = sha256Bytes(cropped);
    const meta = await sharp(cropped).metadata();
    images.push({
      imageId: makeImageId(product.productId, hash),
      productId: product.productId,
      view: "page",
      imagePath: dest,
      mimeType: "image/jpeg",
      contentHash: hash,
      pageNumber: input.page.pageNumber,
      width: meta.width ?? Math.round(input.page.width * scaleX),
      height: meta.height ?? Math.round(input.page.height * scaleY),
    });
  }
  return images;
}
