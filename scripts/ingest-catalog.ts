import fs from "node:fs/promises";
import path from "node:path";
import { appConfig, loadLocalEnvFile } from "@/lib/config";
import { GeminiEmbeddingProvider } from "@/lib/embeddings/gemini";
import {
  indexNormalizedCatalog,
  mergeNormalizedCatalogs,
  normalizeCatalog,
  writeCatalogSidecars,
} from "@/lib/ingest/core/pipeline";
import type { NormalizedCatalog } from "@/lib/ingest/core/types";

loadLocalEnvFile();

async function findCatalogPdfs(): Promise<string[]> {
  const dir = path.resolve(appConfig.catalogPdfDir);
  const entries = await fs.readdir(dir).catch(() => []);
  const pdfs = entries
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b));
  if (pdfs.length === 0) {
    throw new Error(`No PDF found in ${dir}.`);
  }
  return pdfs.map((name) => path.join(dir, name));
}

async function main(): Promise<void> {
  const pdfs = await findCatalogPdfs();
  const catalogs: NormalizedCatalog[] = [];
  for (const pdfPath of pdfs) {
    console.log(`extracting ${pdfPath}`);
    const catalog = await normalizeCatalog(pdfPath);
    console.log(`extract stats ${path.basename(pdfPath)}`, catalog.stats);
    catalogs.push(catalog);
  }

  const merged = mergeNormalizedCatalogs(catalogs);
  await writeCatalogSidecars(merged);
  console.log("merged extract stats", merged.stats);

  if (!appConfig.geminiApiKey) {
    console.log("GEMINI_API_KEY missing — extraction only. Embeddings were not generated.");
    return;
  }

  const provider = new GeminiEmbeddingProvider();
  const stats = await indexNormalizedCatalog(merged, provider);
  console.log("ingest stats", {
    totalPages: stats.totalPages,
    imagesDiscovered: stats.imagesDiscovered,
    imagesRejected: stats.imagesRejected,
    productsDiscovered: stats.productsDiscovered,
    productImagesIndexed: stats.productImagesMapped,
    embeddingsGenerated: stats.embeddingsGenerated,
    duplicatesSkipped: stats.duplicatesSkipped,
    failures: stats.failures,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
