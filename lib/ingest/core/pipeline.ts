import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCatalogRecords, saveCatalog } from "@/lib/catalog/store";
import { appConfig } from "@/lib/config";
import type { EmbeddingProvider } from "@/lib/embeddings/types";
import { hashKey, partitionByHash } from "@/lib/ingest/core/hash";
import { catalogStemFromFileName, pointIdFromContentHash } from "@/lib/ingest/core/product-id";
import { resolveCatalogTemplate } from "@/lib/ingest/core/template-registry";
import type {
  IngestRunStats,
  NormalizedCatalog,
  PageRender,
  RawCatalogExtract,
} from "@/lib/ingest/core/types";
import { ensureCollection, getQdrantClient, listedIndexedHashKeys } from "@/lib/qdrant/collection";
import { toPointPayload } from "@/lib/qdrant/payload";
import { GEO_LITING_RULES } from "@/lib/ingest/templates/geo-liting/rules";

function pythonBin(): string {
  const venv = path.join(process.cwd(), ".venv", "bin", "python");
  return existsSync(venv) ? venv : "python3";
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

export async function extractPdfRaw(pdfPath: string, outDir: string): Promise<RawCatalogExtract> {
  await fs.mkdir(outDir, { recursive: true });
  await runCommand(pythonBin(), [path.join(process.cwd(), "scripts/extract_pdf.py"), "extract", pdfPath, outDir]);
  const raw = JSON.parse(await fs.readFile(path.join(outDir, "raw.json"), "utf8")) as RawCatalogExtract;
  return raw;
}

async function renderPages(pdfPath: string, outDir: string, pages: number[]): Promise<Map<number, PageRender>> {
  const map = new Map<number, PageRender>();
  if (pages.length === 0) return map;
  await runCommand(pythonBin(), [
    path.join(process.cwd(), "scripts/extract_pdf.py"),
    "render",
    pdfPath,
    outDir,
    "--pages",
    pages.join(","),
    "--dpi",
    String(GEO_LITING_RULES.renderFallbackDpi),
  ]);
  const rendered = JSON.parse(await fs.readFile(path.join(outDir, "renders.json"), "utf8")) as PageRender[];
  for (const item of rendered) map.set(item.pageNumber, item);
  return map;
}

export async function normalizeCatalog(pdfPath: string): Promise<NormalizedCatalog> {
  const fileName = path.basename(pdfPath);
  const template = resolveCatalogTemplate(fileName);
  const stem = catalogStemFromFileName(fileName);
  const rawDir = path.join(appConfig.extractedDir, "_raw", stem);
  const productDir = path.join(appConfig.extractedDir, "products");
  const extract = await extractPdfRaw(pdfPath, rawDir);
  const pendingRenders = new Map<number, Promise<PageRender>>();

  const getRender = async (pageNumber: number): Promise<PageRender> => {
    const existing = pendingRenders.get(pageNumber);
    if (existing) return existing;
    const job = renderPages(pdfPath, rawDir, [pageNumber]).then((map) => {
      const page = map.get(pageNumber);
      if (!page) throw new Error(`Missing render for page ${pageNumber}`);
      return page;
    });
    pendingRenders.set(pageNumber, job);
    return job;
  };

  return template.normalize(extract, {
    catalogFileId: stem,
    catalogFileName: fileName,
    catalogStem: stem,
    extractedDir: productDir,
    renderPage: getRender,
  });
}

export async function writeCatalogSidecars(catalog: NormalizedCatalog): Promise<void> {
  await fs.mkdir(appConfig.extractedDir, { recursive: true });
  await fs.writeFile(
    path.join(appConfig.extractedDir, "products.jsonl"),
    catalog.products.map((product) => JSON.stringify(product)).join("\n") + (catalog.products.length ? "\n" : ""),
  );
  await fs.writeFile(
    path.join(appConfig.extractedDir, "product-images.jsonl"),
    catalog.images.map((image) => JSON.stringify(image)).join("\n") + (catalog.images.length ? "\n" : ""),
  );
  await saveCatalog(buildCatalogRecords(catalog.products, catalog.images));
}

export function mergeNormalizedCatalogs(catalogs: NormalizedCatalog[]): NormalizedCatalog {
  return {
    products: catalogs.flatMap((catalog) => catalog.products),
    images: catalogs.flatMap((catalog) => catalog.images),
    stats: {
      totalPages: catalogs.reduce((sum, catalog) => sum + catalog.stats.totalPages, 0),
      imagesDiscovered: catalogs.reduce((sum, catalog) => sum + catalog.stats.imagesDiscovered, 0),
      imagesRejected: catalogs.reduce((sum, catalog) => sum + catalog.stats.imagesRejected, 0),
      productsDiscovered: catalogs.reduce((sum, catalog) => sum + catalog.stats.productsDiscovered, 0),
      productImagesMapped: catalogs.reduce((sum, catalog) => sum + catalog.stats.productImagesMapped, 0),
      pagesRendered: catalogs.reduce((sum, catalog) => sum + catalog.stats.pagesRendered, 0),
    },
  };
}

export async function indexNormalizedCatalog(
  catalog: NormalizedCatalog,
  embeddingProvider: EmbeddingProvider,
): Promise<IngestRunStats> {
  const stats: IngestRunStats = {
    ...catalog.stats,
    embeddingsGenerated: 0,
    duplicatesSkipped: 0,
    failures: 0,
  };
  if (catalog.images.length === 0) return stats;

  const qdrant = getQdrantClient();
  let indexed = new Set<string>();
  try {
    indexed = await listedIndexedHashKeys(embeddingProvider.modelId);
  } catch {
    indexed = new Set();
  }
  const { toEmbed, skipped } = partitionByHash(catalog.images, indexed, embeddingProvider.modelId);
  stats.duplicatesSkipped = skipped.length;

  const productsById = new Map(catalog.products.map((product) => [product.productId, product]));
  for (const image of skipped) {
    const product = productsById.get(image.productId);
    if (!product) {
      stats.failures += 1;
      continue;
    }
    try {
      await qdrant.setPayload(appConfig.qdrantCollection, {
        wait: true,
        payload: toPointPayload(product, image, embeddingProvider.modelId),
        points: [pointIdFromContentHash(image.contentHash)],
      });
    } catch (error) {
      stats.failures += 1;
      console.error(`payload ${image.imageId}:`, error instanceof Error ? error.message : error);
    }
  }
  let vectorSize: number | undefined;

  for (const [index, image] of toEmbed.entries()) {
    const product = productsById.get(image.productId);
    if (!product) {
      stats.failures += 1;
      continue;
    }
    try {
      const bytes = await fs.readFile(image.imagePath);
      const vector = await embeddingProvider.embedImage({
        bytes,
        mimeType: image.mimeType,
      });
      if (!vectorSize) {
        vectorSize = vector.length;
        await ensureCollection(vectorSize);
      }
      await qdrant.upsert(appConfig.qdrantCollection, {
        wait: true,
        points: [
          {
            id: pointIdFromContentHash(image.contentHash),
            vector,
            payload: toPointPayload(product, image, embeddingProvider.modelId),
          },
        ],
      });
      indexed.add(hashKey(image.contentHash, embeddingProvider.modelId));
      stats.embeddingsGenerated += 1;
      console.log(`indexed ${index + 1}/${toEmbed.length} ${image.imageId}`);
    } catch (error) {
      stats.failures += 1;
      console.error(`failed ${image.imageId}:`, error instanceof Error ? error.message : error);
    }
  }

  return stats;
}
