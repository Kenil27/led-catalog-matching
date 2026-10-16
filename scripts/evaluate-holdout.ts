import fs from "node:fs/promises";
import path from "node:path";
import { appConfig, loadLocalEnvFile } from "@/lib/config";
import { GeminiEmbeddingProvider } from "@/lib/embeddings/gemini";
import type { CatalogProductImage } from "@/lib/ingest/core/types";
import { retrieveIndexedVector } from "@/lib/qdrant/vectors";
import { searchProducts } from "@/lib/search/search-products";

loadLocalEnvFile();

type EvalCase = {
  queryImage: string;
  expectedProductId: string;
  source?: string;
};

type CaseResult = EvalCase & {
  top1: boolean;
  top3: boolean;
  top5: boolean;
  topProductIds: string[];
  top1Score?: number;
};

function accuracy(results: CaseResult[], k: 1 | 3 | 5): number {
  if (results.length === 0) return 0;
  const key = k === 1 ? "top1" : k === 3 ? "top3" : "top5";
  return results.filter((result) => result[key]).length / results.length;
}

async function loadCatalogImages(): Promise<CatalogProductImage[]> {
  const file = path.join(appConfig.extractedDir, "product-images.jsonl");
  const text = await fs.readFile(file, "utf8");
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CatalogProductImage);
}

function holdoutCases(
  images: CatalogProductImage[],
): Array<EvalCase & { excludeImageId: string; contentHash: string }> {
  const byProduct = new Map<string, CatalogProductImage[]>();
  for (const image of images) {
    const list = byProduct.get(image.productId) ?? [];
    list.push(image);
    byProduct.set(image.productId, list);
  }
  const cases: Array<EvalCase & { excludeImageId: string; contentHash: string }> = [];
  for (const [productId, group] of byProduct) {
    const lifestyle = group.find((image) => image.view === "lifestyle");
    const studio = group.find((image) => image.view === "studio");
    if (!lifestyle || !studio) continue;
    cases.push({
      queryImage: lifestyle.imagePath,
      expectedProductId: productId,
      source: "catalog-holdout-lifestyle-to-studio",
      excludeImageId: lifestyle.imageId,
      contentHash: lifestyle.contentHash,
    });
  }
  return cases;
}

async function loadCustomerCases(): Promise<EvalCase[]> {
  const manifestPath = path.join(process.cwd(), "data/eval/customer/manifest.json");
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
      cases?: EvalCase[];
    };
    return (manifest.cases ?? []).filter((item) => item.queryImage && item.expectedProductId);
  } catch {
    return [];
  }
}

async function runHoldout(
  cases: Array<EvalCase & { excludeImageId: string; contentHash: string }>,
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const item of cases) {
    const search = await searchProducts({
      queryVector: await retrieveIndexedVector(item.contentHash),
      limit: 5,
      excludeImageIds: [item.excludeImageId],
    });
    const ids = search.results.map((result) => result.productId);
    results.push({
      ...item,
      top1: ids[0] === item.expectedProductId,
      top3: ids.slice(0, 3).includes(item.expectedProductId),
      top5: ids.slice(0, 5).includes(item.expectedProductId),
      topProductIds: ids,
      top1Score: search.results[0]?.similarityScore,
    });
  }
  return results;
}

async function runCases(
  cases: Array<EvalCase & { excludeImageId?: string }>,
  provider: GeminiEmbeddingProvider,
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const item of cases) {
    const bytes = await fs.readFile(item.queryImage);
    const mimeType = item.queryImage.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const search = await searchProducts({
      imageBytes: bytes,
      mimeType,
      embeddingProvider: provider,
      limit: 5,
      excludeImageIds: item.excludeImageId ? [item.excludeImageId] : [],
    });
    const ids = search.results.map((result) => result.productId);
    results.push({
      ...item,
      top1: ids[0] === item.expectedProductId,
      top3: ids.slice(0, 3).includes(item.expectedProductId),
      top5: ids.slice(0, 5).includes(item.expectedProductId),
      topProductIds: ids,
      top1Score: search.results[0]?.similarityScore,
    });
  }
  return results;
}

function holdoutViability(results: CaseResult[]): string {
  if (results.length === 0) {
    return "Holdout could not run (need products with both lifestyle and studio views).";
  }
  const geo = results.filter((result) => catalogKey(result.expectedProductId).startsWith("geo-liting"));
  const glitteron = results.filter((result) => !catalogKey(result.expectedProductId).startsWith("geo-liting"));
  const geoTop5 = accuracy(geo, 5);
  const allTop5 = accuracy(results, 5);
  const parts = [
    `Overall top-5 is ${(allTop5 * 100).toFixed(1)}% across ${results.length} holdout cases.`,
  ];
  if (geo.length) {
    parts.push(
      geoTop5 >= 0.7
        ? `Geo Liting remains viable on this protocol (top-5 ${(geoTop5 * 100).toFixed(1)}%, ${geo.length} cases).`
        : `Geo Liting holdout dropped below the 70% top-5 bar (${(geoTop5 * 100).toFixed(1)}%).`,
    );
  }
  if (glitteron.length) {
    parts.push(
      `GlitterOn ceiling/chandelier/floor pages are harder: many fixtures share a silhouette, and lifestyle room photos often neighbor other rooms before the same product's studio shot (${glitteron.length} cases).`,
    );
  }
  parts.push(
    "This is **not** customer-photo accuracy. Do not treat these numbers as production quality until field images are labeled.",
  );
  return parts.join(" ");
}

function catalogKey(productId: string): string {
  const match = productId.match(/^(.*?)-p\d+-/);
  return match?.[1] ?? "unknown";
}

function formatByCatalog(results: CaseResult[]): string {
  const groups = new Map<string, CaseResult[]>();
  for (const result of results) {
    const key = catalogKey(result.expectedProductId);
    const list = groups.get(key) ?? [];
    list.push(result);
    groups.set(key, list);
  }
  if (groups.size === 0) return "";
  const rows = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, group]) =>
        `| ${key} | ${group.length} | ${(accuracy(group, 1) * 100).toFixed(1)}% | ${(accuracy(group, 3) * 100).toFixed(1)}% | ${(accuracy(group, 5) * 100).toFixed(1)}% |`,
    );
  return [
    "### Holdout by catalog",
    "",
    "| Catalog | Cases | Top-1 | Top-3 | Top-5 |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

function formatSection(title: string, results: CaseResult[]): string {
  const top1 = accuracy(results, 1);
  const top3 = accuracy(results, 3);
  const top5 = accuracy(results, 5);
  const lines = [
    `## ${title}`,
    "",
    `Cases: ${results.length}`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Top-1 | ${(top1 * 100).toFixed(1)}% |`,
    `| Top-3 | ${(top3 * 100).toFixed(1)}% |`,
    `| Top-5 | ${(top5 * 100).toFixed(1)}% |`,
    "",
    "Per-case:",
    "",
    "```text",
    "query-image\texpected-productId\ttop-1\ttop-3\ttop-5",
    ...results.map(
      (result) =>
        `${result.queryImage}\t${result.expectedProductId}\t${result.top1}\t${result.top3}\t${result.top5}`,
    ),
    "```",
    "",
  ];
  return lines.join("\n");
}

async function main(): Promise<void> {
  const images = await loadCatalogImages();
  const holdout = await runHoldout(holdoutCases(images));
  const customerCases = await loadCustomerCases();
  const customer =
    customerCases.length === 0
      ? []
      : await runCases(customerCases, new GeminiEmbeddingProvider());

  const md = [
    "# Retrieval evaluation",
    "",
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "Match levels used by `/api/search` are uncalibrated Phase 1 buckets (`high >= 0.75`, `possible >= 0.60`, else `low`). They are not probabilities.",
    "",
    "## CATALOG HOLDOUT EVALUATION",
    "",
    "This is **not** customer-photo accuracy.",
    "",
    "Protocol: lifestyle catalog image queries the index using its **already-indexed vector** (no second Gemini embed); the query image itself is excluded; success is retrieving the same `productId` (typically via its studio view).",
    "",
    formatSection("Holdout metrics", holdout),
    formatByCatalog(holdout),
    "## Customer-photo evaluation",
    "",
    customer.length === 0
      ? "No customer photos in `data/eval/customer/manifest.json`. Structure is ready; add `{ queryImage, expectedProductId }` cases later without changing retrieval code."
      : formatSection("Customer metrics", customer),
    "",
    "## Viability",
    "",
    holdoutViability(holdout),
    "",
  ].join("\n");

  await fs.writeFile(path.join(process.cwd(), "docs/retrieval-evaluation.md"), md);
  console.log(md);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
